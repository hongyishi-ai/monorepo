# 数据库设置指南

## 执行顺序

请按照以下顺序在 Supabase SQL 编辑器中执行 SQL 脚本：

### 1. 基础架构

```sql
-- 执行基础数据库架构
-- 文件: supabase/schema.sql
```

### 2. RLS 策略

```sql
-- 执行行级安全策略
-- 文件: supabase/rls-policies.sql
```

### 3. 函数和触发器

```sql
-- 执行函数和触发器
-- 文件: supabase/functions-and-triggers.sql
```

### 4. 审计日志和撤回功能

```sql
-- 执行审计日志和撤回操作功能
-- 文件: supabase/audit-logs-and-undo.sql
```

### 5. 创建用户账户

```sql
-- 创建管理员和操作员账户
-- 文件: supabase/create-users.sql
```

### 6. 种子数据（可选）

```sql
-- 插入测试数据
-- 文件: supabase/seed-data-simple.sql
```

## 重要说明

### 用户账户创建

执行 `create-users.sql` 后，您需要在 Supabase Auth 中创建对应的认证用户：

#### 管理员账户 (3个)

- admin1@pharmacy.com - 系统管理员1
- admin2@pharmacy.com - 系统管理员2
- admin3@pharmacy.com - 系统管理员3

#### 操作员账户 (7个)

- operator1@pharmacy.com - 操作员1
- operator2@pharmacy.com - 操作员2
- operator3@pharmacy.com - 操作员3
- operator4@pharmacy.com - 操作员4
- operator5@pharmacy.com - 操作员5
- operator6@pharmacy.com - 操作员6
- operator7@pharmacy.com - 操作员7

#### 经理账户 (1个)

- manager1@pharmacy.com - 药房经理

### 创建认证用户的步骤

1. 登录 Supabase 控制台
2. 进入 Authentication > Users
3. 点击 "Add user"
4. 输入邮箱和临时密码（建议使用 `pharmacy123`）
5. 在 User Metadata 中添加：
   ```json
   {
     "role": "admin", // 或 "operator", "manager"
     "name": "系统管理员1" // 对应的用户名
   }
   ```
6. 重复以上步骤创建所有用户

### 验证设置

执行以下 SQL 查询验证设置是否正确：

```sql
-- 查看用户统计
SELECT * FROM public.user_statistics;

-- 查看审计日志表结构
\d public.audit_logs;

-- 查看可撤回交易表结构
\d public.undoable_transactions;

-- 测试审计日志功能
SELECT public.log_audit_action(
  '11111111-1111-1111-1111-111111111111'::uuid,
  'test_action',
  'test_table',
  '11111111-1111-1111-1111-111111111111'::uuid,
  '{"test": "old_value"}'::jsonb,
  '{"test": "new_value"}'::jsonb
);

-- 查看审计日志
SELECT * FROM public.audit_logs ORDER BY created_at DESC LIMIT 5;
```

## 功能说明

### 审计日志功能

- 自动记录所有药品、批次、库存交易的操作
- 记录操作用户、时间、操作类型、修改前后的数据
- 支持按用户、操作类型、时间范围筛选
- 支持导出审计日志

### 撤回操作功能

- 出库操作后24小时内可以撤回
- 撤回后自动创建入库记录恢复库存
- 支持查看可撤回交易列表
- 自动清理过期的撤回权限

### 用户权限

- **管理员**: 可以查看所有审计日志，管理用户
- **经理**: 可以查看药品管理、报表等
- **操作员**: 可以进行基本的出入库操作

## 故障排除

### 常见问题

1. **触发器执行失败**
   - 检查是否有足够的权限
   - 确保所有依赖的函数已创建

2. **审计日志不记录**
   - 检查触发器是否正确创建
   - 确保应用中设置了审计上下文

3. **撤回功能不工作**
   - 检查 RLS 策略是否正确
   - 确保用户有相应的权限

4. **用户登录失败**
   - 检查 Supabase Auth 中是否创建了对应的用户
   - 确保用户元数据中的角色信息正确

### 重置数据库

如果需要重置数据库，请按以下顺序删除：

```sql
-- 删除触发器
DROP TRIGGER IF EXISTS audit_medicines_trigger ON public.medicines;
DROP TRIGGER IF EXISTS audit_batches_trigger ON public.batches;
DROP TRIGGER IF EXISTS handle_inventory_transaction_trigger ON public.inventory_transactions;

-- 删除函数
DROP FUNCTION IF EXISTS public.log_audit_action;
DROP FUNCTION IF EXISTS public.undo_outbound_transaction;
DROP FUNCTION IF EXISTS public.get_undoable_transactions;
DROP FUNCTION IF EXISTS public.handle_inventory_transaction;
DROP FUNCTION IF EXISTS public.audit_medicines_changes;
DROP FUNCTION IF EXISTS public.audit_batches_changes;

-- 删除表
DROP TABLE IF EXISTS public.undoable_transactions;
DROP TABLE IF EXISTS public.audit_logs;

-- 然后重新执行设置脚本
```
