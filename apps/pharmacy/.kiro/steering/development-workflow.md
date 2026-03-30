# 开发工作流程指南

## Git 工作流程

### 分支策略
- **main**: 生产环境分支，只接受来自 develop 的合并
- **develop**: 开发主分支，集成所有功能分支
- **feature/***: 功能开发分支，从 develop 创建
- **hotfix/***: 紧急修复分支，从 main 创建
- **release/***: 发布准备分支，从 develop 创建

### 提交规范
使用 Conventional Commits 规范：
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

#### 提交类型
- **feat**: 新功能
- **fix**: 修复 bug
- **docs**: 文档更新
- **style**: 代码格式调整（不影响功能）
- **refactor**: 代码重构
- **test**: 测试相关
- **chore**: 构建过程或辅助工具的变动

#### 示例
```
feat(scanner): 添加条码扫描功能

- 集成 react-qr-scanner 库
- 实现扫码结果处理
- 添加扫码历史记录

Closes #123
```

### 代码审查流程
1. 创建 Pull Request
2. 自动运行 CI/CD 检查
3. 至少一名团队成员审查
4. 解决所有评论和建议
5. 合并到目标分支

## 开发环境设置

### 必需工具
- Node.js 18+ 
- pnpm 或 npm
- Git
- VS Code（推荐）

### VS Code 扩展
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### 环境变量配置
```bash
# .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_ENV=development
```

## 代码质量保证

### ESLint 配置
```javascript
// eslint.config.js
export default [
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/prop-types': 'off',
    },
  },
];
```

### Prettier 配置
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Husky 预提交钩子
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

## 测试策略

### 测试分类
1. **单元测试**: 测试独立的函数和组件
2. **集成测试**: 测试组件间的交互
3. **E2E 测试**: 测试完整的用户流程

### 测试命名规范
```typescript
// 单元测试
describe('MedicineService', () => {
  describe('getMedicines', () => {
    it('should return medicines list when successful', async () => {
      // 测试实现
    });
    
    it('should throw error when API fails', async () => {
      // 测试实现
    });
  });
});

// 组件测试
describe('MedicineForm', () => {
  it('should render form fields correctly', () => {
    // 测试实现
  });
  
  it('should validate required fields', async () => {
    // 测试实现
  });
});
```

### 测试覆盖率目标
- 整体覆盖率: ≥ 80%
- 业务逻辑函数: ≥ 90%
- 关键组件: ≥ 85%
- 工具函数: ≥ 95%

## 性能监控

### 性能指标
- **FCP (First Contentful Paint)**: < 1.5s
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### 监控工具
- Lighthouse CI
- Web Vitals
- Vercel Analytics
- Sentry (错误监控)

## 部署流程

### 环境分类
- **开发环境**: 自动部署 develop 分支
- **测试环境**: 手动部署 release 分支
- **生产环境**: 手动部署 main 分支

### 部署检查清单
- [ ] 所有测试通过
- [ ] 代码审查完成
- [ ] 性能测试通过
- [ ] 安全扫描通过
- [ ] 数据库迁移脚本准备
- [ ] 环境变量配置正确
- [ ] 回滚计划准备

### CI/CD 流水线
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

## 文档维护

### 文档类型
1. **README.md**: 项目概述和快速开始
2. **API 文档**: 接口说明和示例
3. **组件文档**: 组件使用说明
4. **部署文档**: 部署和运维指南

### 文档更新规则
- 新功能必须更新相关文档
- API 变更必须更新接口文档
- 重要配置变更必须更新部署文档
- 每个 PR 都要检查文档是否需要更新

## 问题跟踪

### Issue 标签系统
- **bug**: 程序错误
- **enhancement**: 功能增强
- **feature**: 新功能
- **documentation**: 文档相关
- **question**: 问题咨询
- **priority-high**: 高优先级
- **priority-medium**: 中优先级
- **priority-low**: 低优先级

### Bug 报告模板
```markdown
## Bug 描述
简要描述遇到的问题

## 复现步骤
1. 打开页面
2. 点击按钮
3. 查看结果

## 期望行为
描述期望的正确行为

## 实际行为
描述实际发生的错误行为

## 环境信息
- 浏览器: Chrome 120
- 操作系统: macOS 14
- 应用版本: v1.0.0

## 截图
如果适用，添加截图说明问题
```

## 代码审查指南

### 审查要点
1. **功能正确性**: 代码是否实现了预期功能
2. **代码质量**: 是否遵循编码规范
3. **性能影响**: 是否有性能问题
4. **安全性**: 是否存在安全漏洞
5. **可维护性**: 代码是否易于理解和维护

### 审查清单
- [ ] 代码逻辑正确
- [ ] 错误处理完善
- [ ] 测试覆盖充分
- [ ] 性能影响可接受
- [ ] 安全性检查通过
- [ ] 文档更新完整
- [ ] 符合编码规范

## 发布管理

### 版本号规范
使用语义化版本 (Semantic Versioning):
- **MAJOR**: 不兼容的 API 修改
- **MINOR**: 向下兼容的功能性新增
- **PATCH**: 向下兼容的问题修正

### 发布流程
1. 创建 release 分支
2. 更新版本号和 CHANGELOG
3. 执行完整测试
4. 合并到 main 分支
5. 创建 Git tag
6. 部署到生产环境
7. 发布说明和通知

### CHANGELOG 格式
```markdown
# Changelog

## [1.2.0] - 2024-01-15

### Added
- 新增扫码入库功能
- 添加批次管理界面

### Changed
- 优化库存查询性能
- 更新用户界面设计

### Fixed
- 修复登录状态异常问题
- 解决数据导出错误

### Security
- 修复权限验证漏洞
```