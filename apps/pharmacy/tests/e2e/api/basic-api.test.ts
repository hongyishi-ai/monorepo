/* eslint-env node */
/* global process */
import { expect, test } from '@playwright/test';

/**
 * 基础API端点测试
 * 测试Supabase REST API端点的基本可访问性
 */

test.describe('基础API端点测试', () => {
  let apiKey: string;
  let supabaseUrl: string;

  test.beforeAll(async () => {
    // 从环境变量获取API配置
    apiKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    supabaseUrl = process.env.VITE_SUPABASE_URL || '';

    expect(apiKey).toBeTruthy();
    expect(supabaseUrl).toBeTruthy();

    console.log('🔧 API配置验证通过');
    console.log(`📍 Supabase URL: ${supabaseUrl}`);
  });

  test('验证medicines表API访问', async ({ request }) => {
    console.log('🧪 测试medicines表API访问...');

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

    // 验证数据结构
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('name');
      expect(data[0]).toHaveProperty('barcode');
    }
  });

  test('验证inventory_transactions表API访问', async ({ request }) => {
    console.log('🧪 测试inventory_transactions表API访问...');

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

    // 验证数据结构
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('type');
      expect(data[0]).toHaveProperty('quantity');
      expect(data[0]).toHaveProperty('created_at');

      // 验证type字段值
      expect(['inbound', 'outbound']).toContain(data[0].type);
    }
  });

  test('验证users表API访问', async ({ request }) => {
    console.log('🧪 测试users表API访问...');

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

    // 验证数据结构
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('name');
      expect(data[0]).toHaveProperty('email');
      expect(data[0]).toHaveProperty('role');

      // 验证role字段值
      expect(['admin', 'manager', 'operator']).toContain(data[0].role);
    }
  });

  test('验证batches表API访问', async ({ request }) => {
    console.log('🧪 测试batches表API访问...');

    const response = await request.get(`${supabaseUrl}/rest/v1/batches`, {
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      params: {
        select: 'id,batch_number,expiry_date,quantity',
        limit: '5',
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);

    console.log(`✅ batches表API访问成功，返回${data.length}条记录`);

    // 验证数据结构
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('batch_number');
      expect(data[0]).toHaveProperty('expiry_date');
      expect(data[0]).toHaveProperty('quantity');
    }
  });

  test('验证system_settings表API访问', async ({ request }) => {
    console.log('🧪 测试system_settings表API访问...');

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

    // 验证数据结构
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('key');
      expect(data[0]).toHaveProperty('value');
    }
  });

  test('验证错误处理 - 无效表名', async ({ request }) => {
    console.log('🧪 测试错误处理 - 无效表名...');

    const response = await request.get(
      `${supabaseUrl}/rest/v1/invalid_table_name`,
      {
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status()).toBe(404);

    console.log('✅ 无效表名正确返回404错误');
  });

  test('验证错误处理 - 无效API密钥', async ({ request }) => {
    console.log('🧪 测试错误处理 - 无效API密钥...');

    const response = await request.get(`${supabaseUrl}/rest/v1/medicines`, {
      headers: {
        apikey: 'invalid-api-key',
        Authorization: 'Bearer invalid-api-key',
        'Content-Type': 'application/json',
      },
    });

    expect(response.status()).toBe(401);

    console.log('✅ 无效API密钥正确返回401错误');
  });

  test('验证过滤查询功能', async ({ request }) => {
    console.log('🧪 测试过滤查询功能...');

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
          limit: '3',
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

    console.log(`✅ 过滤查询功能正常，返回${data.length}条入库记录`);
  });
});
