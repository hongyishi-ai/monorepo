import type {
  UserResponse,
  PostgrestSingleResponse,
} from '@supabase/supabase-js';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { inventoryService } from '@/hooks/use-inventory';
import supabase from '@/lib/supabase';
import { UndoTransactionService } from '@/services/undo-transaction.service';

// 辅助：创建可链式调用的查询构建器模拟
function makeQueryBuilder<T>(result: T) {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: result as unknown,
      error: null,
      status: 200,
      statusText: 'OK',
      count: null,
    } as PostgrestSingleResponse<unknown>),
    maybeSingle: vi.fn().mockResolvedValue({
      data: result as unknown,
      error: null,
      status: 200,
      statusText: 'OK',
      count: null,
    } as PostgrestSingleResponse<unknown>),
  } as unknown as {
    select: () => unknown;
    insert: () => unknown;
    update: () => unknown;
    delete: () => unknown;
    upsert: () => unknown;
    order: () => unknown;
    limit: () => unknown;
    range: () => unknown;
    eq: () => unknown;
    gt: () => unknown;
    gte: () => unknown;
    lt: () => unknown;
    lte: () => unknown;
    or: () => unknown;
    single: () => Promise<PostgrestSingleResponse<unknown>>;
    maybeSingle: () => Promise<PostgrestSingleResponse<unknown>>;
  };
}

describe('药品全生命周期 - 冲突推敲', () => {
  const user = { id: 'user-1' } as const;
  const medicineId = 'med-1';
  const batchId = 'batch-1';

  beforeEach(() => {
    vi.restoreAllMocks();

    // mock 认证
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: user.id } as { id: string } },
      error: null,
    } as UserResponse);

    // 默认批次查询
    const batchRecord: {
      id: string;
      medicine_id: string;
      quantity: number;
      expiry_date: string;
    } = {
      id: batchId,
      medicine_id: medicineId,
      quantity: 100,
      expiry_date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    };

    const fromMock = vi
      .spyOn(supabase, 'from')
      .mockImplementation((table: string) => {
        if (table === 'batches') {
          return makeQueryBuilder(batchRecord) as unknown as ReturnType<
            (typeof supabase)['from']
          >;
        }
        if (table === 'undoable_transactions') {
          return makeQueryBuilder({
            transaction_id: 'tx-1',
          }) as unknown as ReturnType<(typeof supabase)['from']>;
        }
        return makeQueryBuilder(null) as unknown as ReturnType<
          (typeof supabase)['from']
        >;
      });

    // 避免 TS 未使用警告
    expect(fromMock).toBeDefined();
  });

  it('出库应通过原子RPC处理，并在第二次扣减时表露冲突', async () => {
    const rpcSuccess = {
      data: {
        success: true,
        transaction_id: 'tx-1',
        new_quantity: 95,
      } as unknown,
      error: null,
      status: 200,
      statusText: 'OK',
      count: null,
    } as PostgrestSingleResponse<unknown>;

    const rpcFail = {
      data: { success: false, error: '库存不足或批次不可用' } as unknown,
      error: null,
      status: 200,
      statusText: 'OK',
      count: null,
    } as PostgrestSingleResponse<unknown>;

    const rpcMock = vi
      .spyOn(supabase, 'rpc')
      .mockResolvedValueOnce(rpcSuccess)
      .mockResolvedValueOnce(rpcFail);

    // 第一次出库成功
    const first = await inventoryService.outboundInventory({
      medicine_id: medicineId,
      batch_id: batchId,
      quantity: 5,
      notes: 'first outbound',
    });
    expect(first).toBeTruthy();
    expect(rpcMock).toHaveBeenCalledWith(
      'process_inventory_transaction',
      expect.any(Object)
    );

    // 第二次出库冲突（模拟并发后置失败）
    await expect(
      inventoryService.outboundInventory({
        medicine_id: medicineId,
        batch_id: batchId,
        quantity: 200,
        notes: 'second outbound',
      })
    ).rejects.toThrow(/库存不足|不可用/);
  });

  it('撤回应使用原始交易ID而非撤回记录ID', async () => {
    const rpcOk = {
      data: { success: true, restored_quantity: 5 } as unknown,
      error: null,
      status: 200,
      statusText: 'OK',
      count: null,
    } as PostgrestSingleResponse<unknown>;

    const rpcMock = vi.spyOn(supabase, 'rpc').mockResolvedValue(rpcOk);

    const result = await UndoTransactionService.undoOutboundTransaction(
      'undoable-1',
      user.id
    );
    expect(result.success).toBe(true);
    // 验证使用的是 transaction_id = 'tx-1'
    expect(rpcMock).toHaveBeenCalledWith(
      'undo_outbound_transaction',
      expect.objectContaining({ p_transaction_id: 'tx-1', p_user_id: user.id })
    );
  });

  it('入库应成功并返回新余量', async () => {
    const rpcOk2 = {
      data: {
        success: true,
        transaction_id: 'tx-in',
        new_quantity: 150,
      } as unknown,
      error: null,
      status: 200,
      statusText: 'OK',
      count: null,
    } as PostgrestSingleResponse<unknown>;

    const rpcMock = vi.spyOn(supabase, 'rpc').mockResolvedValue(rpcOk2);

    const res = await inventoryService.inboundInventory({
      medicine_id: medicineId,
      batch_id: batchId,
      quantity: 50,
      notes: 'inbound',
    });
    expect(res).toBeTruthy();
    expect(rpcMock).toHaveBeenCalledWith(
      'process_inventory_transaction',
      expect.any(Object)
    );
  });
});
