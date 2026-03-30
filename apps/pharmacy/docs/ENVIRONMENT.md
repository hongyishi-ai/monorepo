# 环境配置指南

## 概述

本项目支持多环境部署，包括开发环境、预发布环境和生产环境。每个环境都有独立的配置文件和 Supabase 项目。

## 环境文件

| 文件名             | 用途                           |
| ------------------ | ------------------------------ |
| `.env.example`     | 环境变量模板                   |
| `.env.development` | 开发环境配置                   |
| `.env.staging`     | 预发布环境配置                 |
| `.env.production`  | 生产环境配置                   |
| `.env.test`        | 测试环境配置                   |
| `.env`             | 本地开发配置（不提交到版本库） |

## 必需环境变量

| 变量名                   | 说明              | 示例                             |
| ------------------------ | ----------------- | -------------------------------- |
| `VITE_SUPABASE_URL`      | Supabase 项目 URL | `https://xxx.supabase.co`        |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJhbGciOiJIUzI1NiIs...`        |
| `VITE_APP_NAME`          | 应用名称          | `药品出入库管理系统`             |
| `VITE_APP_VERSION`       | 应用版本          | `1.0.0`                          |
| `VITE_APP_ENV`           | 应用环境          | `development/staging/production` |

## 环境设置步骤

### 1. 复制模板文件

```bash
# 开发环境
cp .env.example .env.development

# 预发布环境
cp .env.example .env.staging

# 生产环境
cp .env.example .env.production

# 本地开发
cp .env.example .env
```

### 2. 配置 Supabase

1. 登录 [Supabase](https://supabase.com)
2. 创建项目（每个环境一个项目）
3. 获取项目 URL 和 API Key
4. 更新对应环境文件中的配置

### 3. 验证配置

```bash
# 验证所有环境配置
npm run validate-env

# 验证特定环境
NODE_ENV=production npm run validate-env
```

## 数据库设置

### 执行 SQL 脚本

按照以下顺序在 Supabase SQL 编辑器中执行脚本：

1. `supabase/schema.sql` - 创建表结构
2. `supabase/seed-data-simple.sql` - 插入基础数据
3. `supabase/rls-policies.sql` - 设置行级安全策略

### 验证数据库设置

```bash
# 验证 Supabase 设置
npm run verify:supabase

# 测试数据库连接
npm run test:supabase
```

## 部署流程

### 开发环境部署

```bash
npm run deploy:dev
```

### 预发布环境部署

```bash
npm run deploy:staging
```

### 生产环境部署

```bash
npm run deploy:prod
```

## 环境特定配置建议

### 开发环境

- 启用调试和开发工具
- 使用较短的缓存时间
- 关闭分析和错误报告
- 允许 HTTP 连接

### 预发布环境

- 接近生产环境的配置
- 启用错误报告用于测试
- 启用调试便于问题排查
- 强制 HTTPS

### 生产环境

- 关闭所有调试功能
- 启用所有监控和分析
- 使用最优的缓存策略
- 最严格的安全配置

## 故障排除

### 常见问题

#### 1. 环境变量未生效

- 确认文件名正确（`.env.production` 而不是 `.env.prod`）
- 确认变量名以 `VITE_` 开头
- 重启开发服务器

#### 2. Supabase 连接失败

- 检查 URL 格式是否正确
- 验证 API Key 是否有效
- 确认网络连接正常

#### 3. 构建失败

- 运行 `npm run validate-env` 检查配置
- 检查 TypeScript 类型错误
- 确认所有必需变量已设置

### 调试命令

```bash
# 检查环境配置
npm run validate-env

# 测试 Supabase 连接
npm run test:supabase

# 运行健康检查
npm run health-check
```
