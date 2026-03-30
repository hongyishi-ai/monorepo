/**
 * 数据库对象与业务键名的统一出口
 * - 表、视图、RPC、系统设置键、默认值
 *
 * 说明：
 * 为了逐步消除前端的硬编码字符串依赖，所有数据库相关的命名
 * 应通过本文件导出使用。后续若数据库对象改名/迁移，仅需集中修改这里。
 */

// 表名
export const TABLES = {
  medicines: 'medicines',
  batches: 'batches',
  inventoryTransactions: 'inventory_transactions',
  undoableTransactions: 'undoable_transactions',
  users: 'users',
  systemSettings: 'system_settings',
  auditLogs: 'audit_logs',
} as const;

// 视图名（如需保留视图依赖）
export const VIEWS = {
  expiringMedicines: 'expiring_medicines',
  lowStockMedicines: 'low_stock_medicines',
} as const;

// RPC/函数名
export const RPC = {
  createBatchAndInbound: 'create_batch_and_inbound',
  checkBatchExists: 'check_batch_exists',
  addBatchQuantity: 'add_batch_quantity',
  processInventoryTransaction: 'process_inventory_transaction',
  undoOutboundTransaction: 'undo_outbound_transaction',
  getReversibleOutboundTransactions: 'get_reversible_outbound_transactions',
  getUndoableTransactions: 'get_undoable_transactions',
  safeDeleteMedicine: 'safe_delete_medicine',
  safeDeleteBatch: 'safe_delete_batch',
  getMedicineDependencies: 'get_medicine_dependencies',
  getBatchDependencies: 'get_batch_dependencies',
  cleanupExpiredUndoableTransactions: 'cleanup_expired_undoable_transactions',
  healthCheck: 'health_check',
  setConfig: 'set_config',
} as const;

// 系统设置键名
export const SETTINGS = {
  EXPIRY_WARNING_DAYS: 'EXPIRY_WARNING_DAYS',
  LOW_STOCK_THRESHOLD: 'LOW_STOCK_THRESHOLD',
  AUTO_PROCESS_EXPIRED: 'auto_process_expired_medicines',
  AUTO_PROCESS_EXPIRED_DAYS: 'auto_process_expired_days',
} as const;

// 业务默认值口径
export const DEFAULTS = {
  unit: '盒',
  category: 'internal' as 'internal' | 'external' | 'injection',
  safetyStock: 1,
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];
export type ViewName = (typeof VIEWS)[keyof typeof VIEWS];
export type RpcName = (typeof RPC)[keyof typeof RPC];
