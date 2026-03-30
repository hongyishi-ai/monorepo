/**
 * 认证状态管理 Store
 * 使用 Zustand 管理用户认证状态和操作
 */

import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from 'zustand/middleware';

import { TABLES } from '../lib/db-keys';
import { auth, supabase } from '../lib/supabase';
import type {
  AuthActions,
  AuthState,
  AuthUser,
  LoginCredentials,
  RegisterData,
  UserMetadata,
  UserRole,
} from '../types/auth';
import type { User } from '../types/database';

// 权限层级定义
const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  manager: 2,
  operator: 1,
};

// 权限检查函数
export const checkPermission = (
  requiredRole: UserRole,
  userRole?: UserRole
): boolean => {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

// 简化版本：移除自动初始化，避免时序问题
const initializeSystemSettingsAfterAuth = async (
  user: AuthUser
): Promise<void> => {
  // 苹果/谷歌最佳实践：不要在认证流程中做复杂操作
  // 系统设置应该由管理员在需要时手动初始化
  console.log(`✅ 用户 ${user.profile?.name} (${user.profile?.role}) 认证完成`);
};

// 认证 Store 类型
type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // 初始状态
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        isInitializing: true,
        isProfileLoading: false,
        error: null,

        // 登录操作
        signIn: async (credentials: LoginCredentials) => {
          try {
            set({ isLoading: true, error: null });

            const { data, error } = await auth.signInWithEmail(
              credentials.email,
              credentials.password
            );

            if (error) throw error;

            if (data.user) {
              // 优先从JWT元数据中获取角色信息
              const jwtRole = data.user.user_metadata?.role as UserRole;
              const jwtName = data.user.user_metadata?.name;

              console.log('JWT元数据:', data.user.user_metadata);

              // 如果JWT中有完整的角色信息，直接使用
              if (
                jwtRole &&
                ['admin', 'manager', 'operator'].includes(jwtRole)
              ) {
                const authUser: AuthUser = {
                  ...data.user,
                  profile: {
                    id: data.user.id,
                    email: data.user.email || '',
                    name: jwtName || data.user.email?.split('@')[0] || '用户',
                    role: jwtRole,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    last_login: null,
                  },
                  role: jwtRole,
                };

                set({
                  user: authUser,
                  session: data.session,
                  isAuthenticated: true,
                  isLoading: false,
                  isProfileLoading: false,
                  error: null,
                });

                console.log('使用JWT中的用户信息:', authUser);
                return;
              }

              // 如果JWT中没有角色信息，回退到数据库查询
              set({ isProfileLoading: true });

              const basicAuthUser: AuthUser = {
                ...data.user,
                profile: undefined,
                role: undefined,
              };

              set({
                user: basicAuthUser,
                session: data.session,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });

              // 获取用户业务信息并同步到JWT
              try {
                const profile = await getUserProfile(data.user.id);
                if (profile) {
                  // 同步用户信息到JWT元数据
                  await syncUserMetadataToJWT(profile);

                  const updatedAuthUser: AuthUser = {
                    ...data.user,
                    profile,
                    role: profile.role,
                  };
                  set({
                    user: updatedAuthUser,
                    isProfileLoading: false,
                  });
                  console.log('用户业务信息加载完成并同步到JWT:', profile);
                } else {
                  console.warn('未找到用户业务信息，保持当前认证状态');
                  set({
                    isProfileLoading: false,
                  });
                }
              } catch (profileError) {
                console.error('获取用户业务信息失败:', profileError);
                set({
                  isProfileLoading: false,
                });
              }
            }
          } catch (error: unknown) {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              isProfileLoading: false,
              error: error instanceof Error ? error.message : '登录失败',
            });
            throw error;
          }
        },

        // 注册操作
        signUp: async (data: RegisterData) => {
          try {
            set({ isLoading: true, error: null });

            // 在JWT元数据中包含完整的用户信息
            const userMetadata = {
              name: data.name,
              role: data.role,
              email: data.email,
              is_active: true,
            };

            const { data: authData, error } = await auth.signUpWithEmail(
              data.email,
              data.password,
              userMetadata
            );

            if (error) throw error;

            if (authData.user) {
              // 创建用户业务信息
              await createUserProfile(authData.user.id, {
                email: data.email,
                name: data.name,
                role: data.role,
              });

              set({
                isLoading: false,
                error: null,
              });

              console.log('用户注册成功，JWT元数据已设置:', userMetadata);
            }
          } catch (error: unknown) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : '注册失败',
            });
            throw error;
          }
        },

        // 退出登录
        signOut: async () => {
          try {
            set({ isLoading: true });

            const { error } = await auth.signOut();
            if (error) throw error;

            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              isProfileLoading: false,
              error: null,
            });
          } catch (error: unknown) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : '退出登录失败',
            });
            throw error;
          }
        },

        // 重置密码
        resetPassword: async (email: string) => {
          try {
            set({ isLoading: true, error: null });

            const { error } = await auth.resetPassword(email);
            if (error) throw error;

            set({ isLoading: false });
          } catch (error: unknown) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : '重置密码失败',
            });
            throw error;
          }
        },

        // 更新用户信息
        updateProfile: async (data: Partial<UserMetadata>) => {
          try {
            const { user } = get();
            if (!user) throw new Error('用户未登录');

            set({ isLoading: true, error: null });

            // 更新认证用户信息
            const { error: authError } = await auth.updateUser({
              data: data,
            });

            if (authError) throw authError;

            // 更新业务用户信息
            if (user.profile) {
              await updateUserProfile(user.profile.id, data);
            }

            // 刷新用户信息
            await get().refreshUser();

            set({ isLoading: false });
          } catch (error: unknown) {
            set({
              isLoading: false,
              error:
                error instanceof Error ? error.message : '更新用户信息失败',
            });
            throw error;
          }
        },

        // 刷新用户信息
        refreshUser: async () => {
          try {
            const { data, error } = await auth.getCurrentUser();
            if (error) throw error;

            if (data.user) {
              const profile = await getUserProfile(data.user.id);
              const authUser: AuthUser = {
                ...data.user,
                profile,
                role: profile?.role,
              };

              set({
                user: authUser,
                isAuthenticated: true,
              });
            } else {
              set({
                user: null,
                session: null,
                isAuthenticated: false,
              });
            }
          } catch (error: unknown) {
            console.error('刷新用户信息失败:', error);
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              error:
                error instanceof Error ? error.message : '刷新用户信息失败',
            });
          }
        },

        // 清除错误
        clearError: () => set({ error: null }),

        // 设置用户
        setUser: (user: AuthUser | null) =>
          set({
            user,
            isAuthenticated: !!user,
          }),

        // 设置会话
        setSession: (session: Session | null) => set({ session }),

        // 设置加载状态
        setLoading: (isLoading: boolean) => set({ isLoading }),

        // 设置错误
        setError: (error: string | null) => set({ error }),

        // 设置权限信息加载状态
        setProfileLoading: (isProfileLoading: boolean) =>
          set({ isProfileLoading }),
      }),
      {
        name: 'pharmacy-auth-storage',
        storage: createJSONStorage(() => localStorage),
        // 只持久化必要的状态
        partialize: state => ({
          user: state.user,
          session: state.session,
          isAuthenticated: state.isAuthenticated,
        }),
        // 版本控制
        version: 1,
        // 迁移函数
        migrate: (persistedState: unknown, version: number) => {
          if (version === 0) {
            // 从版本0迁移到版本1的逻辑
            return persistedState;
          }
          return persistedState;
        },
      }
    )
  )
);

// 用户信息缓存，避免重复查询
const userProfileCache = new Map<
  string,
  { data: User | undefined; timestamp: number; isSuccess: boolean }
>();
const CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存（成功时）
const FAILED_CACHE_DURATION = 2 * 60 * 1000; // 2分钟缓存（失败时）

// 正在获取用户信息的Promise缓存，避免并发请求
const pendingRequests = new Map<string, Promise<User | undefined>>();

// 获取用户业务信息
async function getUserProfile(
  userId: string,
  forceRefresh = false
): Promise<User | undefined> {
  try {
    // 检查是否有正在进行的请求
    if (!forceRefresh && pendingRequests.has(userId)) {
      console.log('等待正在进行的用户信息查询:', userId);
      return await pendingRequests.get(userId);
    }

    // 检查缓存
    if (!forceRefresh) {
      const cached = userProfileCache.get(userId);
      if (cached) {
        const cacheAge = Date.now() - cached.timestamp;
        const maxAge = cached.isSuccess
          ? CACHE_DURATION
          : FAILED_CACHE_DURATION;

        if (cacheAge < maxAge) {
          console.log(
            `使用缓存的用户信息 (${cached.isSuccess ? '成功' : '失败'}):`,
            userId
          );
          return cached.data;
        }
      }
    }

    console.log('开始查询用户信息:', userId);

    // 创建查询Promise并缓存
    const queryPromise = (async (): Promise<User | undefined> => {
      try {
        // 设置15秒超时，给数据库更多时间
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`查询用户信息超时 (15秒) - 用户ID: ${userId}`));
          }, 15000);
        });

        const queryPromise = supabase
          .from(TABLES.users)
          .select('*')
          .eq('id', userId)
          .single();

        const { data, error } = await Promise.race([
          queryPromise,
          timeoutPromise,
        ]);

        if (error) {
          console.error('获取用户信息失败:', error);

          // 如果是因为找不到用户记录，尝试创建默认用户记录
          if (error.code === 'PGRST116') {
            console.log('用户记录不存在，尝试创建默认用户记录...');
            try {
              // 获取认证用户的基本信息
              const { data: authUser } = await supabase.auth.getUser();
              if (authUser.user && authUser.user.id === userId) {
                // 从用户元数据中获取角色，如果没有则从系统设置获取默认角色
                const userRole = authUser.user.user_metadata?.role;

                // 如果用户元数据中没有角色信息，尝试从系统设置获取默认角色
                let defaultRole = 'operator'; // 最后的回退值
                try {
                  const { data: setting } = await supabase
                    .from(TABLES.systemSettings)
                    .select('value')
                    .eq('key', 'default_user_role')
                    .single();
                  if (setting?.value) {
                    defaultRole = setting.value;
                  }
                } catch {
                  console.warn('获取默认用户角色设置失败，使用系统默认值');
                }

                const finalRole = userRole || defaultRole;

                const defaultUser = {
                  id: userId,
                  email: authUser.user.email || '',
                  name:
                    authUser.user.user_metadata?.name ||
                    authUser.user.email?.split('@')[0] ||
                    '用户',
                  role: finalRole as UserRole,
                };

                const { data: newUser, error: createError } = await supabase
                  .from(TABLES.users)
                  .insert(defaultUser)
                  .select()
                  .single();

                if (createError) {
                  console.error('创建默认用户记录失败:', createError);
                  // 缓存失败结果，但时间较短
                  userProfileCache.set(userId, {
                    data: undefined,
                    timestamp: Date.now(),
                    isSuccess: false,
                  });
                  return undefined;
                }

                console.log('默认用户记录创建成功:', newUser);
                // 缓存新创建的用户信息
                userProfileCache.set(userId, {
                  data: newUser,
                  timestamp: Date.now(),
                  isSuccess: true,
                });
                return newUser;
              }
            } catch (createError) {
              console.error('创建默认用户记录异常:', createError);
            }
          }

          // 对于超时错误，不缓存失败结果，允许重试
          if (error.message && error.message.includes('超时')) {
            console.warn('查询超时，不缓存失败结果，允许后续重试');
            return undefined;
          }

          // 其他错误缓存失败结果，但时间较短
          userProfileCache.set(userId, {
            data: undefined,
            timestamp: Date.now(),
            isSuccess: false,
          });
          return undefined;
        }

        console.log('用户信息查询成功:', data);
        // 缓存成功结果，时间较长
        userProfileCache.set(userId, {
          data,
          timestamp: Date.now(),
          isSuccess: true,
        });
        return data;
      } finally {
        // 清理pending请求
        pendingRequests.delete(userId);
      }
    })();

    // 缓存pending请求
    pendingRequests.set(userId, queryPromise);

    return await queryPromise;
  } catch (error) {
    console.error('获取用户信息异常:', error);

    // 提供更友好的错误信息
    if (error instanceof Error) {
      if (error.message.includes('超时')) {
        console.error('建议检查网络连接或数据库性能');
      } else if (error.message.includes('Auth session missing')) {
        console.error('用户未登录，请先进行登录操作');
      }
    }

    // 清理pending请求
    pendingRequests.delete(userId);
    return undefined;
  }
}

// 创建用户业务信息
async function createUserProfile(
  userId: string,
  profileData: { email: string; name: string; role: UserRole }
): Promise<void> {
  try {
    const { error } = await supabase.from(TABLES.users).insert({
      id: userId,
      email: profileData.email,
      name: profileData.name,
      role: profileData.role,
    });

    if (error) throw error;
  } catch (error) {
    console.error('创建用户信息失败:', error);
    throw error;
  }
}

// 同步用户元数据到JWT
async function syncUserMetadataToJWT(user: User): Promise<void> {
  try {
    const metadata = {
      name: user.name,
      role: user.role,
      email: user.email,
      updated_at: user.updated_at,
      is_active: user.is_active,
    };

    const { error } = await auth.updateUser({
      data: metadata,
    });

    if (error) {
      console.warn('同步用户元数据到JWT失败:', error);
    } else {
      console.log('用户元数据已同步到JWT:', metadata);
    }
  } catch (error) {
    console.warn('同步用户元数据到JWT异常:', error);
  }
}

// 更新用户业务信息
async function updateUserProfile(
  userId: string,
  profileData: Partial<UserMetadata>
): Promise<void> {
  try {
    const updateData: Record<string, unknown> = {};

    if (profileData.name) updateData.name = profileData.name;
    if (profileData.role) updateData.role = profileData.role;

    const { error } = await supabase
      .from(TABLES.users)
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;

    // 更新成功后，同步到JWT元数据
    const { data: updatedUser } = await supabase
      .from(TABLES.users)
      .select('*')
      .eq('id', userId)
      .single();

    if (updatedUser) {
      await syncUserMetadataToJWT(updatedUser);
    }
  } catch (error) {
    console.error('更新用户信息失败:', error);
    throw error;
  }
}

// 初始化认证状态
export const initializeAuth = async () => {
  const store = useAuthStore.getState();

  try {
    store.setLoading(true);

    // 获取当前会话
    const {
      data: { session },
      error,
    } = await auth.getCurrentSession();

    if (error) {
      console.error('获取会话失败:', error);
      store.setError(error.message);
      return;
    }

    if (session?.user) {
      // 检查是否已经有用户信息（从持久化存储中恢复）
      const currentUser = store.user;
      if (
        currentUser &&
        currentUser.id === session.user.id &&
        currentUser.role
      ) {
        console.log('初始化: 用户信息已存在，跳过重新获取');
        store.setSession(session);
        console.log('初始化基本认证状态完成');
        return;
      }

      // 设置权限信息加载状态
      store.setProfileLoading(true);

      // 先设置基本认证状态，但不设置默认角色
      const basicAuthUser: AuthUser = {
        ...session.user,
        profile: undefined,
        role: undefined, // 不设置默认角色，等待真实角色加载
      };
      store.setUser(basicAuthUser);
      store.setSession(session);

      console.log('初始化基本认证状态完成');

      // 优先从JWT元数据获取用户信息
      const jwtRole = session.user.user_metadata?.role as UserRole;
      const jwtName = session.user.user_metadata?.name;

      if (jwtRole && ['admin', 'manager', 'operator'].includes(jwtRole)) {
        // 使用JWT中的信息，无需查询数据库
        const authUser: AuthUser = {
          ...session.user,
          profile: {
            id: session.user.id,
            email: session.user.email || '',
            name: jwtName || session.user.email?.split('@')[0] || '用户',
            role: jwtRole,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_login: null,
          },
          role: jwtRole,
        };

        store.setUser(authUser);
        store.setProfileLoading(false);
        console.log('初始化: 使用JWT中的用户信息:', authUser);
      } else {
        // 回退到数据库查询
        try {
          const profile = await getUserProfile(session.user.id, false);
          if (profile) {
            // 同步到JWT以便下次使用
            await syncUserMetadataToJWT(profile);

            const updatedAuthUser: AuthUser = {
              ...session.user,
              profile,
              role: profile.role,
            };
            store.setUser(updatedAuthUser);
            store.setProfileLoading(false);
            console.log('初始化用户业务信息加载完成并同步到JWT:', profile);
          } else {
            console.warn('初始化时未找到用户业务信息，保持当前认证状态');
            store.setProfileLoading(false);
          }
        } catch (profileError) {
          console.error('初始化时获取用户业务信息失败:', profileError);
          store.setProfileLoading(false);
        }
      }
    } else {
      store.setUser(null);
      store.setSession(null);
    }
  } catch (error: unknown) {
    console.error('初始化认证状态失败:', error);
    store.setError(
      error instanceof Error ? error.message : '初始化认证状态失败'
    );
  } finally {
    store.setLoading(false);
    useAuthStore.setState({ isInitializing: false });
  }
};

// 防止重复处理的状态跟踪
let isProcessingAuth = false;
let lastProcessedUserId: string | null = null;
let lastProcessedEvent: string | null = null;

// 监听认证状态变化
export const setupAuthListener = () => {
  const store = useAuthStore.getState();

  const { data } = auth.onAuthStateChange(async (event, session) => {
    console.log('认证状态变化:', event, '用户ID:', session?.user?.id);

    // 防止重复处理相同用户的相同认证事件
    const currentUserId = session?.user?.id;
    if (
      currentUserId === lastProcessedUserId &&
      event === lastProcessedEvent &&
      isProcessingAuth
    ) {
      console.log('跳过重复的认证处理:', event, currentUserId);
      return;
    }

    switch (event) {
      case 'SIGNED_IN':
      case 'INITIAL_SESSION':
        if (session?.user && !isProcessingAuth) {
          isProcessingAuth = true;
          lastProcessedUserId = session.user.id;
          lastProcessedEvent = event;

          try {
            // 对于INITIAL_SESSION，先检查是否已经有用户信息
            const currentUser = store.user;
            if (
              event === 'INITIAL_SESSION' &&
              currentUser &&
              currentUser.id === session.user.id &&
              currentUser.role
            ) {
              console.log('INITIAL_SESSION: 用户信息已存在，跳过重新获取');
              store.setSession(session);
              useAuthStore.setState({ isInitializing: false });
              return;
            }

            // 设置权限信息加载状态
            store.setProfileLoading(true);

            // 先设置基本认证状态，但不设置默认角色
            const basicAuthUser: AuthUser = {
              ...session.user,
              profile: undefined,
              role: undefined, // 不设置默认角色，等待真实角色加载
            };
            store.setUser(basicAuthUser);
            store.setSession(session);

            // 确保初始化状态被重置
            useAuthStore.setState({ isInitializing: false });
            console.log('认证初始化完成');

            // 优先从JWT元数据获取用户信息
            const jwtRole = session.user.user_metadata?.role as UserRole;
            const jwtName = session.user.user_metadata?.name;

            if (jwtRole && ['admin', 'manager', 'operator'].includes(jwtRole)) {
              // 使用JWT中的信息，性能更好
              const authUser: AuthUser = {
                ...session.user,
                profile: {
                  id: session.user.id,
                  email: session.user.email || '',
                  name: jwtName || session.user.email?.split('@')[0] || '用户',
                  role: jwtRole,
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  last_login: null,
                },
                role: jwtRole,
              };

              store.setUser(authUser);
              store.setProfileLoading(false);
              console.log('认证监听器: 使用JWT中的用户信息:', authUser);

              // 在用户认证成功后初始化系统设置
              await initializeSystemSettingsAfterAuth(authUser);
            } else {
              // 回退到数据库查询
              const profile = await getUserProfile(session.user.id, false);
              if (profile) {
                // 同步到JWT以便下次使用
                await syncUserMetadataToJWT(profile);

                const updatedAuthUser: AuthUser = {
                  ...session.user,
                  profile,
                  role: profile.role,
                };
                store.setUser(updatedAuthUser);
                store.setProfileLoading(false);
                console.log('用户业务信息加载完成并同步到JWT:', profile);

                // 在用户认证成功后初始化系统设置
                await initializeSystemSettingsAfterAuth(updatedAuthUser);
              } else {
                console.warn('未找到用户业务信息，保持当前认证状态');
                store.setProfileLoading(false);
              }
            }
          } catch (error) {
            console.error('获取用户业务信息失败:', error);
            // 出错时不要随意更改角色，保持当前认证状态
            store.setProfileLoading(false);
          } finally {
            isProcessingAuth = false;
          }
        }
        break;

      case 'SIGNED_OUT':
        store.setUser(null);
        store.setSession(null);
        store.setProfileLoading(false);
        // 清理缓存和状态
        userProfileCache.clear();
        pendingRequests.clear();
        isProcessingAuth = false;
        lastProcessedUserId = null;
        lastProcessedEvent = null;
        break;

      case 'TOKEN_REFRESHED':
        if (session) {
          store.setSession(session);
        }
        break;

      case 'USER_UPDATED':
        if (session?.user) {
          await store.refreshUser();
        }
        break;

      default:
        break;
    }
  });

  return { data };
};

// 性能优化的选择器 hooks
export const useAuthUser = () => useAuthStore(state => state.user);
export const useAuthSession = () => useAuthStore(state => state.session);
export const useAuthStatus = () =>
  useAuthStore(state => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    isInitializing: state.isInitializing,
    isProfileLoading: state.isProfileLoading,
    error: state.error,
  }));

export const useAuthActions = () =>
  useAuthStore(state => ({
    signIn: state.signIn,
    signUp: state.signUp,
    signOut: state.signOut,
    resetPassword: state.resetPassword,
    updateProfile: state.updateProfile,
    refreshUser: state.refreshUser,
    clearError: state.clearError,
  }));

// 权限检查 hook
export const usePermission = (requiredRole?: UserRole) => {
  const user = useAuthUser();

  if (!requiredRole) return true;
  return checkPermission(requiredRole, user?.role);
};

// 清理用户信息缓存（用于测试或强制刷新）
export const clearUserProfileCache = (userId?: string) => {
  if (userId) {
    userProfileCache.delete(userId);
    pendingRequests.delete(userId);
  } else {
    userProfileCache.clear();
    pendingRequests.clear();
  }
};
