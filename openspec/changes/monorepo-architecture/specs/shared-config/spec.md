# Shared Configuration

本规范定义了红医师共享配置包 `@hongyishi/config` 的模块划分，包括 ESLint、Prettier、TypeScript 和 Tailwind CSS 的统一配置。

## ADDED Requirements

### Requirement: ESLint Configuration

`@hongyishi/config/eslint` SHALL 提供统一的 ESLint 配置，基于 `eslint:recommended`、`@typescript-eslint/recommended`、`react/recommended` 和 `react-hooks/recommended`。

#### Scenario: App Inherits Shared ESLint Config

- GIVEN `apps/portal/.eslintrc.js` 配置为 `extends: ['@hongyishi/config/eslint']`
- WHEN 开发者在 portal 中编写 React 代码
- THEN ESLint 自动启用 TypeScript 解析、React 规则、React Hooks 规则
- AND Prettier 集成（通过 eslint-config-prettier）防止冲突

#### Scenario: TypeScript Parsing for All Apps

- GIVEN pharmacy 使用 TypeScript + React
- WHEN ESLint 运行 `pnpm --filter @hongyishi/pharmacy lint`
- THEN `@typescript-eslint/parser` 正确解析 `.tsx` 文件
- AND 不需要每个 app 单独安装和配置 TypeScript ESLint 插件

---

### Requirement: Prettier Configuration

`@hongyishi/config/prettier` SHALL 提供统一的代码格式化规则。

配置约定：
- `printWidth: 100` — 每行最大字符数
- `singleQuote: true` — 使用单引号
- `trailingComma: 'all'` — 对象/数组末尾加逗号
- `semi: true` — 语句末尾加分号

#### Scenario: Consistent Code Style Across Apps

- GIVEN 开发者 A 在 clinic 编写代码，开发者 B 在 fms 编写代码
- WHEN 两人都运行 `pnpm format`（Prettier）
- THEN 代码格式化结果完全一致
- AND Git diff 中不会因为格式差异产生不必要的变更行

#### Scenario: ESLint + Prettier Integration

- GIVEN `apps/clinic/.eslintrc.js` 使用 `@hongyishi/config/eslint`
- WHEN ESLint 配置中包含 `eslint-config-prettier` 禁用冲突规则
- THEN ESLint 不会对 Prettier 管理的格式问题（如引号）报错
- AND 两者协同工作，职责清晰

---

### Requirement: TypeScript Configuration

`@hongyishi/config/typescript` SHALL 通过 `tsconfig.base.json` 和 `packages/config/typescript/index.js` 提供基础 TypeScript 配置。

基准配置（`tsconfig.base.json`）：
- `target: ES2022`
- `lib: ["ES2022", "DOM", "DOM.Iterable"]`
- `module: ESNext`
- `moduleResolution: bundler`
- `jsx: react-jsx`
- `strict: true`
- `declaration: true` + `declarationMap: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`

#### Scenario: App Inherits Base TSConfig

- GIVEN `apps/portal/tsconfig.json` 配置为 `extends: '@hongyishi/config/typescript/base.json'`
- WHEN portal 开发者编写 TypeScript 代码
- THEN `strict: true` 强制所有类型必须显式声明
- AND `skipLibCheck: true` 跳过 node_modules 类型检查以提升速度

#### Scenario: Path Alias Resolution

- GIVEN clinic 的 `tsconfig.json` 配置了 `"paths": { "@/*": ["./src/*"] }`
- WHEN 开发者写入 `import { Button } from '@/components/Button'`
- THEN TypeScript 正确解析到 `apps/clinic/src/components/Button.tsx`
- AND Turborepo 的 `type-check` 任务也使用相同的路径解析规则

---

### Requirement: Tailwind CSS Configuration

`@hongyishi/config/tailwind` SHALL 提供统一的 Tailwind 主题配置。

主题配置：
- `content: ['./src/**/*.{js,ts,jsx,tsx}']`
- `darkMode: 'class'`
- 颜色令牌：`primary`（sky 色阶）、自定义扩展
- 字体：`Noto Sans SC` 作为中文字体
- 间距、圆角、阴影等扩展

#### Scenario: Tailwind Config Inheritance in pharmacy

- GIVEN `apps/pharmacy/tailwind.config.js` 配置为 `extends: '@hongyishi/config/tailwind'`
- WHEN pharmacy 开发者在 JSX 中使用 `className="text-primary-500"`
- THEN Tailwind 正确生成 sky-500 颜色的样式
- AND 不需要 pharmacy 重新定义 primary 色阶

#### Scenario: Dark Mode Consistency

- GIVEN 所有 apps 都通过 `@hongyishi/config/tailwind` 配置 dark mode
- WHEN 用户在 portal 中切换暗色模式
- THEN `darkMode: 'class'` 在 `<html class="dark">` 下激活暗色样式
- AND pharmacy、clinic、fms 的暗色模式行为完全一致

---

### Requirement: Config Package Export Structure

`@hongyishi/config` SHALL 通过 `exports` field 提供子路径导出。

#### Scenario: App Imports Specific Config Subpath

- GIVEN fms 需要仅继承 Prettier 配置（已有 ESLint 自定义）
- WHEN 在 `.prettierrc.js` 中写入 `extends: ['@hongyishi/config/prettier']`
- THEN 不需要引入整个 `@hongyishi/config` 包
- AND 仅加载 Prettier 相关配置子模块
