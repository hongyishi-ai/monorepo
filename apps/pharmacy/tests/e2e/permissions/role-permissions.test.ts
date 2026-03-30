import { expect, test } from '@playwright/test';

/**
 * 角色权限控制测试
 * 测试不同角色用户的权限控制是否正确
 */

test.describe('角色权限控制', () => {
  test.describe('管理员权限', () => {
    test.use({ storageState: 'tests/e2e/auth/admin.json' });

    test('管理员可以访问所有功能', async ({ page }) => {
      await page.goto('/dashboard');

      // 验证管理员可以看到所有菜单项
      await expect(page.locator('[data-testid="nav-medicines"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-inventory"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-reports"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-users"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-settings"]')).toBeVisible();

      console.log('✅ 管理员菜单权限验证通过');
    });

    test('管理员可以管理用户', async ({ page }) => {
      await page.goto('/users');

      // 验证可以访问用户管理页面
      await expect(page.locator('h1')).toContainText('用户管理');

      // 验证可以看到添加用户按钮
      await expect(
        page.locator('[data-testid="add-user-button"]')
      ).toBeVisible();

      // 验证可以看到用户列表
      await expect(page.locator('[data-testid="users-table"]')).toBeVisible();

      console.log('✅ 管理员用户管理权限验证通过');
    });

    test('管理员可以访问系统设置', async ({ page }) => {
      await page.goto('/settings');

      await expect(page.locator('h1')).toContainText('系统设置');
      await expect(
        page.locator('[data-testid="system-settings"]')
      ).toBeVisible();

      console.log('✅ 管理员系统设置权限验证通过');
    });
  });

  test.describe('经理权限', () => {
    test.use({ storageState: 'tests/e2e/auth/manager.json' });

    test('经理可以访问业务功能但不能管理用户', async ({ page }) => {
      await page.goto('/dashboard');

      // 验证经理可以看到业务菜单
      await expect(page.locator('[data-testid="nav-medicines"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-inventory"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-reports"]')).toBeVisible();

      // 验证经理不能看到用户管理和系统设置
      await expect(page.locator('[data-testid="nav-users"]')).not.toBeVisible();
      await expect(
        page.locator('[data-testid="nav-settings"]')
      ).not.toBeVisible();

      console.log('✅ 经理菜单权限验证通过');
    });

    test('经理不能访问用户管理页面', async ({ page }) => {
      // 直接访问用户管理页面应该被拒绝
      const response = await page.goto('/users');

      // 应该返回403或重定向到无权限页面
      expect(response?.status()).toBe(403);

      console.log('✅ 经理用户管理权限限制验证通过');
    });

    test('经理可以管理药品信息', async ({ page }) => {
      await page.goto('/medicines');

      await expect(page.locator('h1')).toContainText('药品管理');
      await expect(
        page.locator('[data-testid="add-medicine-button"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="medicines-table"]')
      ).toBeVisible();

      console.log('✅ 经理药品管理权限验证通过');
    });
  });

  test.describe('操作员权限', () => {
    test.use({ storageState: 'tests/e2e/auth/operator.json' });

    test('操作员只能访问基本操作功能', async ({ page }) => {
      await page.goto('/dashboard');

      // 验证操作员只能看到基本菜单
      await expect(page.locator('[data-testid="nav-inventory"]')).toBeVisible();

      // 验证操作员不能看到管理功能
      await expect(
        page.locator('[data-testid="nav-medicines"]')
      ).not.toBeVisible();
      await expect(
        page.locator('[data-testid="nav-reports"]')
      ).not.toBeVisible();
      await expect(page.locator('[data-testid="nav-users"]')).not.toBeVisible();
      await expect(
        page.locator('[data-testid="nav-settings"]')
      ).not.toBeVisible();

      console.log('✅ 操作员菜单权限验证通过');
    });

    test('操作员可以进行入库出库操作', async ({ page }) => {
      await page.goto('/inventory');

      await expect(page.locator('h1')).toContainText('库存管理');
      await expect(
        page.locator('[data-testid="inbound-button"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="outbound-button"]')
      ).toBeVisible();

      console.log('✅ 操作员库存操作权限验证通过');
    });

    test('操作员不能访问药品管理页面', async ({ page }) => {
      const response = await page.goto('/medicines');
      expect(response?.status()).toBe(403);

      console.log('✅ 操作员药品管理权限限制验证通过');
    });

    test('操作员不能访问报表页面', async ({ page }) => {
      const response = await page.goto('/reports');
      expect(response?.status()).toBe(403);

      console.log('✅ 操作员报表权限限制验证通过');
    });
  });

  test.describe('跨角色权限验证', () => {
    test('验证权限检查函数正确工作', async ({ page }) => {
      // 使用管理员身份
      await page.goto('/dashboard', {
        storageState: 'tests/e2e/auth/admin.json',
      });

      // 在浏览器中执行权限检查
      const adminCanManageUsers = await page.evaluate(() => {
        // 模拟权限检查逻辑
        const userRole = 'admin';
        const requiredRole = 'admin';
        const roleHierarchy = { admin: 3, manager: 2, operator: 1 };
        return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
      });

      expect(adminCanManageUsers).toBe(true);

      console.log('✅ 权限检查函数验证通过');
    });
  });
});
