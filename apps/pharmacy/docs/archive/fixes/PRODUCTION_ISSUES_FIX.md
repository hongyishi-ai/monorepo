# 生产环境问题修复指南

## 问题概述

生产环境中出现了以下问题：

1. **CSP (Content Security Policy) 错误**
   - Cloudflare Insights 脚本被阻止
   - 错误信息：`Refused to load the script 'https://static.cloudflareinsights.com/beacon.min.js'`

2. **PWA 图标 404 错误**
   - 缺少 icon-144x144.svg 文件访问
   - 错误信息：`GET https://yf.hongyishi.cn/icons/icon-144x144.svg 404 (Not Found)`

3. **过时的 meta 标签警告**
   - `apple-mobile-web-app-capable` 已被弃用
   - 建议使用 `mobile-web-app-capable`

## 修复方案

### 1. CSP 策略修复

**问题原因：** Vercel 配置中的 CSP 策略没有包含 Cloudflare Insights 域名。

**修复内容：**

```json
// vercel.json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' data: https://vercel.live https://*.vercel.live https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://vercel.live https://*.vercel.live; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live https://*.vercel.live wss://vercel.live wss://*.vercel.live https://cloudflareinsights.com; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';"
}
```

**修改内容：**

- 在 `script-src` 中添加 `https://static.cloudflareinsights.com`
- 在 `connect-src` 中添加 `https://cloudflareinsights.com`

### 2. PWA Meta 标签修复

**问题原因：** 使用了过时的 `apple-mobile-web-app-capable` meta 标签。

**修复内容：**

```html
<!-- index.html -->
<!-- 修复前 -->
<meta name="apple-mobile-web-app-capable" content="yes" />

<!-- 修复后 -->
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

**说明：** 保留旧标签以确保向后兼容，同时添加新的标准标签。

### 3. PWA 图标文件验证

**验证结果：** 所有图标文件都存在且正常：

- ✅ icon-72x72.svg (595 bytes)
- ✅ icon-96x96.svg (609 bytes)
- ✅ icon-128x128.svg (587 bytes)
- ✅ icon-144x144.svg (601 bytes)
- ✅ icon-152x152.svg (601 bytes)
- ✅ icon-192x192.svg (614 bytes)
- ✅ icon-384x384.svg (615 bytes)
- ✅ icon-512x512.svg (588 bytes)

**可能原因：** 部署时文件没有正确上传或缓存问题。

## 部署修复步骤

### 方法一：快速修复部署

```bash
# 1. 清理构建缓存
npm run clean

# 2. 重新构建
npm run build

# 3. 验证构建产物
ls -la dist/icons/

# 4. 部署到生产环境
vercel --prod
```

### 方法二：使用修复脚本

```bash
# 运行生产环境修复脚本
node scripts/deploy-production-fix.js
```

### 方法三：手动验证和部署

```bash
# 1. 验证当前配置
node scripts/fix-production-issues.js

# 2. 如果验证通过，提交更改
git add .
git commit -m "fix: 修复生产环境CSP和PWA问题"

# 3. 推送到仓库（触发自动部署）
git push origin main
```

## 验证修复效果

部署完成后，请验证以下内容：

### 1. 控制台错误检查

- [ ] 不再出现 CSP 错误
- [ ] 不再出现 PWA 图标 404 错误
- [ ] 不再出现过时 meta 标签警告

### 2. PWA 功能测试

- [ ] 可以正常安装 PWA 应用
- [ ] 图标显示正常
- [ ] 离线功能正常

### 3. 扫码功能测试

- [ ] 扫码功能正常工作
- [ ] 摄像头权限正常
- [ ] 扫码结果处理正常

### 4. 用户功能测试

- [ ] 登录功能正常
- [ ] 药品管理功能正常
- [ ] 库存操作功能正常

## 监控和预防

### 1. 设置监控

```javascript
// 添加到 main.tsx 或 App.tsx
if (typeof window !== 'undefined') {
  // 监控 CSP 违规
  window.addEventListener('securitypolicyviolation', e => {
    console.error('CSP Violation:', e.violatedDirective, e.blockedURI);
  });

  // 监控资源加载错误
  window.addEventListener('error', e => {
    if (e.target !== window) {
      console.error('Resource Load Error:', e.target.src || e.target.href);
    }
  });
}
```

### 2. 部署前检查清单

- [ ] 运行 `node scripts/fix-production-issues.js` 验证配置
- [ ] 检查所有静态资源文件存在
- [ ] 验证 CSP 策略包含所有必需域名
- [ ] 测试 PWA 安装功能
- [ ] 验证环境变量配置正确

### 3. 定期维护

- 每月检查 CSP 策略是否需要更新
- 定期验证 PWA 图标文件完整性
- 监控新的浏览器警告和错误
- 更新过时的 meta 标签和配置

## 相关文件

- `vercel.json` - Vercel 部署配置
- `index.html` - HTML 模板和 meta 标签
- `public/manifest.json` - PWA 清单文件
- `public/icons/` - PWA 图标文件目录
- `scripts/fix-production-issues.js` - 问题验证脚本
- `scripts/deploy-production-fix.js` - 修复部署脚本

## 故障排除

### 如果 CSP 错误仍然存在

1. 检查 Vercel 配置是否正确部署
2. 清除浏览器缓存
3. 验证域名配置是否正确

### 如果 PWA 图标仍然 404

1. 检查构建产物中是否包含图标文件
2. 验证文件路径是否正确
3. 检查 Vercel 静态文件配置

### 如果部署失败

1. 检查环境变量配置
2. 验证构建过程是否成功
3. 查看 Vercel 部署日志

## 联系支持

如果问题仍然存在，请提供以下信息：

- 浏览器控制台完整错误信息
- 网络请求失败的详细信息
- 部署日志和构建日志
- 当前的 vercel.json 配置内容
