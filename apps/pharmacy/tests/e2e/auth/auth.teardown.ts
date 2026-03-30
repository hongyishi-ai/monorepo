import fs from 'fs';

import { test as teardown } from '@playwright/test';

import { authFile } from './auth-config';

/**
 * 认证清理 - 在所有测试完成后清理认证状态
 */

teardown('cleanup auth files', async () => {
  console.log('🧹 开始清理认证状态文件...');

  const authFiles = [
    authFile,
    'tests/e2e/auth/admin.json',
    'tests/e2e/auth/manager.json',
    'tests/e2e/auth/operator.json',
  ];

  for (const file of authFiles) {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`✅ 已删除认证文件: ${file}`);
      }
    } catch (error) {
      console.warn(`⚠️ 删除认证文件失败: ${file}`, error);
    }
  }

  console.log('✅ 认证状态清理完成');
});

teardown('cleanup test artifacts', async () => {
  console.log('🧹 开始清理测试产物...');

  const artifactDirs = [
    'test-results/debug-screenshots',
    'test-results/playwright-artifacts',
  ];

  for (const dir of artifactDirs) {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`✅ 已清理目录: ${dir}`);
      }
    } catch (error) {
      console.warn(`⚠️ 清理目录失败: ${dir}`, error);
    }
  }

  console.log('✅ 测试产物清理完成');
});
