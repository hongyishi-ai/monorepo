# 认证系统配置指南

## 概述

本文档描述了药品出入库管理系统的认证系统配置，包括 Supabase 认证设置、用户角色管理、会话管理等功能。

## 认证架构

### 技术栈

- **认证服务**: Supabase Auth
- **状态管理**: Zustand
- **会话管理**: 自定义会话管理器
- **权限控制**: 基于角色的访问控制 (RBAC)

### 用户角色

- **admin (管理员)**: 拥有所有权限，可以管理用户、配置系统
- **manager (库存经理)**: 可以管理药品信息、查看报表、导入导出数据
- **operator (操作员)**: 可以进行基本的入库出库操作

## 文件结构

```
src/
├── lib/
│   ├── supabase.ts          # Supabase 客户端配置
│   └── auth-init.ts         # 认证系统初始化
├── stores/
│   └── auth.store.ts        # 认证状态管理
├── types/
│   └── auth.ts              # 认证相关类型定义
├── utils/
│   ├── auth-utils.ts        # 认证工具函数
│   ├── session-utils.ts     # 会话管理工具
│   └── supabase-utils.ts    # Supabase 工具函数
└── components/
    └── auth/                # 认证相关组件 (待实现)

supabase/
└── auth-setup.sql           # 数据库认证配置

scripts/
└── test-auth-config.js      # 认证配置测试脚本
```

## 配置步骤

### 1. 环境变量配置

在 `.env.development` 文件中配置 Supabase 连接信息：

```bash
# Supabase 配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. 数据库配置

执行 `supabase/auth-setup.sql` 脚本来设置：

- 用户同步触发器
- RLS 安全策略
- 认证相关函数
- 默认系统设置

```sql
-- 在 Supabase SQL Editor 中执行
\i supabase/auth-setup.sql
```

### 3. 系统设置

系统会自动创建以下默认设置：

| 设置键                       | 默认值   | 描述                  |
| ---------------------------- | -------- | --------------------- |
| `expiry_warning_days`        | 30       | 近效期提醒天数        |
| `session_timeout`            | 28800    | 会话超时时间（8小时） |
| `auto_refresh_session`       | true     | 是否自动刷新会话      |
| `password_min_length`        | 8        | 密码最小长度          |
| `require_email_verification` | true     | 是否需要邮箱验证      |
| `allow_self_registration`    | false    | 是否允许自注册        |
| `default_user_role`          | operator | 默认用户角色          |

## 使用方法

### 1. 初始化认证系统

```typescript
import { initializeAuthSystem } from '@/lib/auth-init';

// 在应用启动时调用
await initializeAuthSystem();
```

### 2. 使用认证 Store

```typescript
import { useAuthStore } from '@/stores/auth.store';

function LoginComponent() {
  const { signIn, isLoading, error } = useAuthStore();

  const handleLogin = async (email: string, password: string) => {
    try {
      await signIn({ email, password });
    } catch (error) {
      console.error('登录失败:', error);
    }
  };
}
```

### 3. 权限检查

```typescript
import { hasPermission, hasRole } from '@/utils/auth-utils';
import { useAuthStore } from '@/stores/auth.store';

function ProtectedComponent() {
  const { user } = useAuthStore();

  if (!hasRole(user, 'manager')) {
    return <div>权限不足</div>;
  }

  return (
    <div>
      {hasPermission(user, 'medicine:create') && (
        <button>添加药品</button>
      )}
    </div>
  );
}
```

### 4. 会话管理

```typescript
import { sessionManager, getSessionStatus } from '@/utils/session-utils';
import { useAuthStore } from '@/stores/auth.store';

function SessionMonitor() {
  const { session } = useAuthStore();
  const status = getSessionStatus(session);

  if (status.isExpiringSoon) {
    return <div>会话即将过期，剩余时间：{status.timeRemainingFormatted}</div>;
  }

  return null;
}
```

## 权限系统

### 权限列表

| 权限               | 描述         | 角色           |
| ------------------ | ------------ | -------------- |
| `user:create`      | 创建用户     | admin          |
| `user:read`        | 查看用户     | admin          |
| `user:update`      | 更新用户     | admin          |
| `user:delete`      | 删除用户     | admin          |
| `medicine:create`  | 创建药品     | admin, manager |
| `medicine:read`    | 查看药品     | 所有角色       |
| `medicine:update`  | 更新药品     | admin, manager |
| `medicine:delete`  | 删除药品     | admin          |
| `inventory:create` | 创建库存记录 | 所有角色       |
| `inventory:read`   | 查看库存记录 | 所有角色       |
| `inventory:update` | 更新库存记录 | 所有角色       |
| `inventory:delete` | 删除库存记录 | admin          |
| `report:read`      | 查看报表     | admin, manager |
| `report:export`    | 导出报表     | admin, manager |
| `system:config`    | 系统配置     | admin          |
| `system:backup`    | 系统备份     | admin          |

### RLS 策略

数据库使用行级安全 (RLS) 策略确保数据安全：

1. **用户表**: 用户只能查看自己的信息，管理员可以查看所有用户
2. **药品表**: 所有认证用户可以查看，管理员和经理可以修改
3. **库存表**: 基于用户角色控制访问权限
4. **系统设置**: 只有管理员可以修改

## 会话管理

### 配置选项

```typescript
interface SessionConfig {
  timeout: number; // 会话超时时间（秒）
  refreshThreshold: number; // 刷新阈值（秒）
  autoRefresh: boolean; // 是否自动刷新
  warningThreshold: number; // 警告阈值（秒）
}
```

### 默认配置

- **会话超时**: 8小时
- **自动刷新**: 提前5分钟自动刷新
- **过期警告**: 剩余10分钟时显示警告
- **持久化**: 会话信息保存在 localStorage

## 测试

### 运行认证配置测试

```bash
npm run test:auth
```

测试内容包括：

- 数据库连接
- 认证服务
- 系统设置
- 用户表结构
- RLS 策略
- 认证配置视图
- 数据库函数
- 环境变量

### 测试结果示例

```
🚀 开始认证配置测试...

🧪 测试: 环境变量
✅ 通过: 环境变量

🧪 测试: 数据库连接
✅ 通过: 数据库连接

🧪 测试: 认证服务
✅ 通过: 认证服务

📊 测试结果:
✅ 通过: 8
❌ 失败: 0
📈 成功率: 100.0%

🎉 所有测试通过！认证配置正确。
```

## 安全考虑

### 密码策略

- 最小长度：8位
- 必须包含大写字母
- 必须包含小写字母
- 必须包含数字
- 可选特殊字符

### 会话安全

- JWT 令牌自动刷新
- 会话超时自动登出
- 敏感操作二次确认
- 防止 CSRF 攻击

### 数据安全

- 行级安全策略
- 输入验证和清理
- SQL 注入防护
- 敏感信息加密

## 故障排除

### 常见问题

1. **认证失败**
   - 检查环境变量配置
   - 验证 Supabase 项目设置
   - 确认用户角色正确

2. **权限不足**
   - 检查用户角色
   - 验证 RLS 策略
   - 确认权限配置

3. **会话过期**
   - 检查会话配置
   - 验证令牌刷新机制
   - 确认网络连接

### 调试工具

```typescript
// 启用调试模式
localStorage.setItem('auth-debug', 'true');

// 查看认证状态
console.log(useAuthStore.getState());

// 检查权限
import { createPermissionChecker } from '@/utils/auth-utils';
const checker = createPermissionChecker(user);
console.log(checker.hasPermission('medicine:create'));
```

## 扩展功能

### 计划中的功能

- 多因素认证 (MFA)
- 单点登录 (SSO)
- 审计日志
- 密码策略配置
- 账户锁定机制

### 自定义扩展

- 添加新的用户角色
- 扩展权限系统
- 自定义会话策略
- 集成第三方认证

## 更新日志

### v1.0.0 (当前版本)

- ✅ 基础认证系统
- ✅ 用户角色管理
- ✅ 会话管理
- ✅ 权限控制
- ✅ RLS 安全策略
- ✅ 测试脚本

### 下一版本计划

- 🔄 认证组件实现
- 🔄 用户管理界面
- 🔄 权限管理界面
- 🔄 会话监控界面
