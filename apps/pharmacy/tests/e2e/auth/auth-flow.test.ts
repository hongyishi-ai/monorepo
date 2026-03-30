import { expect, test } from '@playwright/test';

import { getTestUser } from './auth-config';

/**
 * 认证流程端到端测试
 * 测试用户登录、登出、权限验证等功能
 */

test.describe('用户认证流程', () => {
  test.beforeEach(async ({ page }) => {
    // 清除所有存储状态，确保测试从未登录状态开始
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('管理员用户登录流程', async ({ page }) => {
    const admin = getTestUser('admin');

    // 访问需要认证的页面，应该重定向到登录页
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/login/);

    // 验证登录页面元素
    await expect(page.locator('h1')).toContainText('登录');
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();

    // 执行登录
    await page.fill('[data-testid="email-input"]', admin.email);
    await page.fill('[data-testid="password-input"]', admin.password);
    await page.click('[data-testid="login-button"]');

    // 验证登录成功
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    // 验证用户信息显示
    await page.click('[data-testid="user-menu"]');
    await expect(page.locator('[data-testid="user-role"]')).toContainText(
      '管理员'
    );

    console.log('✅ 管理员登录流程测试通过');
  });

  test('经理用户登录流程', async ({ page }) => {
    const manager = getTestUser('manager');

    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', manager.email);
    await page.fill('[data-testid="password-input"]', manager.password);
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    await page.click('[data-testid="user-menu"]');
    await expect(page.locator('[data-testid="user-role"]')).toContainText(
      '经理'
    );

    console.log('✅ 经理登录流程测试通过');
  });

  test('操作员用户登录流程', async ({ page }) => {
    const operator = getTestUser('operator');

    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', operator.email);
    await page.fill('[data-testid="password-input"]', operator.password);
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    await page.click('[data-testid="user-menu"]');
    await expect(page.locator('[data-testid="user-role"]')).toContainText(
      '操作员'
    );

    console.log('✅ 操作员登录流程测试通过');
  });

  test('错误凭据登录失败', async ({ page }) => {
    await page.goto('/login');

    // 使用错误的凭据
    await page.fill('[data-testid="email-input"]', 'wrong@email.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    // 验证错误消息显示
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      '登录失败'
    );

    // 验证仍在登录页面
    await expect(page).toHaveURL(/.*\/login/);

    console.log('✅ 错误凭据登录失败测试通过');
  });

  test('用户登出流程', async ({ page }) => {
    const admin = getTestUser('admin');

    // 先登录
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', admin.email);
    await page.fill('[data-testid="password-input"]', admin.password);
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');

    // 执行登出
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // 验证登出成功，重定向到登录页
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();

    console.log('✅ 用户登出流程测试通过');
  });

  test('会话过期处理', async ({ page }) => {
    const admin = getTestUser('admin');

    // 登录
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', admin.email);
    await page.fill('[data-testid="password-input"]', admin.password);
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');

    // 模拟会话过期 - 清除认证token
    await page.evaluate(() => {
      localStorage.removeItem('pharmacy-auth-storage');
      sessionStorage.clear();
    });

    // 尝试访问需要认证的页面
    await page.goto('/medicines');

    // 应该重定向到登录页
    await expect(page).toHaveURL(/.*\/login/);

    console.log('✅ 会话过期处理测试通过');
  });
});
