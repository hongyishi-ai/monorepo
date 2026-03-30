# 数据库架构文档

## 概述

本文档描述药品出入库管理系统的 PostgreSQL 数据库结构。

## 目录结构

```
supabase/
├── migrations/              # 数据库迁移文件（按时间顺序）
│   ├── 2025-08-12_atomic_inventory_update.sql
│   ├── 2025-08-12_create_batch_and_inbound_rpc.sql
│   ├── 2025-08-12_undo_outbound_fix.sql
│   ├── 2025-08-12_remove_reverse_outbound.sql
│   ├── 2025-08-12_health_check_rpc.sql
│   ├── 2025-08-13_security_and_unify.sql
│   ├── 2025-08-13_unify_cleanup.sql
│   ├── create_system_settings.sql
│   └── fix-timing-issues.sql
├── functions.sql             # 权威函数定义
├── system-settings-unified.sql # 配置统一脚本
├── archive/                 # 旧版本归档
│   ├── functions-and-triggers-updated.sql  # 废弃
│   ├── schema-updated.sql               # 废弃
│   └── ...
└── docs/
    └── ARCHITECTURE.md
```

## 表结构

### users

用户表，与 auth.users 同步。

| 列         | 类型        | 说明                         |
| ---------- | ----------- | ---------------------------- |
| id         | UUID        | 主键                         |
| email      | TEXT        | 邮箱，唯一                   |
| name       | TEXT        | 姓名                         |
| role       | TEXT        | 角色：admin/manager/operator |
| is_active  | BOOLEAN     | 是否激活                     |
| last_login | TIMESTAMPTZ | 最后登录时间                 |
| created_at | TIMESTAMPTZ | 创建时间                     |
| updated_at | TIMESTAMPTZ | 更新时间                     |

### medicines

药品表。

| 列             | 类型    | 说明                              |
| -------------- | ------- | --------------------------------- |
| id             | UUID    | 主键                              |
| barcode        | TEXT    | 条码，唯一                        |
| name           | TEXT    | 名称                              |
| specification  | TEXT    | 规格                              |
| manufacturer   | TEXT    | 生产商                            |
| shelf_location | TEXT    | 货架位置                          |
| safety_stock   | INTEGER | 安全库存                          |
| unit           | TEXT    | 单位                              |
| category       | TEXT    | 类别：internal/external/injection |

### batches

批次表。

| 列              | 类型    | 说明         |
| --------------- | ------- | ------------ |
| id              | UUID    | 主键         |
| medicine_id     | UUID    | 药品ID，外键 |
| batch_number    | TEXT    | 批次号       |
| production_date | DATE    | 生产日期     |
| expiry_date     | DATE    | 有效期       |
| quantity        | INTEGER | 数量         |

**约束**：

- `UNIQUE (medicine_id, batch_number)`
- `CHECK (expiry_date > production_date)`
- `CHECK (production_date <= CURRENT_DATE)`

### inventory_transactions

库存交易表。

| 列                 | 类型    | 说明                                              |
| ------------------ | ------- | ------------------------------------------------- |
| id                 | UUID    | 主键                                              |
| medicine_id        | UUID    | 药品ID                                            |
| batch_id           | UUID    | 批次ID                                            |
| user_id            | UUID    | 用户ID                                            |
| type               | TEXT    | 类型：inbound/outbound/adjustment/expired/damaged |
| quantity           | INTEGER | 数量                                              |
| remaining_quantity | INTEGER | 剩余数量                                          |
| notes              | TEXT    | 备注                                              |
| reference_number   | TEXT    | 参考号                                            |

### undoable_transactions

可撤回交易表。

| 列                  | 类型        | 说明         |
| ------------------- | ----------- | ------------ |
| id                  | UUID        | 主键         |
| transaction_id      | UUID        | 原始交易ID   |
| user_id             | UUID        | 用户ID       |
| medicine_id         | UUID        | 药品ID       |
| batch_id            | UUID        | 批次ID       |
| original_quantity   | INTEGER     | 原始数量     |
| is_undone           | BOOLEAN     | 是否已撤回   |
| undo_deadline       | TIMESTAMPTZ | 撤回截止时间 |
| undone_at           | TIMESTAMPTZ | 撤回时间     |
| undone_by           | UUID        | 撤回操作人   |
| undo_transaction_id | UUID        | 撤回交易ID   |

### audit_logs

审计日志表。

| 列          | 类型        | 说明     |
| ----------- | ----------- | -------- |
| id          | UUID        | 主键     |
| user_id     | UUID        | 用户ID   |
| action_type | TEXT        | 操作类型 |
| table_name  | TEXT        | 表名     |
| record_id   | UUID        | 记录ID   |
| old_values  | JSONB       | 旧值     |
| new_values  | JSONB       | 新值     |
| ip_address  | INET        | IP地址   |
| user_agent  | TEXT        | 用户代理 |
| created_at  | TIMESTAMPTZ | 创建时间 |

### system_settings

系统设置表。

| 列          | 类型 | 说明     |
| ----------- | ---- | -------- |
| id          | UUID | 主键     |
| key         | TEXT | 键，唯一 |
| value       | TEXT | 值       |
| description | TEXT | 描述     |

**重要配置**：

| key                  | 值    | 说明           |
| -------------------- | ----- | -------------- |
| expiry_warning_days  | 30    | 近效期提醒天数 |
| session_timeout      | 28800 | 会话超时（秒） |
| auto_refresh_session | true  | 自动刷新会话   |
| password_min_length  | 8     | 密码最小长度   |

## 函数接口

### process_inventory_transaction

核心库存交易处理函数。

```sql
public.process_inventory_transaction(
  p_medicine_id UUID,
  p_batch_id UUID,
  p_type TEXT,           -- inbound/outbound/adjustment/expired/damaged
  p_quantity INTEGER,
  p_user_id UUID,        -- 兼容保留参数
  p_notes TEXT DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL
) RETURNS JSON
```

**返回格式**：

```json
{
  "success": true,
  "code": "OK",
  "transaction_id": "uuid",
  "new_quantity": 100,
  "medicine_name": "药品名"
}
```

**错误码**：

- `UNAUTHENTICATED` - 用户未认证
- `INVALID_QUANTITY` - 数量不合法
- `INVALID_TYPE` - 无效的交易类型
- `FORBIDDEN` - 权限不足
- `MEDICINE_NOT_FOUND` - 药品不存在
- `BATCH_NOT_FOUND` - 批次不存在
- `INSUFFICIENT_STOCK` - 库存不足
- `SERVER_ERROR` - 服务器错误

### create_batch_and_inbound

创建批次并入库。

```sql
public.create_batch_and_inbound(
  p_medicine_id UUID,
  p_batch_number TEXT,
  p_production_date DATE,
  p_expiry_date DATE,
  p_quantity INTEGER,
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS JSON
```

### undo_outbound_transaction

撤回出库交易。

```sql
public.undo_outbound_transaction(
  p_transaction_id UUID,
  p_user_id UUID
) RETURNS JSON
```

## 触发器

### handle_inventory_transaction

库存交易 INSERT 触发器。

- 出库操作创建可撤回记录
- 记录审计日志

### audit_medicines_changes

药品变更审计触发器。

- INSERT/UPDATE/DELETE 时记录审计日志

### audit_batches_changes

批次变更审计触发器。

- INSERT/UPDATE/DELETE 时记录审计日志

## RLS 策略

所有表已启用行级安全策略（RLS）：

- users
- medicines
- batches
- inventory_transactions
- system_settings
- audit_logs
- undoable_transactions

## 视图

### expiring_medicines

近效期药品视图（30天内到期）。

### low_stock_medicines

库存不足药品视图。

### medicine_inventory_summary

药品库存汇总视图。

## 版本历史

| 日期       | 版本   | 说明                 |
| ---------- | ------ | -------------------- |
| 2025-08-12 | v1     | 初始版本             |
| 2025-08-12 | atomic | 原子化库存更新       |
| 2025-08-13 | unify  | 统一错误码，权限收紧 |
