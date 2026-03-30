import { describe, it, expect, vi, beforeEach } from 'vitest';

import { batchService } from '@/hooks/use-batches';

// 独立 mock supabase 客户端（最小实现）
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn((fn: string, args: Record<string, unknown>) => {
      if (fn === 'create_batch_and_inbound') {
        if (args.p_quantity && Number(args.p_quantity) > 0) {
          return {
            data: {
              success: true,
              created_batch: true,
              batch_id: 'mock-batch-id',
              transaction_id: 'mock-tx-id',
              new_quantity: Number(args.p_quantity),
            },
            error: null,
          };
        }
        return {
          data: { success: false, error: '数量必须大于0' },
          error: null,
        };
      }
      return { data: null, error: null };
    }),
    from: vi.fn(() => ({
      select: vi.fn(() => ({ data: [], error: null })),
    })),
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: 'mock-user' } },
        error: null,
      })),
    },
  })),
}));

describe('create_batch_and_inbound service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should succeed when quantity > 0', async () => {
    const result = await batchService.createBatchAndInbound({
      medicine_id: 'mid',
      batch_number: 'B001',
      production_date: '2024-01-01',
      expiry_date: '2026-01-01',
      quantity: 10,
      notes: '首次入库',
    });
    expect(result.success).toBe(true);
    expect(result.batch_id).toBeTruthy();
    expect(result.transaction_id).toBeTruthy();
    expect(result.new_quantity).toBe(10);
  });

  it('should fail when quantity <= 0', async () => {
    await expect(
      batchService.createBatchAndInbound({
        medicine_id: 'mid',
        batch_number: 'B001',
        production_date: '2024-01-01',
        expiry_date: '2026-01-01',
        quantity: 0,
      })
    ).rejects.toThrow('数量必须大于0');
  });
});
