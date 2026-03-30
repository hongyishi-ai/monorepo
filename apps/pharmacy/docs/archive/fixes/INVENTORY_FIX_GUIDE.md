# 药品库存功能修复指南

本指南提供了修复药品出入库系统中库存功能问题的步骤。这些修复解决了批次数量不一致、并发操作冲突和FIFO逻辑实现等问题。

## 问题背景

在系统分析中，我们发现了以下主要问题：

1. 触发器重复和冲突
2. 剩余数量计算不一致
3. 并发操作处理不足
4. FIFO实现的局限性
5. 数据完整性验证不足

详细分析请参考 [DATABASE_INVENTORY_ANALYSIS.md](./DATABASE_INVENTORY_ANALYSIS.md)。

## 修复步骤

### 1. 备份数据库

在进行任何更改之前，确保备份您的数据库。

```bash
# 使用 Supabase CLI 备份数据库
supabase db dump -f backup_before_fix.sql
```

### 2. 应用数据库修复脚本

执行我们提供的修复脚本，该脚本解决了上述问题。

```bash
# 在 Supabase SQL 编辑器中执行脚本
# 或使用 Supabase CLI
supabase db run -f ./supabase/inventory-transactions-fix.sql
```

### 3. 验证数据完整性

使用我们提供的验证脚本检查数据完整性。

```bash
# 安装依赖
npm install

# 运行验证脚本
node scripts/verify-inventory-integrity.js validate
```

### 4. 修复数据不一致（如需要）

如果验证脚本发现数据不一致问题，可以使用修复功能。

```bash
# 自动修复发现的问题
node scripts/verify-inventory-integrity.js validate --fix

# 或直接运行修复命令
node scripts/verify-inventory-integrity.js fix
```

### 5. 测试库存交易功能

使用测试脚本验证修复后的功能是否正常工作。

```bash
# 测试库存交易功能
node scripts/verify-inventory-integrity.js test
```

## 修复内容详解

### 1. 触发器统一

我们删除了重复的触发器，保留并增强了 `update_inventory_on_transaction` 触发器：

```sql
-- 删除旧触发器
DROP TRIGGER IF EXISTS update_batch_quantity_on_transaction ON public.inventory_transactions;
DROP TRIGGER IF EXISTS update_inventory_on_transaction ON public.inventory_transactions;

-- 创建增强版触发器
CREATE TRIGGER update_inventory_on_transaction
  BEFORE INSERT ON public.inventory_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_inventory_on_transaction();
```

### 2. FIFO 逻辑增强

改进了 `process_outbound_fifo()` 函数，增加了并发处理能力和更好的错误处理：

```sql
-- 锁定相关批次，防止并发修改
PERFORM id FROM public.batches
WHERE medicine_id = p_medicine_id AND quantity > 0
FOR UPDATE;
```

### 3. 数据完整性验证

添加了数据完整性验证和修复函数：

```sql
-- 验证库存数据完整性
SELECT * FROM public.validate_inventory_integrity();

-- 修复库存数据不一致
SELECT * FROM public.fix_inventory_discrepancies();
```

### 4. 新增视图和报表

创建了新的视图和函数，提供更全面的库存分析：

```sql
-- 查看批次库存汇总
SELECT * FROM public.batch_inventory_summary;

-- 查看批次交易历史
SELECT * FROM public.batch_transaction_history;

-- 查看药品库存变动统计
SELECT * FROM public.medicine_inventory_changes;
```

## 前端调整建议

为了配合数据库改进，建议对前端代码进行以下调整：

### 1. 入库组件 (InboundScanPage.tsx)

```typescript
// 使用验证函数检查批次是否已存在
const validateInbound = async (medicineId, batchNumber, quantity) => {
  const { data, error } = await supabase.rpc('validate_inbound_transaction', {
    p_medicine_id: medicineId,
    p_batch_number: batchNumber,
    p_quantity: quantity,
  });

  if (error) throw error;
  return data;
};

// 在提交前调用验证
const validation = await validateInbound(
  medicineId,
  formData.batch_number,
  formData.quantity
);

if (!validation.is_valid) {
  toast({
    title: '验证失败',
    description: validation.message,
    variant: 'destructive',
  });
  return;
}
```

### 2. 出库组件 (OutboundScanPage.tsx)

```typescript
// 使用 FIFO 函数获取推荐出库批次
const getRecommendedBatches = async (medicineId, quantity) => {
  const { data, error } = await supabase.rpc(
    'get_recommended_outbound_batches',
    {
      p_medicine_id: medicineId,
      p_quantity: quantity,
    }
  );

  if (error) throw error;
  return data;
};

// 在组件中使用
const recommendedBatches = await getRecommendedBatches(
  medicine.id,
  formData.quantity
);

// 显示推荐批次
recommendedBatches.forEach(batch => {
  console.log(
    `批次: ${batch.batch_number}, 推荐数量: ${batch.recommended_quantity}`
  );
});
```

### 3. 库存服务 (use-inventory.ts)

```typescript
// 添加使用 FIFO 出库的函数
async outboundInventoryFifo(
  medicine_id: string,
  quantity: number,
  notes?: string
): Promise<any> {
  const { data, error } = await supabase.rpc('process_outbound_fifo', {
    p_medicine_id: medicine_id,
    p_user_id: supabase.auth.user()?.id,
    p_quantity: quantity,
    p_notes: notes
  });

  if (error) throw error;
  return data;
}
```

## 后续监控

实施修复后，建议进行以下监控：

1. **定期验证数据完整性**：设置定时任务，每天运行验证脚本
2. **监控高并发场景**：在高峰期特别关注库存操作
3. **审计日志分析**：定期检查审计日志，查找潜在问题

## 结论

通过实施这些修复，我们解决了药品出入库系统中的数据不一致和并发操作问题，提高了系统的可靠性和数据完整性。这些改进不仅解决了当前的问题，还为未来的功能扩展奠定了基础。
