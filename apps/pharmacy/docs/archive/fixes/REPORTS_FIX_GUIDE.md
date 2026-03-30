# 报表功能修复指南

## 问题描述

报表中心的多个功能均没有实际显示当前情况，包括：

- 消耗统计显示空白
- 库存不足提醒无数据
- 近效期药品提醒无数据
- 图表分析无法显示
- 出入库记录报表无数据

## 问题原因分析

1. **数据库视图问题**：`low_stock_medicines` 和 `expiring_medicines` 视图可能未正确创建
2. **测试数据不足**：数据库中缺少足够的测试数据来展示报表功能
3. **系统设置缺失**：缺少必要的系统配置参数
4. **查询逻辑错误**：某些查询可能有逻辑问题

## 快速修复步骤

### 1. 诊断问题

```bash
npm run diagnose:reports
```

这个命令会检查：

- 数据库视图是否存在
- 基础数据是否充足
- 系统设置是否正确
- 视图数据是否可访问

### 2. 自动修复

```bash
npm run fix:reports
```

这个命令会：

- 修复系统设置
- 重新创建数据库视图
- 创建示例数据
- 验证修复结果

### 3. 手动验证

修复完成后：

1. 重启前端应用 (`npm run dev`)
2. 清除浏览器缓存
3. 访问报表中心查看数据是否正常显示

## 详细修复说明

### 数据库视图修复

脚本会重新创建以下视图：

1. **近效期药品视图** (`expiring_medicines`)
   - 显示即将过期的药品批次
   - 基于系统设置的提醒天数

2. **库存不足药品视图** (`low_stock_medicines`)
   - 显示库存低于安全库存的药品
   - 计算缺货数量

3. **药品库存汇总视图** (`medicine_inventory_summary`)
   - 提供药品库存的汇总信息
   - 包含总库存、活跃批次数等

### 示例数据创建

如果数据库中没有足够的数据，脚本会创建：

- **5种示例药品**：包含不同规格和厂家
- **20个批次**：包含不同状态（充足、不足、近效期、过期）
- **交易记录**：60天的出入库历史数据
- **系统设置**：必要的配置参数

### 系统设置修复

确保以下设置存在：

- `EXPIRY_WARNING_DAYS`: 近效期提醒天数（默认30天）
- `LOW_STOCK_THRESHOLD`: 库存不足提醒阈值（默认10）
- `SCANNER_TIMEOUT`: 扫码超时时间
- `SCANNER_RETRY_COUNT`: 扫码重试次数

## 常见问题解决

### 1. 权限问题

如果遇到权限错误，确保：

- 使用了正确的 `SUPABASE_SERVICE_ROLE_KEY`
- RLS策略允许访问相关表和视图

### 2. 数据仍然不显示

检查：

- 浏览器控制台是否有错误
- 网络请求是否成功
- Supabase连接是否正常

### 3. 视图创建失败

可能原因：

- 数据库权限不足
- SQL语法错误
- 依赖的表不存在

## 验证修复结果

修复完成后，应该能看到：

1. **消耗统计页面**
   - 显示药品消耗数据
   - 趋势图表正常显示
   - 汇总统计有数据

2. **库存不足提醒**
   - 显示库存不足的药品列表
   - 按缺货程度分类
   - 统计信息正确

3. **近效期提醒**
   - 显示即将过期的药品
   - 按剩余天数排序
   - 状态标识正确

4. **出入库记录**
   - 显示历史交易记录
   - 支持日期筛选
   - 数据完整准确

## 预防措施

为避免类似问题再次发生：

1. **定期备份数据库**
2. **监控视图状态**
3. **保持测试数据更新**
4. **验证系统设置**

## 技术细节

### 视图定义

```sql
-- 近效期药品视图
CREATE VIEW public.expiring_medicines AS
SELECT
  m.id AS medicine_id,
  m.name AS medicine_name,
  m.barcode,
  m.shelf_location,
  b.id AS batch_id,
  b.batch_number,
  b.expiry_date,
  b.quantity,
  (b.expiry_date - CURRENT_DATE) AS days_until_expiry,
  COALESCE((SELECT value::integer FROM public.system_settings WHERE key = 'EXPIRY_WARNING_DAYS'), 30) AS warning_threshold
FROM
  public.medicines m
JOIN
  public.batches b ON m.id = b.medicine_id
WHERE
  b.quantity > 0
  AND (b.expiry_date - CURRENT_DATE) <= COALESCE((SELECT value::integer FROM public.system_settings WHERE key = 'EXPIRY_WARNING_DAYS'), 30)
ORDER BY
  days_until_expiry ASC;
```

### 查询优化

- 使用索引优化查询性能
- 避免全表扫描
- 合理使用缓存策略

## 联系支持

如果问题仍然存在，请提供：

- 错误日志
- 浏览器控制台输出
- 数据库查询结果
- 系统环境信息
