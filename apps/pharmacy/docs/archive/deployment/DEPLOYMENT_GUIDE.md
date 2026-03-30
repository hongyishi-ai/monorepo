# 部署指南

本文档详细说明了药品出入库管理系统的部署流程和配置。

## 目录

- [环境要求](#环境要求)
- [环境配置](#环境配置)
- [构建和部署](#构建和部署)
- [Vercel 部署](#vercel-部署)
- [环境变量管理](#环境变量管理)
- [性能优化](#性能优化)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)

## 环境要求

### 开发环境

- Node.js 18+
- npm 9+ 或 pnpm 8+
- Git 2.30+

### 生产环境

- Vercel 账户
- Supabase 项目
- 域名（可选）

## 环境配置

### 1. 克隆项目

```bash
git clone <repository-url>
cd pharmacy-inventory-system
```

### 2. 安装依赖

```bash
npm install
# 或
pnpm install
```

### 3. 环境变量配置

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入实际配置：

```env
# Supabase 配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 应用配置
VITE_APP_NAME=药品出入库管理系统
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development

# 其他配置...
```

### 4. 数据库设置

运行数据库初始化脚本：

```bash
npm run setup:database
```

## 构建和部署

### 本地构建

```bash
# 开发环境构建
npm run build:dev

# 生产环境构建
npm run build:prod

# 预览构建结果
npm run preview
```

### 自动化部署

使用部署脚本：

```bash
# 部署到开发环境
npm run deploy:dev

# 部署到生产环境
npm run deploy:prod
```

部署脚本会自动执行以下步骤：

1. 检查环境配置
2. 安装依赖
3. 运行测试（生产环境）
4. 构建项目
5. 检查构建产物
6. 部署到 Vercel
7. 生成部署报告

## Vercel 部署

### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 2. 登录 Vercel

```bash
vercel login
```

### 3. 初始化项目

```bash
vercel
```

### 4. 配置环境变量

在 Vercel 控制台中设置环境变量：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_NAME`
- `VITE_APP_VERSION`
- 其他必要变量...

### 5. 部署配置

项目已包含 `vercel.json` 配置文件，包含：

- 构建设置
- 路由重写
- 安全头设置
- 缓存策略
- 重定向规则

### 6. 自动部署

配置 GitHub 集成后，每次推送到主分支会自动触发部署。

## 环境变量管理

### 环境分类

- **开发环境** (`.env.development`)
  - 本地开发使用
  - 启用调试功能
  - 使用开发数据库

- **生产环境** (`.env.production`)
  - 生产部署使用
  - 禁用调试功能
  - 启用性能监控
  - 使用生产数据库

- **测试环境** (`.env.test`)
  - 自动化测试使用
  - 使用测试数据库

### 必需变量

| 变量名                   | 描述              | 示例                      |
| ------------------------ | ----------------- | ------------------------- |
| `VITE_SUPABASE_URL`      | Supabase 项目 URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJ...`                  |
| `VITE_APP_NAME`          | 应用名称          | `药品出入库管理系统`      |
| `VITE_APP_VERSION`       | 应用版本          | `1.0.0`                   |

### 可选变量

| 变量名                  | 描述            | 默认值  |
| ----------------------- | --------------- | ------- |
| `VITE_ENABLE_ANALYTICS` | 启用分析        | `false` |
| `VITE_SENTRY_DSN`       | Sentry 错误监控 | -       |
| `VITE_API_TIMEOUT`      | API 超时时间    | `30000` |

## 性能优化

### 构建优化

项目已配置以下优化：

1. **代码分割**
   - 按路由分割
   - 按功能模块分割
   - 第三方库分离

2. **资源优化**
   - 图片压缩
   - CSS 压缩
   - JavaScript 压缩

3. **缓存策略**
   - 静态资源长期缓存
   - HTML 文件不缓存
   - API 响应适当缓存

### 运行时优化

1. **React 优化**
   - 组件懒加载
   - 状态管理优化
   - 渲染性能优化

2. **网络优化**
   - HTTP/2 支持
   - 资源预加载
   - 服务端压缩

### 性能监控

```bash
# 构建分析
npm run analyze

# 性能检查
npm run health-check

# 性能监控
npm run performance:analyze
```

## 监控和维护

### 健康检查

定期运行健康检查：

```bash
npm run health-check
```

检查项目包括：

- 环境变量配置
- 依赖版本
- 构建产物
- Supabase 连接
- 应用可访问性

### 日志监控

生产环境建议配置：

- Sentry 错误监控
- Vercel Analytics
- 自定义性能监控

### 备份策略

- 数据库定期备份
- 环境配置备份
- 代码版本控制

## 故障排除

### 常见问题

#### 1. 构建失败

**问题**: TypeScript 编译错误

```bash
npm run type-check
```

**解决**: 修复类型错误后重新构建

#### 2. 环境变量未生效

**问题**: 环境变量配置错误

```bash
npm run health-check
```

**解决**: 检查变量名和值是否正确

#### 3. Supabase 连接失败

**问题**: 数据库连接异常

```bash
npm run test:supabase
```

**解决**: 检查 URL 和密钥配置

#### 4. 部署失败

**问题**: Vercel 部署错误

**解决步骤**:

1. 检查构建日志
2. 验证环境变量
3. 检查依赖版本
4. 联系技术支持

### 调试工具

```bash
# 检查构建产物
npm run build && ls -la dist/

# 测试本地预览
npm run preview

# 检查依赖
npm audit

# 清理缓存
npm run clean
```

### 回滚策略

1. **代码回滚**

   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Vercel 回滚**
   - 在 Vercel 控制台选择之前的部署
   - 点击 "Promote to Production"

3. **数据库回滚**
   - 使用数据库备份恢复
   - 运行回滚脚本

## 安全考虑

### 环境变量安全

- 不要在代码中硬编码敏感信息
- 使用 Vercel 环境变量管理
- 定期轮换密钥

### 网络安全

- 启用 HTTPS
- 配置安全头
- 实施 CSP 策略

### 访问控制

- 配置适当的 RLS 策略
- 实施用户权限管理
- 定期审查访问日志

## 联系支持

如遇到部署问题，请：

1. 查看部署日志
2. 运行健康检查
3. 查阅故障排除指南
4. 联系技术团队

---

**注意**: 请确保在生产环境部署前充分测试所有功能。
