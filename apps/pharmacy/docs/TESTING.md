# 测试指南

## 测试概览

本项目使用 Vitest 作为测试框架，结合 React Testing Library 进行组件测试。当前测试覆盖率达到 97.5%，包括单元测试和集成测试。

## 测试类型

### 单元测试

- **工具函数测试**: 测试独立的工具函数
- **状态管理测试**: 测试 Zustand store 的状态管理
- **Hooks 测试**: 测试自定义 hooks 的功能

### 集成测试

- **认证流程测试**: 测试用户认证和权限管理
- **扫码流程测试**: 测试条码扫描和处理
- **数据导入导出测试**: 测试数据的导入和导出功能

## 运行测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 生成测试覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

## 测试最佳实践

### 单元测试

- 专注于测试单一功能
- 使用描述性测试名称
- 测试边界条件和错误情况
- 保持测试独立性

### 集成测试

- 测试组件间交互
- 模拟真实用户场景
- 验证数据流和状态变化
- 测试错误处理流程

### Mock 使用

- 最小化 mock 复杂度
- 专注于测试逻辑而非实现细节
- 使用工厂函数创建测试数据
- 保持 mock 数据的一致性

## 测试用户

以下是系统中可用的测试用户账户：

| 角色    | 邮箱                   | 密码         | UUID                                 |
| ------- | ---------------------- | ------------ | ------------------------------------ |
| 管理员  | admin@pharmacy.com     | Admin123!    | 507c4d04-ca3b-422a-a0af-e0e0194eba5f |
| 经理    | manager@pharmacy.com   | Manager123!  | a20b17a3-7f4f-4e5c-9219-0394b5ed1c32 |
| 操作员  | operator@pharmacy.com  | Operator123! | 75fba74b-a048-4d7c-854e-cca53d206d45 |
| 操作员2 | operator2@pharmacy.com | Operator123! | 328eb867-7edf-4348-8cb1-594690a1ecf6 |

### 权限矩阵

| 功能         | Admin | Manager | Operator |
| ------------ | ----- | ------- | -------- |
| 用户管理     | ✅    | ❌      | ❌       |
| 药品信息管理 | ✅    | ✅      | ❌       |
| 入库操作     | ✅    | ✅      | ✅       |
| 出库操作     | ✅    | ✅      | ✅       |
| 库存查询     | ✅    | ✅      | ✅       |
| 报表查看     | ✅    | ✅      | ❌       |
| 数据导入导出 | ✅    | ✅      | ❌       |
| 系统配置     | ✅    | ❌      | ❌       |

## 改进计划

### 组件渲染测试

添加更多组件渲染测试，确保 UI 组件正确渲染：

```typescript
// 示例：药品表单组件测试
describe('MedicineForm Component', () => {
  it('should render all form fields', () => {
    render(<MedicineForm />);

    expect(screen.getByLabelText('药品名称')).toBeInTheDocument();
    expect(screen.getByLabelText('条码')).toBeInTheDocument();
    expect(screen.getByLabelText('规格')).toBeInTheDocument();
    expect(screen.getByLabelText('生产厂家')).toBeInTheDocument();
  });
});
```

### E2E 测试

使用 Playwright 添加端到端测试：

```typescript
// 示例：登录流程 E2E 测试
test('user can login and access dashboard', async ({ page }) => {
  await page.goto('/login');

  await page.fill('[data-testid="email"]', 'admin@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('仪表板');
});
```

### 可访问性测试

添加可访问性测试，确保应用符合 WCAG 标准：

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<MedicineForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```
