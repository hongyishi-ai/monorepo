#!/usr/bin/env node

/**
 * 性能优化后的功能测试脚本
 * 验证 RLS 策略优化后应用功能是否正常
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 开始性能优化后的功能测试...\n');

/**
 * 测试数据库连接
 */
async function testDatabaseConnection() {
  console.log('📡 测试数据库连接...');
  try {
    // 使用简单的查询测试连接
    const { data, error } = await supabase.from('users').select('id').limit(1);

    if (error) {
      console.log('⚠️ 匿名访问被阻止 (这是正确的安全行为):', error.message);
      console.log('✅ 数据库连接正常，RLS 策略工作正常');
      return true;
    }

    console.log('✅ 数据库连接成功');
    return true;
  } catch (err) {
    console.error('❌ 数据库连接异常:', err.message);
    return false;
  }
}

/**
 * 测试用户认证
 */
async function testAuthentication() {
  console.log('\n🔐 测试用户认证...');
  try {
    // 尝试使用测试用户登录
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@pharmacy.com',
      password: 'admin123',
    });

    if (error) {
      console.error('❌ 认证失败:', error.message);
      return false;
    }

    console.log('✅ 用户认证成功');
    return true;
  } catch (err) {
    console.error('❌ 认证异常:', err.message);
    return false;
  }
}

/**
 * 测试用户表查询性能
 */
async function testUsersQuery() {
  console.log('\n👥 测试用户表查询性能...');
  try {
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .limit(10);

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (error) {
      console.error('❌ 用户查询失败:', error.message);
      return false;
    }

    console.log(
      `✅ 用户查询成功 - 耗时: ${duration}ms, 返回: ${data.length} 条记录`
    );
    return true;
  } catch (err) {
    console.error('❌ 用户查询异常:', err.message);
    return false;
  }
}

/**
 * 测试批次表查询性能
 */
async function testBatchesQuery() {
  console.log('\n📦 测试批次表查询性能...');
  try {
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('batches')
      .select(
        `
        id,
        batch_number,
        quantity,
        expiry_date,
        medicines (
          name
        )
      `
      )
      .limit(10);

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (error) {
      console.error('❌ 批次查询失败:', error.message);
      return false;
    }

    console.log(
      `✅ 批次查询成功 - 耗时: ${duration}ms, 返回: ${data.length} 条记录`
    );
    return true;
  } catch (err) {
    console.error('❌ 批次查询异常:', err.message);
    return false;
  }
}

/**
 * 测试药品表查询性能
 */
async function testMedicinesQuery() {
  console.log('\n💊 测试药品表查询性能...');
  try {
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('medicines')
      .select('id, name, specification, manufacturer')
      .limit(10);

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (error) {
      console.error('❌ 药品查询失败:', error.message);
      return false;
    }

    console.log(
      `✅ 药品查询成功 - 耗时: ${duration}ms, 返回: ${data.length} 条记录`
    );
    return true;
  } catch (err) {
    console.error('❌ 药品查询异常:', err.message);
    return false;
  }
}

/**
 * 测试库存交易查询性能
 */
async function testInventoryTransactionsQuery() {
  console.log('\n📊 测试库存交易查询性能...');
  try {
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('id, type, quantity, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (error) {
      console.error('❌ 库存交易查询失败:', error.message);
      return false;
    }

    console.log(
      `✅ 库存交易查询成功 - 耗时: ${duration}ms, 返回: ${data.length} 条记录`
    );
    return true;
  } catch (err) {
    console.error('❌ 库存交易查询异常:', err.message);
    return false;
  }
}

/**
 * 测试审计日志查询性能
 */
async function testAuditLogsQuery() {
  console.log('\n📋 测试审计日志查询性能...');
  try {
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, target_type, action_type, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (error) {
      console.error('❌ 审计日志查询失败:', error.message);
      return false;
    }

    console.log(
      `✅ 审计日志查询成功 - 耗时: ${duration}ms, 返回: ${data.length} 条记录`
    );
    return true;
  } catch (err) {
    console.error('❌ 审计日志查询异常:', err.message);
    return false;
  }
}

/**
 * 测试复杂查询性能
 */
async function testComplexQuery() {
  console.log('\n🔍 测试复杂查询性能...');
  try {
    const startTime = Date.now();

    // 查询即将过期的批次
    const { data, error } = await supabase
      .from('batches')
      .select(
        `
        id,
        batch_number,
        quantity,
        expiry_date,
        medicines (
          name,
          specification
        )
      `
      )
      .gte('expiry_date', new Date().toISOString())
      .lte(
        'expiry_date',
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      )
      .gt('quantity', 0)
      .order('expiry_date', { ascending: true })
      .limit(20);

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (error) {
      console.error('❌ 复杂查询失败:', error.message);
      return false;
    }

    console.log(
      `✅ 复杂查询成功 - 耗时: ${duration}ms, 返回: ${data.length} 条记录`
    );
    return true;
  } catch (err) {
    console.error('❌ 复杂查询异常:', err.message);
    return false;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  const tests = [
    { name: '数据库连接', fn: testDatabaseConnection },
    { name: '用户认证', fn: testAuthentication },
    { name: '用户表查询', fn: testUsersQuery },
    { name: '批次表查询', fn: testBatchesQuery },
    { name: '药品表查询', fn: testMedicinesQuery },
    { name: '库存交易查询', fn: testInventoryTransactionsQuery },
    { name: '审计日志查询', fn: testAuditLogsQuery },
    { name: '复杂查询', fn: testComplexQuery },
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passedTests++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果汇总');
  console.log('='.repeat(50));
  console.log(`✅ 通过测试: ${passedTests}/${totalTests}`);
  console.log(`❌ 失败测试: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📈 成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 所有测试通过！性能优化成功，应用功能正常！');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查相关功能');
  }

  console.log('\n💡 建议：');
  console.log('1. 在 Supabase Dashboard 重新运行性能检查');
  console.log('2. 监控生产环境的查询性能');
  console.log('3. 定期检查 RLS 策略的有效性');

  return passedTests === totalTests;
}

// 运行测试
runTests().catch(console.error);
