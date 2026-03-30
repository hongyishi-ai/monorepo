/* eslint-env node */
/* global process */
import { expect, test } from '@playwright/test';

/**
 * API端点集成测试
 * 测试所有Supabase REST API端点的可访问性和正确性
 */

test.describe('API端点测试', () => {
  let apiKey: string;
  let supabaseUrl: string;

  test.beforeAll(async () => {
    // 从环境变量获取API配置
    apiKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    supabaseUrl = process.env.VITE_SUPABASE_URL || '';

    expect(apiKey).toBeTruthy();
    expect(supabaseUrl).toBeTruthy();
  });

  test.describe('基础表访问测试', () => {
    test('medicines表API访问', async ({ request }) => {
      const response = await request.get(`${supabaseUrl}/rest/v1/medicines`, {
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        params: {
          select: 'id,name,barcode',
          limit: '5',
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      console.log(`✅ medicines表API访问成功，返回${data.length}条记录`);
    });

    test('batches表API访问', async ({ request }) => {
      const response = await request.get(`${supabaseUrl}/rest/v1/batches`, {
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        params: {
          select: 'id,batch_number,expiry_date',
          limit: '5',
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      console.log(`✅ batches表API访问成功，返回${data.length}条记录`);
    });

    test('inventory_transactions表API访问', async ({ request }) => {
      const response = await request.get(
        `${supabaseUrl}/rest/v1/inventory_transactions`,
        {
          headers: {
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          params: {
            select: 'id,type,quantity,created_at',
            limit: '5',
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      console.log(
        `✅ inventory_transactions表API访问成功，返回${data.length}条记录`
      );
    });

    test('users表API访问', async ({ request }) => {
      const response = await request.get(`${supabaseUrl}/rest/v1/users`, {
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        params: {
          select: 'id,name,email,role',
          limit: '5',
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      console.log(`✅ users表API访问成功，返回${data.length}条记录`);
    });

    test('system_settings表API访问', async ({ request }) => {
      const response = await request.get(
        `${supabaseUrl}/rest/v1/system_settings`,
        {
          headers: {
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          params: {
            select: 'key,value,description',
            limit: '10',
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      console.log(`✅ system_settings表API访问成功，返回${data.length}条记录`);
    });
  });

  test.describe('关联查询测试', () => {
    test('药品和批次关联查询', async ({ request }) => {
      const response = await request.get(`${supabaseUrl}/rest/v1/medicines`, {
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        params: {
          select:
            'id,name,barcode,batches(id,batch_number,expiry_date,quantity)',
          limit: '3',
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      // 验证关联数据
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('batches');
        expect(Array.isArray(data[0].batches)).toBe(true);
      }

      console.log(`✅ 药品和批次关联查询成功`);
    });

    test('库存交易关联查询', async ({ request }) => {
      const response = await request.get(
        `${supabaseUrl}/rest/v1/inventory_transactions`,
        {
          headers: {
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          params: {
            select:
              'id,type,quantity,medicine:medicines(name),batch:batches(batch_number),user:users(name)',
            limit: '3',
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      // 验证关联数据
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('medicine');
        expect(data[0]).toHaveProperty('batch');
        expect(data[0]).toHaveProperty('user');
      }

      console.log(`✅ 库存交易关联查询成功`);
    });
  });

  test.describe('过滤和排序测试', () => {
    test('按类型过滤库存交易', async ({ request }) => {
      const response = await request.get(
        `${supabaseUrl}/rest/v1/inventory_transactions`,
        {
          headers: {
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          params: {
            select: 'id,type,quantity',
            type: 'eq.inbound',
            limit: '5',
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      // 验证所有记录都是入库类型
      data.forEach(record => {
        expect(record.type).toBe('inbound');
      });

      console.log(`✅ 按类型过滤库存交易成功`);
    });

    test('按时间排序查询', async ({ request }) => {
      const response = await request.get(
        `${supabaseUrl}/rest/v1/inventory_transactions`,
        {
          headers: {
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          params: {
            select: 'id,created_at',
            order: 'created_at.desc',
            limit: '5',
          },
        }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      // 验证排序正确
      if (data.length > 1) {
        const firstDate = new Date(data[0].created_at);
        const secondDate = new Date(data[1].created_at);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(
          secondDate.getTime()
        );
      }

      console.log(`✅ 按时间排序查询成功`);
    });
  });

  test.describe('错误处理测试', () => {
    test('无效表名返回404', async ({ request }) => {
      const response = await request.get(
        `${supabaseUrl}/rest/v1/invalid_table`,
        {
          headers: {
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      expect(response.status()).toBe(404);

      console.log(`✅ 无效表名正确返回404`);
    });

    test('无效API密钥返回401', async ({ request }) => {
      const response = await request.get(`${supabaseUrl}/rest/v1/medicines`, {
        headers: {
          apikey: 'invalid-key',
          Authorization: 'Bearer invalid-key',
          'Content-Type': 'application/json',
        },
      });

      expect(response.status()).toBe(401);

      console.log(`✅ 无效API密钥正确返回401`);
    });
  });
});
