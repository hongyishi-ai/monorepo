# 用户数据修复指南

## 概述

本指南帮助你修复和验证药房库存系统中的用户数据，确保认证系统正常工作。

## 快速修复

### 1. 自动修复（推荐）

运行自动修复脚本：

```bash
npm run fix:users
```

这个脚本会：

- 自动插入/更新所有测试用户
- 验证用户数据完整性
- 检查角色分布
- 确保至少有一个管理员

### 2. 手动修复

如果自动修复失败，可以手动执行：

#### 步骤 1: 在 Supabase SQL 编辑器中运行

```sql
-- 复制 supabase/fix-user-data.sql 的内容到 Supabase SQL 编辑器
-- 或者直接运行以下简化版本：

INSERT INTO public.users (id, email, name, role, created_at, updated_at)
VALUES
  ('507c4d04-ca3b-422a-a0af-e0e0194eba5f'::uuid, 'admin@pharmacy.com', '系统管理员', 'admin', NOW(), NOW()),
  ('a20b17a3-7f4f-4e5c-9219-0394b5ed1c32'::uuid, 'manager@pharmacy.com', '药房经理', 'manager', NOW(), NOW()),
  ('75fba74b-a048-4d7c-854e-cca53d206d45'::uuid, 'operator@pharmacy.com', '操作员', 'operator', NOW(), NOW()),
  ('328eb867-7edf-4348-8cb1-594690a1ecf6'::uuid, 'operator2@pharmacy.com', '操作员2', 'operator', NOW(), NOW()),
  ('4bd14e28-ebe5-4d63-be73-0e86400c8302'::uuid, 'admin@example.com', '备用管理员', 'admin', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();
```

#### 步骤 2: 验证修复结果

```bash
npm run verify:users
```

## 测试用户信息

修复完成后，你可以使用以下账户登录：

### 管理员账户

- **Email**: admin@pharmacy.com
- **Password**: Admin123!
- **权限**: 所有功能

### 经理账户

- **Email**: manager@pharmacy.com
- **Password**: Manager123!
- **权限**: 库存管理、报表、数据导入导出

### 操作员账户

- **Email**: operator@pharmacy.com
- **Password**: Operator123!
- **权限**: 基本入库出库操作

### 操作员2账户

- **Email**: operator2@pharmacy.com
- **Password**: Operator123!
- **权限**: 基本入库出库操作

### 备用管理员账户

- **Email**: admin@example.com
- **Password**: Admin123!
- **权限**: 所有功能

## 故障排除

### 问题 1: 用户不存在

**症状**: 登录时提示"用户不存在"

**解决方案**:

1. 检查 Supabase Auth 面板中是否有该用户
2. 如果没有，需要在 Auth 面板中创建用户
3. 运行 `npm run fix:users` 同步到 public.users 表

### 问题 2: 密码错误

**症状**: 登录时提示"密码错误"

**解决方案**:

1. 在 Supabase Auth 面板中重置用户密码
2. 使用上面提供的默认密码

### 问题 3: 权限不足

**症状**: 登录后无法访问某些功能

**解决方案**:

1. 检查 public.users 表中用户的 role 字段
2. 运行以下 SQL 更新用户角色：

```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'admin@pharmacy.com';
```

### 问题 4: UUID 不匹配

**症状**: Auth 用户存在但 public.users 中没有对应记录

**解决方案**:

1. 在 Supabase Auth 面板中查看用户的实际 UUID
2. 更新 `ACTUAL_TEST_USERS.md` 中的 UUID
3. 重新运行 `npm run fix:users`

## 验证步骤

修复完成后，按以下步骤验证：

### 1. 数据库验证

```bash
# 验证用户数据
npm run verify:users

# 验证认证配置
npm run test:auth
```

### 2. 登录测试

1. 启动开发服务器：`npm run dev`
2. 访问 http://localhost:5173
3. 使用每个测试账户登录
4. 验证相应的权限和功能

### 3. 权限测试

- **管理员**: 应该能访问用户管理页面
- **经理**: 应该能访问报表和数据导入导出
- **操作员**: 只能进行基本的入库出库操作

## 常用命令

```bash
# 修复用户数据
npm run fix:users

# 验证用户数据
npm run verify:users

# 测试认证配置
npm run test:auth

# 创建新的测试用户
npm run create:test-users

# 重置开发数据
npm run reset:dev-data
```

## 联系支持

如果遇到无法解决的问题：

1. 检查 Supabase 项目状态
2. 确认环境变量配置正确
3. 查看浏览器控制台错误信息
4. 检查 Supabase 日志

## 安全注意事项

- 生产环境中请更改默认密码
- 定期检查用户权限设置
- 监控异常登录活动
- 备份用户数据
