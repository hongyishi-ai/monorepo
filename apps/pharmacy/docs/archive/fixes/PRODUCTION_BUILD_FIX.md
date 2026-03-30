# 生产环境构建问题修复指南

## 问题描述

在生产环境部署时出现以下错误：

```
Uncaught TypeError: Cannot read properties of undefined (reading 'createContext')
```

## 问题原因

这个问题是由于 Vite 配置中的复杂 React 处理逻辑导致的：

1. **React API Polyfills 问题**: 之前的配置中包含了自定义的 React API polyfills，这些 polyfills 实现不完整，导致 `createContext` 等核心 API 在生产环境中不可用。

2. **复杂的分包策略**: 过于复杂的 `manualChunks` 配置可能导致 React 核心 API 被错误分割到不同的 chunk 中。

3. **依赖解析冲突**: 强制的 React 路径别名配置可能导致模块解析冲突。

## 修复方案

### 1. 简化 Vite 配置

已经简化了 `vite.config.ts` 配置，主要改动：

- ✅ 移除了所有 React API polyfills
- ✅ 简化了 `manualChunks` 配置，确保 React 生态系统完整性
- ✅ 移除了复杂的 React 路径别名配置
- ✅ 使用标准的 Vite + React 18 配置

### 2. 确保正确的 JSX 配置

- ✅ `tsconfig.app.json` 中使用 `"jsx": "react-jsx"`（React 18 自动 JSX 运行时）
- ✅ Vite 插件中使用 `jsxRuntime: 'automatic'`

## 修复步骤

### 自动修复（推荐）

运行修复脚本：

```bash
cd pharmacy-inventory-system
node scripts/fix-production-build.js
```

### 手动修复

如果需要手动执行，按以下步骤：

1. **清理缓存和构建文件**

   ```bash
   rm -rf node_modules/.vite
   rm -rf dist
   rm -f tsconfig.app.tsbuildinfo
   ```

2. **重新安装依赖**

   ```bash
   npm ci
   ```

3. **类型检查**

   ```bash
   npm run type-check
   ```

4. **生产环境构建**

   ```bash
   npm run build:production
   ```

5. **本地预览测试**
   ```bash
   npm run preview
   ```

## 验证修复

### 1. 本地验证

```bash
# 启动本地预览
npm run preview

# 在浏览器中访问 http://localhost:4173
# 检查控制台是否还有 createContext 错误
```

### 2. 构建文件检查

检查 `dist/assets/` 目录中的文件：

- 应该有一个 `react-vendor-[hash].js` 文件包含所有 React 核心 API
- 应该有一个 `ui-vendor-[hash].js` 文件包含 Radix UI 组件
- 不应该有过多的小 chunk 文件

### 3. 生产环境部署

部署到 Vercel 或其他平台后，检查：

- 页面能正常加载
- 控制台没有 `createContext` 相关错误
- 所有功能正常工作

## 预防措施

### 1. 保持简单的 Vite 配置

- 避免复杂的自定义 polyfills
- 使用标准的分包策略
- 不要强制覆盖 React 的内部行为

### 2. 依赖管理

- 确保 React 和 React-DOM 版本一致
- 使用 `dedupe` 配置避免重复的 React 实例
- 定期更新依赖到稳定版本

### 3. 测试流程

- 每次修改 Vite 配置后都要测试生产构建
- 使用 `npm run preview` 在本地测试生产构建
- 在多个浏览器中测试

## 相关文件

- `vite.config.ts` - 主要的 Vite 配置文件
- `tsconfig.app.json` - TypeScript 应用配置
- `package.json` - 依赖版本管理
- `scripts/fix-production-build.js` - 自动修复脚本

## 常见问题

### Q: 为什么开发环境正常，生产环境出错？

A: 开发环境和生产环境使用不同的构建策略。开发环境使用 ES 模块和热重载，而生产环境会进行代码分割、压缩和优化，这些过程中可能导致 React API 被错误处理。

### Q: 如何避免类似问题？

A:

1. 保持 Vite 配置简单
2. 不要自定义 React 内部 API
3. 使用标准的 React 18 配置
4. 定期测试生产构建

### Q: 如果问题仍然存在怎么办？

A:

1. 检查浏览器控制台的详细错误信息
2. 检查网络面板中的资源加载情况
3. 尝试在不同浏览器中测试
4. 检查是否有其他第三方库冲突

## 更新日志

- **2024-01-25**: 修复 React createContext 未定义问题
- **2024-01-25**: 简化 Vite 配置，移除有问题的 polyfills
- **2024-01-25**: 添加自动修复脚本和验证流程
