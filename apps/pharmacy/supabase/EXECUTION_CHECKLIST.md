# Supabase Performance Optimization - Execution Checklist

## 🚀 Quick Start Guide

### ⚠️ Pre-Execution Requirements

- [ ] **备份数据库** - 在 Supabase Dashboard 创建备份或使用 pg_dump
- [ ] **确认权限** - 确保有数据库管理员权限
- [ ] **测试环境** - 建议先在测试环境执行
- [ ] **通知团队** - 告知团队成员即将进行数据库优化

### 📋 执行步骤

#### Step 1: 执行优化脚本

- [ ] 打开 Supabase Dashboard → SQL Editor
- [ ] 复制 `supabase-performance-optimization.sql` 内容
- [ ] 粘贴到 SQL Editor 并点击 "Run"
- [ ] 等待执行完成（通常需要 1-2 分钟）

#### Step 2: 验证优化结果

- [ ] 在 SQL Editor 中执行 `validate-performance-optimization.sql`
- [ ] 检查所有验证项目是否显示 ✅
- [ ] 确认没有 ❌ 错误项目

#### Step 3: 功能测试

- [ ] 测试用户登录功能
- [ ] 测试药品管理功能
- [ ] 测试库存操作功能
- [ ] 测试审计日志查看
- [ ] 测试不同角色的权限

#### Step 4: 性能验证

- [ ] 在 Supabase Dashboard 重新运行性能检查
- [ ] 确认之前的性能警告已消失
- [ ] 监控查询响应时间改进

### 🔍 预期结果

#### 性能警告解决

- [ ] ✅ Auth RLS Initialization Plan 警告消失
- [ ] ✅ Multiple Permissive Policies 警告消失
- [ ] ✅ 查询性能提升 20-50%

#### 策略优化完成

- [ ] ✅ `batches` 表策略从 8+ 个减少到 4 个
- [ ] ✅ `users` 表策略合并为 4 个清晰策略
- [ ] ✅ `audit_logs` 表策略优化为 1 个
- [ ] ✅ `undoable_transactions` 表策略优化为 2 个
- [ ] ✅ `expired_medicine_actions` 表策略优化为 3 个

#### 安全性保持

- [ ] ✅ 管理员权限正常
- [ ] ✅ 经理权限正常
- [ ] ✅ 操作员权限正常
- [ ] ✅ 用户只能访问自己的数据

### 🚨 故障排除

#### 常见错误及解决方案

**错误**: `policy "xxx" does not exist`

- **解决**: 正常现象，表示策略已不存在，继续执行

**错误**: `permission denied for table xxx`

- **解决**: 确保以管理员身份执行，检查用户权限

**错误**: `function xxx() does not exist`

- **解决**: 确保按顺序执行脚本，检查函数创建部分

#### 回滚方案

如果出现问题：

1. 从备份恢复数据库
2. 或重新执行原始 RLS 策略脚本
3. 联系技术支持

### 📊 监控建议

#### 执行后监控项目

- [ ] 查询响应时间
- [ ] 数据库 CPU 使用率
- [ ] 内存使用情况
- [ ] 用户反馈

#### 定期检查

- [ ] 每月运行 Supabase 性能检查
- [ ] 监控新的性能建议
- [ ] 检查策略是否需要进一步优化

### 📦 追加：库存并发与触发器清理执行

- [ ] 在 SQL Editor 执行 `migrations/2025-08-12_atomic_inventory_update.sql`
  - 该脚本将移除 `inventory_transactions` 上可能存在的 BEFORE 触发器
  - 将 `process_inventory_transaction` 升级为“原子条件更新”以避免并发扣减风险
- [ ] 确认 `information_schema.triggers` 中无 `update_inventory_on_transaction`（如存在，说明未清理完）
- [ ] 之后仅通过 `process_inventory_transaction` 更新库存，触发器仅用于审计/撤回
- [ ] 不再执行 `inventory-transactions-fix.sql`（避免与新逻辑冲突）

### 📞 支持联系

如果遇到问题：

1. 查看 `PERFORMANCE_OPTIMIZATION_GUIDE.md` 详细文档
2. 运行 `validate-performance-optimization.sql` 诊断
3. 检查 Supabase 日志
4. 联系数据库管理员

---

## 📝 执行记录

**执行日期**: \***\*\_\_\_\*\***
**执行人员**: \***\*\_\_\_\*\***
**执行环境**: [ ] 生产环境 [ ] 测试环境
**备份位置**: \***\*\_\_\_\*\***

### 执行结果

- [ ] ✅ 优化脚本执行成功
- [ ] ✅ 验证脚本通过
- [ ] ✅ 功能测试正常
- [ ] ✅ 性能改进确认

### 问题记录

如有问题，请记录：

```
问题描述：
解决方案：
影响范围：
```

### 性能改进数据

```
优化前查询时间：_____ ms
优化后查询时间：_____ ms
性能提升百分比：_____ %
```

---

**✅ 优化完成确认**

签名：\***\*\_\_\_\*\*** 日期：\***\*\_\_\_\*\***
