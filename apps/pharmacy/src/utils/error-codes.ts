export type RpcErrorCode =
  | 'OK'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'INVALID_QUANTITY'
  | 'INVALID_TYPE'
  | 'MEDICINE_NOT_FOUND'
  | 'BATCH_NOT_FOUND'
  | 'BATCH_EXISTS'
  | 'INSUFFICIENT_STOCK'
  | 'INVALID_PRODUCTION_DATE'
  | 'INVALID_EXPIRY_RANGE'
  | 'SERVER_ERROR'
  | string;

export interface FriendlyMessage {
  title: string;
  message: string;
}

const DEFAULT_MESSAGES: Record<RpcErrorCode, FriendlyMessage> = {
  OK: { title: '操作成功', message: '请求已成功完成' },
  UNAUTHENTICATED: { title: '未登录', message: '请先登录后再尝试该操作' },
  FORBIDDEN: { title: '权限不足', message: '当前账号没有执行该操作的权限' },
  INVALID_QUANTITY: {
    title: '数量不合法',
    message: '数量必须大于 0，请检查输入',
  },
  INVALID_TYPE: {
    title: '类型不合法',
    message: '不支持的交易类型，请刷新页面后重试',
  },
  MEDICINE_NOT_FOUND: {
    title: '药品不存在',
    message: '目标药品不存在或已被删除',
  },
  BATCH_NOT_FOUND: { title: '批次不存在', message: '目标批次不存在或已被删除' },
  BATCH_EXISTS: {
    title: '批次已存在',
    message: '该药品的批次号已存在，您可以选择“合并库存”完成入库',
  },
  INSUFFICIENT_STOCK: {
    title: '库存不足',
    message: '当前批次库存不足或批次不可用，请更换批次或调整数量',
  },
  INVALID_PRODUCTION_DATE: {
    title: '生产日期不合法',
    message: '生产日期不能晚于今天，请检查输入',
  },
  INVALID_EXPIRY_RANGE: {
    title: '有效期区间不合法',
    message: '生产日期不能晚于或等于有效期，请检查输入',
  },
  SERVER_ERROR: {
    title: '服务器错误',
    message: '服务器暂时不可用，请稍后重试',
  },
};

export function getFriendlyMessageForCode(
  code?: RpcErrorCode,
  fallbackMessage?: string
): FriendlyMessage {
  if (!code) {
    return {
      title: '操作失败',
      message: fallbackMessage || '请稍后重试',
    };
  }

  const mapped = DEFAULT_MESSAGES[code];
  if (mapped) return mapped;

  return {
    title: '操作失败',
    message: fallbackMessage || '请稍后重试',
  };
}
