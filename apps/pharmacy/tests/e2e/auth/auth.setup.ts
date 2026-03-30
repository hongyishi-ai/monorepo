import { test as setup, expect } from '@playwright/test';

import { authFile } from './auth-config';

/**
 * 认证设置 - 为所有测试准备认证状态
 * 这个文件会在所有测试之前运行，设置用户登录状态
 */

setup('authenticate as admin user', async ({ page }) => {
  console.log('🔐 开始设置管理员认证状态...');

  // 导航到登录页面
  await page.goto('/login');

  // 等待页面加载
  await expect(page.locator('h1')).toContainText('登录');

  // 填写登录表单
  await page.fill('[data-testid="email-input"]', 'admin@pharmacy.com');
  await page.fill('[data-testid="password-input"]', 'admin123');

  // 点击登录按钮
  await page.click('[data-testid="login-button"]');

  // 等待登录成功，检查是否跳转到仪表板
  await expect(page).toHaveURL('/dashboard');

  // 验证用户已登录
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

  // 保存认证状态
  await page.context().storageState({ path: authFile });

  console.log('✅ 管理员认证状态设置完成');
});

setup('authenticate as manager user', async ({ page }) => {
  console.log('🔐 开始设置经理认证状态...');

  await page.goto('/login');
  await expect(page.locator('h1')).toContainText('登录');

  await page.fill('[data-testid="email-input"]', 'manager@pharmacy.com');
  await page.fill('[data-testid="password-input"]', 'manager123');
  await page.click('[data-testid="login-button"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

  // 保存经理认证状态
  await page.context().storageState({ path: 'tests/e2e/auth/manager.json' });

  console.log('✅ 经理认证状态设置完成');
});

setup('authenticate as operator user', async ({ page }) => {
  console.log('🔐 开始设置操作员认证状态...');

  await page.goto('/login');
  await expect(page.locator('h1')).toContainText('登录');

  await page.fill('[data-testid="email-input"]', 'operator@pharmacy.com');
  await page.fill('[data-testid="password-input"]', 'operator123');
  await page.click('[data-testid="login-button"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

  // 保存操作员认证状态
  await page.context().storageState({ path: 'tests/e2e/auth/operator.json' });

  console.log('✅ 操作员认证状态设置完成');
});
