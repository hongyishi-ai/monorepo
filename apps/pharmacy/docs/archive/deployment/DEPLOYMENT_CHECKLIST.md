# 部署检查清单

## 部署前检查

### 环境配置检查

- [ ] 确认目标环境的 `.env` 文件配置正确
- [ ] 验证 Supabase URL 和密钥有效性
- [ ] 检查 API 端点配置
- [ ] 确认监控和分析配置

### 代码质量检查

- [ ] 所有单元测试通过
- [ ] 集成测试通过
- [ ] 代码格式检查通过 (`npm run format:check`)
- [ ] ESLint 检查通过 (`npm run lint`)
- [ ] TypeScript 类型检查通过 (`npm run type-check`)

### 安全检查

- [ ] 敏感信息未硬编码
- [ ] 环境变量正确配置
- [ ] HTTPS 强制启用（生产环境）
- [ ] CSP 策略配置正确

### 性能检查

- [ ] 构建产物大小合理
- [ ] 关键资源预加载配置
- [ ] 缓存策略配置正确
- [ ] 图片和静态资源优化

## 部署步骤

### 开发环境部署

```bash
# 1. 检查环境配置
npm run health-check

# 2. 运行测试
npm run test:ci

# 3. 构建项目
npm run build:development

# 4. 部署
npm run deploy:dev
```

### 预发布环境部署

```bash
# 1. 检查环境配置
NODE_ENV=staging npm run health-check

# 2. 运行完整测试套件
npm run test:ci

# 3. 构建项目
npm run build:staging

# 4. 部署
npm run deploy:staging
```

### 生产环境部署

```bash
# 1. 检查环境配置
NODE_ENV=production npm run health-check

# 2. 运行完整测试套件
npm run test:ci

# 3. 性能分析
npm run performance:analyze

# 4. 构建项目
npm run build:production

# 5. 部署
npm run deploy:prod
```

## 部署后验证

### 功能验证

- [ ] 用户登录功能正常
- [ ] 扫码功能正常工作
- [ ] 数据库连接正常
- [ ] API 调用正常响应
- [ ] 页面加载速度正常

### 监控验证

- [ ] 错误监控正常工作
- [ ] 性能监控数据收集正常
- [ ] 分析工具正常工作
- [ ] 日志记录正常

### 安全验证

- [ ] HTTPS 证书有效
- [ ] CSP 策略生效
- [ ] 敏感信息未泄露
- [ ] 权限控制正常

## 回滚计划

### 快速回滚

如果发现严重问题，可以快速回滚到上一个版本：

```bash
# Vercel 回滚
vercel rollback

# 或者重新部署上一个稳定版本
git checkout <last-stable-commit>
npm run deploy:prod
```

### 数据库回滚

如果涉及数据库变更：

```bash
# 运行数据库回滚脚本
npm run db:rollback

# 或者手动执行回滚 SQL
```

## 环境特定配置

### 开发环境

- 启用调试模式
- 启用开发工具
- 较短的缓存时间
- 详细的错误信息

### 预发布环境

- 接近生产的配置
- 启用错误报告
- 启用性能监控
- 测试用的分析工具

### 生产环境

- 关闭调试功能
- 启用所有监控
- 最优的缓存策略
- 最严格的安全配置

## 常见问题排查

### 构建失败

1. 检查 TypeScript 类型错误
2. 检查环境变量配置
3. 检查依赖版本兼容性

### 部署失败

1. 检查 Vercel 配置
2. 检查环境变量设置
3. 检查构建产物完整性

### 运行时错误

1. 检查 Supabase 连接
2. 检查 API 端点可用性
3. 检查浏览器控制台错误

## 联系信息

- 技术负责人：[姓名] - [邮箱]
- 运维负责人：[姓名] - [邮箱]
- 紧急联系：[电话]
