# 管理员登录问题解决方案

## 🔐 问题分析

管理员账户 `admin@pharmacy.com` 无法登录的可能原因：

1. **密码不匹配**: 当前密码可能不是 `Admin123!`
2. **邮箱未确认**: 需要确认邮箱状态
3. **账户被锁定**: 可能由于多次登录失败

## ✅ 解决方案

### 方案 1: 使用 Supabase Dashboard 重置密码

1. **登录 Supabase Dashboard**
   - 访问: https://supabase.com/dashboard
   - 选择 `pharmacy-inventory-system` 项目

2. **重置管理员密码**
   - 进入 `Authentication` → `Users`
   - 找到 `admin@pharmacy.com` 用户
   - 点击用户行，选择 `Reset Password`
   - 设置新密码为: `Admin123!`

3. **确认邮箱状态**
   - 确保 `Email Confirmed` 状态为 `true`
   - 如果未确认，点击 `Confirm Email`

### 方案 2: 使用应用的忘记密码功能

1. **访问登录页面**
   - 打开: http://localhost:5173/
   - 点击 "忘记密码" 链接

2. **重置密码**
   - 输入邮箱: `admin@pharmacy.com`
   - 检查邮箱中的重置链接
   - 设置新密码: `Admin123!`

### 方案 3: 创建新的管理员账户

如果上述方法都不行，可以创建新的管理员账户：

```sql
-- 在 Supabase SQL Editor 中执行
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role
) VALUES (
  gen_random_uuid(),
  'admin2@pharmacy.com',
  crypt('Admin123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated'
);

-- 然后在 public.users 表中添加对应记录
INSERT INTO public.users (
  id,
  email,
  name,
  role
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin2@pharmacy.com'),
  'admin2@pharmacy.com',
  '系统管理员2',
  'admin'
);
```

## 🧪 测试登录

### 测试步骤

1. **打开应用**: http://localhost:5173/
2. **输入凭据**:
   - 邮箱: `admin@pharmacy.com`
   - 密码: `Admin123!`
3. **验证功能**:
   - 检查是否能正常登录
   - 验证管理员权限是否正常
   - 测试各项功能

### 备用测试账户

如果主管理员账户仍有问题，可以使用其他管理员账户：

- **邮箱**: `admin3@pharmacy.com`
- **密码**: 需要在 Supabase Dashboard 中设置

## 🔧 技术细节

### 当前账户状态

```sql
-- 管理员账户信息
SELECT
  id,
  email,
  name,
  role,
  created_at
FROM public.users
WHERE email = 'admin@pharmacy.com';

-- 认证状态
SELECT
  id,
  email,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'admin@pharmacy.com';
```

### 权限验证

管理员账户应该具有以下权限：

- ✅ 查看所有用户
- ✅ 管理药品信息
- ✅ 管理批次信息
- ✅ 查看审计日志
- ✅ 系统设置管理

## 🚨 安全注意事项

1. **密码强度**: 确保使用强密码
2. **定期更换**: 建议定期更换管理员密码
3. **访问监控**: 监控管理员账户的登录活动
4. **备份账户**: 保持至少一个备用管理员账户

## 📞 如果问题持续存在

如果上述方法都无法解决问题，请：

1. **检查网络连接**: 确保能正常访问 Supabase
2. **查看浏览器控制台**: 检查是否有 JavaScript 错误
3. **检查 Supabase 项目状态**: 确认项目运行正常
4. **联系技术支持**: 提供详细的错误信息

---

## 🎯 快速解决步骤

**最推荐的解决方案**:

1. 登录 Supabase Dashboard
2. 进入 Authentication → Users
3. 找到 `admin@pharmacy.com`
4. 重置密码为 `Admin123!`
5. 确认邮箱已验证
6. 测试登录

这应该能解决 99% 的登录问题！
