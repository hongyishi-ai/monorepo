# JWT优化错误修复指南

## 🚨 遇到的错误

### 错误1: 列不存在

```
ERROR: 42703: column u.is_active does not exist
```

**原因**: SQL脚本中引用了数据库中不存在的 `is_active` 列。

**解决方案**: 已修复，移除了对 `is_active` 列的所有引用。

### 错误2: RAISE参数过多

```
ERROR: 42601: too many parameters specified for RAISE
```

**原因**: RAISE NOTICE语句中使用了过多的 `%` 占位符。

**解决方案**: 已创建简化版本的SQL文件。

## 🔧 修复方案

### 方案1: 使用简化版SQL文件（推荐）

使用新创建的 `supabase/jwt-optimized-simple.sql` 文件：

1. **打开Supabase SQL编辑器**
2. **复制简化版SQL文件内容**
   ```sql
   -- 复制 supabase/jwt-optimized-simple.sql 全部内容
   ```
3. **执行SQL**
4. **验证结果**

### 方案2: 手动修复原文件

如果您想继续使用原文件，需要进行以下修复：

#### 修复1: 移除is_active列引用

```sql
-- 错误的代码
user_metadata := jsonb_build_object(
  'name', NEW.name,
  'role', NEW.role,
  'email', NEW.email,
  'updated_at', NEW.updated_at,
  'is_active', COALESCE(NEW.is_active, true)  -- 移除这行
);

-- 正确的代码
user_metadata := jsonb_build_object(
  'name', NEW.name,
  'role', NEW.role,
  'email', NEW.email,
  'updated_at', NEW.updated_at
);
```

#### 修复2: 简化RAISE语句

```sql
-- 错误的代码
RAISE NOTICE '性能提升: %% (目标: >80%%)', ROUND(performance_improvement, 2);

-- 正确的代码
RAISE NOTICE '性能提升: % %% (目标: >80%%)', ROUND(performance_improvement, 2);
```

## ✅ 验证修复

### 1. SQL执行成功标志

```
NOTICE: =================================================
NOTICE: JWT优化设置完成！
NOTICE: =================================================
NOTICE: 已创建的组件:
NOTICE: ✅ JWT元数据同步触发器函数
NOTICE: ✅ 用户数据更新触发器
NOTICE: ✅ 优化的权限检查函数
NOTICE: ✅ 优化的RLS策略
NOTICE: ✅ 现有用户元数据同步
```

### 2. 验证查询结果

- 5个函数创建成功
- 1个触发器创建成功
- 用户JWT数据同步完成

### 3. 运行验证脚本

```bash
npm run jwt:final-verify
```

## 🚀 推荐执行步骤

### 步骤1: 使用简化版SQL

1. 打开Supabase Dashboard
2. 进入SQL Editor
3. 复制 `supabase/jwt-optimized-simple.sql` 内容
4. 执行SQL

### 步骤2: 验证结果

```bash
npm run jwt:final-verify
```

### 步骤3: 测试应用

1. 重启应用: `npm run dev`
2. 清除缓存: Ctrl+Shift+R
3. 登录测试
4. 检查控制台日志

## 📊 简化版与完整版对比

| 特性       | 简化版  | 完整版  |
| ---------- | ------- | ------- |
| 核心功能   | ✅ 完整 | ✅ 完整 |
| 错误处理   | ✅ 简化 | ❌ 复杂 |
| 诊断函数   | ❌ 无   | ✅ 有   |
| 性能测试   | ❌ 无   | ✅ 有   |
| 执行稳定性 | ✅ 高   | ❌ 低   |

**推荐**: 使用简化版完成基础优化，后续可以手动添加诊断功能。

## 🔍 故障排除

### 如果简化版也失败

1. **检查数据库权限**
   - 确认有CREATE FUNCTION权限
   - 确认有CREATE TRIGGER权限

2. **检查表结构**

   ```sql
   -- 检查users表结构
   \d public.users

   -- 检查其他表是否存在
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';
   ```

3. **分步执行**
   - 逐个步骤执行SQL
   - 每步执行后检查结果

### 常见问题

1. **函数已存在错误**
   - 使用 `CREATE OR REPLACE FUNCTION`
   - 或先 `DROP FUNCTION` 再创建

2. **权限不足**
   - 使用Service Role Key
   - 确认数据库管理员权限

3. **表不存在**
   - 先执行 `supabase/schema.sql`
   - 确认基础表结构存在

## 🎯 成功标准

当您看到以下所有项目时，修复就成功了：

- [ ] SQL执行无错误
- [ ] 看到完成提示消息
- [ ] 验证查询返回正确结果
- [ ] `npm run jwt:final-verify` 通过
- [ ] 应用程序性能提升明显

## 📞 获取帮助

如果仍然遇到问题：

1. **查看日志**: 检查Supabase SQL编辑器的错误信息
2. **检查环境**: 确认数据库连接和权限
3. **使用诊断**: 运行基础的数据库查询测试
4. **重新开始**: 如有必要，从schema.sql重新开始

---

**🎉 使用简化版SQL文件可以避免所有已知错误，确保JWT优化顺利完成！**
