# Git提交指南

本文档指导如何规范化提交当前的代码变更。

**日期**: 2024-10-09  
**变更文件数**: 34个文件（30个修改，2个删除，4个新增）

---

## 提交策略

建议按功能分类提交，而不是一次性提交所有变更。这样可以：

- 保持清晰的提交历史
- 便于代码审查
- 方便回滚特定功能

---

## 建议的提交顺序

### 1. feat: 创建统一日志系统

**描述**: 添加logger工具类以统一管理日志输出

**文件**:

```bash
git add src/lib/logger.ts
git commit -m "feat: 创建统一日志系统支持开发/生产环境切换"
```

**提交信息**:

```
feat: 创建统一日志系统支持开发/生产环境切换

- 新增logger.ts工具类
- 支持debug, info, warn, error多种级别
- 开发环境详细输出，生产环境精简输出
- 提供错误监控集成点
- 支持上下文信息传递
```

---

### 2. feat: 优化构建配置提升性能

**描述**: 改进Vite构建配置，优化代码分割和压缩

**文件**:

```bash
git add vite.config.ts
git commit -m "feat: 优化构建配置提升性能和代码分割"
```

**提交信息**:

```
feat: 优化构建配置提升性能和代码分割

- 更新target从esnext到es2020确保兼容性
- 启用terser压缩并配置drop_console
- 优化代码分割策略（react-vendor, supabase, form, chart等）
- 细化UI组件分割为ui-core, ui-form, ui-feedback, ui-layout
- 优化chunk命名和资源命名规则
- 降低chunk大小警告阈值至800KB
- 启用CSS代码分割
- 禁用压缩大小报告加快构建速度
```

---

### 3. refactor: 分离UI组件variants常量

**描述**: 解决Fast Refresh警告，改善组件热更新

**文件**:

```bash
git add src/components/ui/button-variants.ts \
        src/components/ui/button.tsx \
        src/components/ui/toggle-variants.ts \
        src/components/ui/toggle.tsx \
        src/components/ui/toggle-group.tsx \
        src/components/ui/alert-dialog.tsx
git commit -m "refactor: 分离UI组件variants常量修复Fast Refresh警告"
```

**提交信息**:

```
refactor: 分离UI组件variants常量修复Fast Refresh警告

- 创建button-variants.ts和toggle-variants.ts
- 从组件文件中分离variants定义
- 更新相关组件导入路径
- 解决React Fast Refresh警告
- 改善组件热更新体验
```

---

### 4. fix: 修复ESLint import顺序错误

**描述**: 规范化import顺序

**文件**:

```bash
git add src/components/reports/ConsumptionStats.tsx
git commit -m "fix: 修复ConsumptionStats组件import顺序错误"
```

**提交信息**:

```
fix: 修复ConsumptionStats组件import顺序错误

- 调整card导入在dropdown-menu之前
- 符合ESLint import/order规则
```

---

### 5. perf: 优化生产环境调试代码

**描述**: 改进production-debug仅在需要时启用

**文件**:

```bash
git add src/lib/production-debug.ts
git commit -m "perf: 优化生产环境调试代码仅在显式启用时执行"
```

**提交信息**:

```
perf: 优化生产环境调试代码仅在显式启用时执行

- 修改为仅在VITE_ENABLE_DEBUG=true时自动初始化
- 默认情况下提供手动调试接口
- 减少生产环境性能开销
- 降低控制台噪音
```

---

### 6. chore: 清理未使用的npm依赖

**描述**: 移除12个未使用的包及相关配置

**文件**:

```bash
git add package.json package-lock.json
git add -u commitlint.config.js  # 已删除的文件
git commit -m "chore: 清理未使用的npm依赖和配置文件"
```

**提交信息**:

```
chore: 清理未使用的npm依赖和配置文件

移除未使用的依赖:
- @radix-ui/react-context-menu
- @radix-ui/react-hover-card
- @radix-ui/react-menubar
- @radix-ui/react-navigation-menu
- file-saver
- @commitlint/cli
- @commitlint/config-conventional
- @testing-library/user-event
- @vercel/node
- rimraf
- rollup-plugin-visualizer
- typescript-eslint

删除文件:
- commitlint.config.js

影响: 减少197个npm包，优化安装速度
```

---

### 7. docs: 完善项目文档和配置

**描述**: 更新README和创建技术债务文档

**文件**:

```bash
git add README.md \
        .env.example \
        docs/TECHNICAL_DEBT.md \
        docs/QUALITY_OPTIMIZATION_REPORT.md \
        docs/GIT_COMMIT_GUIDE.md
git commit -m "docs: 完善项目文档添加故障排除和技术债务追踪"
```

**提交信息**:

```
docs: 完善项目文档添加故障排除和技术债务追踪

新增文档:
- TECHNICAL_DEBT.md - 技术债务详细追踪
- QUALITY_OPTIMIZATION_REPORT.md - 质量优化完成报告
- GIT_COMMIT_GUIDE.md - Git提交规范指南

更新文档:
- README.md - 添加故障排除章节，更新日期为2024-10-09
- .env.example - 从docs/examples复制到根目录

改进:
- 提供常见问题解决方案
- 记录技术债务优先级
- 规范化git提交流程
```

---

### 8. refactor: 移除废弃的入库页面

**描述**: 清理已被InventoryOperationPage取代的旧页面

**文件**:

```bash
git add -u src/pages/InboundScanPage.tsx  # 已删除的文件
git commit -m "refactor: 移除废弃的InboundScanPage"
```

**提交信息**:

```
refactor: 移除废弃的InboundScanPage

- 删除src/pages/InboundScanPage.tsx
- 该功能已完全由InventoryOperationPage取代
- 路由已重定向，无引用依赖
- 减少代码库维护负担
```

---

### 9. fix: 修复其他生产环境问题

**描述**: 修复认证、PWA、UI等多个组件的问题

**文件**:

```bash
git add src/App.tsx \
        src/main.tsx \
        src/lib/auth-init.ts \
        src/lib/production-auth-fix.ts \
        src/lib/pwa.ts \
        src/components/error/ErrorBoundary.tsx \
        src/components/layout/AppLayout.tsx \
        src/components/navigation/EnhancedMobileNavigation.tsx \
        src/components/inventory/BatchList.tsx \
        src/components/reports/ExpiryWarningsCount.tsx \
        src/components/ui/StatsCard.tsx \
        src/hooks/use-inventory.ts \
        src/pages/AuditLogsPage.tsx \
        src/pages/DashboardPage.tsx \
        src/utils/supabase-utils.ts \
        index.html
git commit -m "fix: 修复生产环境认证、PWA和UI组件问题"
```

**提交信息**:

```
fix: 修复生产环境认证、PWA和UI组件问题

认证改进:
- 优化认证初始化流程
- 改善错误处理和用户反馈
- 修复生产环境认证问题

PWA改进:
- 优化Service Worker注册逻辑
- 改善离线体验

UI改进:
- 修复各组件显示问题
- 优化移动端导航
- 改善错误边界处理

注: 这些是历史累积的修改，现在统一提交
```

---

### 10. chore: 更新系统文件

**描述**: 更新.DS_Store等系统文件

**文件**:

```bash
# 注意：.DS_Store应该被忽略，不应提交
# 如果已经在git中，应该移除
git rm --cached .DS_Store
echo ".DS_Store" >> .gitignore
git add .gitignore
git commit -m "chore: 从git中移除.DS_Store并更新gitignore"
```

**提交信息**:

```
chore: 从git中移除.DS_Store并更新gitignore

- 使用git rm --cached移除.DS_Store
- .gitignore已包含.DS_Store规则
- 避免系统文件污染版本控制
```

---

## 执行提交

### 完整执行流程

```bash
# 1. 确保在正确的分支
git branch

# 2. 查看当前状态
git status

# 3. 按上述顺序执行提交
# （复制粘贴每个提交的命令）

# 4. 查看提交历史
git log --oneline -10

# 5. 推送到远程（如果需要）
git push origin main
```

### 验证提交

```bash
# 查看提交详情
git show HEAD

# 查看最近10次提交
git log --oneline --graph -10

# 查看某次提交的文件变更
git show <commit-hash>
```

---

## 注意事项

### 提交前检查

- [ ] 运行 `npm run type-check` 确保无TypeScript错误
- [ ] 运行 `npm run lint` 确保无严重ESLint错误
- [ ] 运行 `npm run build` 确保构建成功
- [ ] 测试应用是否正常运行

### 提交消息规范

使用Conventional Commits规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type类型**:

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构（既不是新功能也不是修复）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 回滚提交

如果某次提交有问题：

```bash
# 撤销最后一次提交（保留改动）
git reset --soft HEAD~1

# 撤销最后一次提交（丢弃改动）
git reset --hard HEAD~1

# 撤销某次特定提交
git revert <commit-hash>
```

---

## 推送到远程

### 推送前确认

```bash
# 查看将要推送的提交
git log origin/main..HEAD

# 查看差异
git diff origin/main..HEAD
```

### 执行推送

```bash
# 推送到main分支
git push origin main

# 如果被拒绝，先拉取
git pull --rebase origin main
git push origin main
```

---

## 总结

按照本指南执行后，你将拥有：

✅ 清晰的提交历史  
✅ 规范的提交消息  
✅ 易于追踪的变更  
✅ 便于代码审查的结构

建议在执行前先在测试分支上练习一遍，确保熟悉流程。

---

**文档创建时间**: 2024-10-09
