# 库存筛选功能优化方案

## 概述

本文档描述了药房库存管理系统中筛选功能的优化方案，主要解决"近效期"和"已过期"药品筛选的逻辑分离问题。

## 问题分析

### 原有问题

1. **筛选逻辑不准确**：原有的"近效期"筛选同时包含即将过期和已过期的药品
2. **缺少独立选项**：没有专门的"已过期"筛选选项
3. **多批次状态混乱**：对于同一药品的多个批次，状态判断不够清晰

### 业务需求

1. 明确区分"近效期"（未过期但即将过期）和"已过期"药品
2. 提供独立的筛选选项
3. 合理处理多批次药品的状态显示

## 解决方案

### 1. 有效期状态分类标准

```typescript
type ExpiryStatus = 'normal' | 'expiring' | 'expired';

// 状态定义：
// - normal: 距离过期超过30天
// - expiring: 距离过期1-30天（未过期）
// - expired: 已过期（≤0天）
```

### 2. 多批次药品状态判断策略

优先级规则（从高到低）：

1. **已过期**：如果有任何批次已过期
2. **近效期**：如果没有过期批次但有近效期批次
3. **正常**：只有所有批次都正常时

### 3. 筛选选项扩展

```typescript
type InventoryFilter = 'all' | 'low-stock' | 'expiring' | 'expired' | 'normal';

// 筛选逻辑：
// - all: 显示所有药品
// - low-stock: 库存不足的药品
// - expiring: 近效期药品（不包括已过期）
// - expired: 已过期药品
// - normal: 正常状态药品（非库存不足、非近效期、非过期）
```

## 技术实现

### 1. 数据模型更新

#### InventorySummary 接口扩展

```typescript
export interface InventorySummary {
  medicineId: string;
  medicineName: string;
  barcode: string;
  totalQuantity: number;
  availableBatches: number;
  nearestExpiryDate: string;
  safetyStock: number;
  isLowStock: boolean;
  isExpiring: boolean; // 新增：是否近效期
  isExpired: boolean; // 新增：是否已过期
  expiryStatus: 'normal' | 'expiring' | 'expired'; // 新增：综合状态
}
```

### 2. 数据库查询优化

#### 分离的查询函数

```sql
-- 近效期药品（不包括已过期）
CREATE OR REPLACE FUNCTION public.get_expiring_medicines_only(p_warning_days INTEGER)
-- 已过期药品统计
CREATE OR REPLACE FUNCTION public.get_expired_medicines_summary()
-- 近效期药品统计
CREATE OR REPLACE FUNCTION public.get_expiring_medicines_summary(p_warning_days INTEGER)
```

### 3. 前端组件更新

#### 筛选下拉菜单

```tsx
<SelectContent>
  <SelectItem value='all'>全部</SelectItem>
  <SelectItem value='normal'>正常</SelectItem>
  <SelectItem value='low-stock'>库存不足</SelectItem>
  <SelectItem value='expiring'>近效期</SelectItem>
  <SelectItem value='expired'>已过期</SelectItem> {/* 新增 */}
</SelectContent>
```

#### 状态徽章优化

```tsx
// 优先级：库存不足 > 已过期 > 近效期 > 正常
const getStockStatusBadge = (item: InventorySummary) => {
  if (item.isLowStock) return <Badge variant='destructive'>库存不足</Badge>;
  if (item.isExpired) return <Badge variant='destructive'>已过期</Badge>;
  if (item.isExpiring) return <Badge variant='secondary'>近效期</Badge>;
  return <Badge variant='outline'>正常</Badge>;
};
```

### 4. 工具函数增强

```typescript
// 多批次状态计算
export function getMultiBatchExpiryStatus(
  batches: Array<{ expiry_date: string; quantity: number }>,
  warningDays: number = 30
): 'normal' | 'expiring' | 'expired';

// 精确的有效期状态判断
export function getExpiryStatus(
  expiryDate: string | Date,
  warningDays: number = 30
): 'normal' | 'expiring' | 'expired';
```

## 业务逻辑说明

### 1. 状态计算逻辑

```typescript
// 基于所有有库存的批次计算状态
const activeBatches = batches.filter(batch => batch.quantity > 0);

// 检查是否有已过期的批次
const hasExpiredBatches = activeBatches.some(
  batch => new Date(batch.expiry_date).getTime() <= now
);

// 检查是否有近效期批次（未过期但30天内过期）
const hasExpiringBatches = activeBatches.some(batch => {
  const expiryTime = new Date(batch.expiry_date).getTime();
  return expiryTime > now && expiryTime <= now + thirtyDaysMs;
});

// 确定综合状态
if (hasExpiredBatches) return 'expired';
if (hasExpiringBatches) return 'expiring';
return 'normal';
```

### 2. 筛选逻辑

```typescript
switch (filter) {
  case 'expiring':
    // 只显示近效期但未过期的药品
    filtered = filtered.filter(item => item.isExpiring && !item.isExpired);
    break;
  case 'expired':
    // 只显示已过期的药品
    filtered = filtered.filter(item => item.isExpired);
    break;
  case 'normal':
    // 只显示正常状态的药品
    filtered = filtered.filter(
      item => !item.isLowStock && !item.isExpiring && !item.isExpired
    );
    break;
}
```

## 性能优化

### 1. 数据库层面

- 利用现有的索引和视图
- 使用专门的函数进行复杂查询
- 避免在前端进行大量数据处理

### 2. 前端层面

- 使用React Query缓存查询结果
- 合理设置staleTime避免频繁请求
- 使用memo优化组件渲染

### 3. 查询策略

```typescript
// 库存统计查询优化
const { data: expiringData } = await supabase
  .from('batches')
  .select('id')
  .gt('quantity', 0)
  .gt('expiry_date', today) // 排除已过期
  .lte('expiry_date', futureDate);

const { data: expiredData } = await supabase
  .from('batches')
  .select('id')
  .gt('quantity', 0)
  .lte('expiry_date', today); // 只包括已过期
```

## 用户体验改进

### 1. 视觉区分

- **已过期**：红色背景，警告图标
- **近效期**：橙色背景，时钟图标
- **库存不足**：红色背景，三角警告图标
- **正常**：绿色边框，包装图标

### 2. 信息展示

```tsx
// 有效期信息显示
{
  daysUntilExpiry !== null && (
    <div
      className={cn(
        'text-xs',
        daysUntilExpiry <= 0
          ? 'text-red-600'
          : daysUntilExpiry <= 30
            ? 'text-orange-600'
            : 'text-muted-foreground'
      )}
    >
      {daysUntilExpiry > 0 ? `${daysUntilExpiry}天后过期` : '已过期'}
    </div>
  );
}
```

### 3. 筛选提示

- 清晰的筛选选项标签
- 结果统计信息显示
- 空状态友好提示

## 测试验证

### 1. 功能测试

- [ ] 近效期筛选不包含已过期药品
- [ ] 已过期筛选只显示过期药品
- [ ] 多批次药品状态显示正确
- [ ] 状态徽章显示准确

### 2. 性能测试

- [ ] 大量数据下的查询性能
- [ ] 筛选操作的响应速度
- [ ] 内存使用情况

### 3. 用户体验测试

- [ ] 筛选逻辑符合用户预期
- [ ] 界面显示清晰易懂
- [ ] 操作流程顺畅

## 部署说明

### 1. 数据库更新

```bash
# 执行新的数据库函数
psql -f supabase/enhanced-expiry-functions.sql
```

### 2. 前端部署

- 更新TypeScript类型定义
- 更新组件和hooks
- 测试所有筛选功能

### 3. 配置检查

- 确认EXPIRY_WARNING_DAYS设置正确
- 验证数据库权限配置
- 检查缓存策略设置

## 总结

本次优化解决了库存筛选功能中的关键问题：

1. **逻辑清晰**：明确区分近效期和已过期状态
2. **功能完整**：提供独立的筛选选项
3. **显示准确**：合理处理多批次药品状态
4. **性能优化**：高效的数据库查询和前端缓存
5. **用户友好**：清晰的视觉区分和信息展示

这些改进将显著提升用户在库存管理中的工作效率和准确性。
