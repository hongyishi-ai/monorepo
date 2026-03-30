/**
 * 认证配置文件
 * 定义测试用户和认证状态文件路径
 */

export const authFile = 'tests/e2e/auth/user.json';

export const testUsers = {
  admin: {
    email: 'admin@pharmacy.com',
    password: 'admin123',
    role: 'admin',
    authFile: 'tests/e2e/auth/admin.json',
  },
  manager: {
    email: 'manager@pharmacy.com',
    password: 'manager123',
    role: 'manager',
    authFile: 'tests/e2e/auth/manager.json',
  },
  operator: {
    email: 'operator@pharmacy.com',
    password: 'operator123',
    role: 'operator',
    authFile: 'tests/e2e/auth/operator.json',
  },
} as const;

export type UserRole = keyof typeof testUsers;

/**
 * 获取指定角色的测试用户信息
 */
export function getTestUser(role: UserRole) {
  return testUsers[role];
}

/**
 * 获取所有测试用户
 */
export function getAllTestUsers() {
  return Object.values(testUsers);
}
