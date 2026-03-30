# Supabase 项目设置指南

## 创建 Supabase 项目

1. 访问 [Supabase 官网](https://supabase.com/) 并登录
2. 点击 "New Project" 创建新项目
3. 填写项目信息:
   - 项目名称: pharmacy-inventory-system
   - 数据库密码: 设置一个安全的密码
   - 区域: 选择离您最近的区域
4. 点击 "Create new project" 并等待项目创建完成

## 获取项目凭据

1. 在 Supabase 项目仪表板中，点击左侧菜单的 "Settings" (设置)
2. 选择 "API" 选项
3. 在 "Project API keys" 部分，您将找到:
   - `URL`: 项目 URL
   - `anon public`: 匿名公共密钥

## 配置环境变量

1. 复制项目的 URL 和 anon public 密钥
2. 在项目根目录创建 `.env` 文件 (如果不存在)
3. 添加以下内容:

```
VITE_SUPABASE_URL=您的项目URL
VITE_SUPABASE_ANON_KEY=您的匿名公共密钥
```

## 数据库表结构

项目需要以下表结构:

1. `users` - 用户信息
2. `medicines` - 药品基础信息
3. `batches` - 批次信息
4. `inventory_transactions` - 库存交易记录
5. `system_settings` - 系统配置

详细的表结构将在后续任务中创建。

## 验证连接

运行应用程序并检查控制台，确保没有 Supabase 连接错误。您可以使用 `checkSupabaseConnection()` 函数来验证连接是否成功。

## 注意事项

- 不要将包含真实凭据的 `.env` 文件提交到版本控制系统
- 在生产环境中，使用环境变量或部署平台的密钥管理系统存储凭据
- 定期轮换密钥以提高安全性
