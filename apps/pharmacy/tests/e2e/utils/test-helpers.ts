import { Page, expect } from '@playwright/test';

import { getTestUser, UserRole } from '../auth/auth-config';

/**
 * 测试辅助工具函数
 * 提供常用的测试操作和验证方法
 */

/**
 * 登录指定角色的用户
 */
export async function loginAs(page: Page, role: UserRole) {
  const user = getTestUser(role);

  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', user.email);
  await page.fill('[data-testid="password-input"]', user.password);
  await page.click('[data-testid="login-button"]');

  // 等待登录成功
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

  console.log(`✅ 已登录为${role}用户`);
}

/**
 * 等待页面加载完成
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * 等待API请求完成
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp
) {
  return page.waitForResponse(response => {
    const url = response.url();
    if (typeof urlPattern === 'string') {
      return url.includes(urlPattern);
    }
    return urlPattern.test(url);
  });
}

/**
 * 验证表格数据加载
 */
export async function verifyTableLoaded(page: Page, tableSelector: string) {
  await expect(page.locator(tableSelector)).toBeVisible();

  // 等待加载状态消失
  await expect(
    page.locator('[data-testid="loading-spinner"]')
  ).not.toBeVisible();

  // 验证表格有数据或显示空状态
  const hasData = (await page.locator(`${tableSelector} tbody tr`).count()) > 0;
  const hasEmptyState = await page
    .locator('[data-testid="empty-state"]')
    .isVisible();

  expect(hasData || hasEmptyState).toBe(true);
}

/**
 * 填写表单字段
 */
export async function fillForm(page: Page, formData: Record<string, string>) {
  for (const [field, value] of Object.entries(formData)) {
    await page.fill(`[data-testid="${field}-input"]`, value);
  }
}

/**
 * 验证通知消息
 */
export async function verifyNotification(
  page: Page,
  message: string,
  type: 'success' | 'error' | 'warning' = 'success'
) {
  const notification = page.locator(`[data-testid="notification-${type}"]`);
  await expect(notification).toBeVisible();
  await expect(notification).toContainText(message);

  console.log(`✅ 验证${type}通知: ${message}`);
}

/**
 * 截图用于调试
 */
export async function takeDebugScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/debug-screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

/**
 * 验证权限访问
 */
export async function verifyPermissionAccess(
  page: Page,
  url: string,
  shouldHaveAccess: boolean
) {
  const response = await page.goto(url);

  if (shouldHaveAccess) {
    expect(response?.status()).toBe(200);
    await expect(
      page.locator('[data-testid="access-denied"]')
    ).not.toBeVisible();
  } else {
    // 应该返回403或重定向到无权限页面
    const status = response?.status();
    expect(status === 403 || status === 302).toBe(true);
  }
}

/**
 * 模拟网络错误
 */
export async function simulateNetworkError(
  page: Page,
  urlPattern: string | RegExp
) {
  await page.route(urlPattern, route => {
    route.abort('failed');
  });
}

/**
 * 清除所有路由拦截
 */
export async function clearRouteInterceptions(page: Page) {
  await page.unrouteAll();
}

/**
 * 等待元素可见并点击
 */
export async function waitAndClick(page: Page, selector: string) {
  await expect(page.locator(selector)).toBeVisible();
  await page.click(selector);
}

/**
 * 验证URL包含指定路径
 */
export async function verifyUrlContains(page: Page, path: string) {
  await expect(page).toHaveURL(new RegExp(path));
}

/**
 * 获取表格行数
 */
export async function getTableRowCount(page: Page, tableSelector: string) {
  return await page.locator(`${tableSelector} tbody tr`).count();
}

/**
 * 验证API响应
 */
export async function verifyApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  expectedStatus: number = 200
) {
  const response = await waitForApiResponse(page, urlPattern);
  expect(response.status()).toBe(expectedStatus);
  return response;
}

/**
 * 模拟慢网络
 */
export async function simulateSlowNetwork(page: Page) {
  await page.route('**/*', route => {
    setTimeout(() => route.continue(), 1000); // 延迟1秒
  });
}

/**
 * 验证页面标题
 */
export async function verifyPageTitle(page: Page, expectedTitle: string) {
  await expect(page.locator('h1')).toContainText(expectedTitle);
}
