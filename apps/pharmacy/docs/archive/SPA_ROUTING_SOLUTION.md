# SPA路由404问题解决方案

## 🎯 问题描述

在生产环境 `https://yf.hongyishi.cn` 中，当用户在任何页面（如 `/dashboard`）刷新浏览器时，会收到 404 错误。这是典型的单页应用（SPA）路由配置问题。

## 🔍 问题根因分析

1. **服务器配置问题**: Web服务器（Vercel）没有正确配置SPA fallback规则
2. **缓存问题**: 旧的配置可能被缓存
3. **Service Worker问题**: Service Worker可能没有正确处理导航请求
4. **部署配置问题**: 部署时可能没有包含正确的配置文件

## ✅ 已实施的解决方案

### 1. 优化Vercel配置

**文件**: `vercel.json`

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/((?!api|_next|_static|assets|favicon.ico|manifest.json|sw.js|workbox-*|icons|vite.svg|debug-production.js).*)",
      "destination": "/index.html"
    }
  ]
}
```

**改进点**:

- 更精确的正则表达式，排除所有静态资源
- 确保API路由不被重定向
- 添加了 `assets` 目录到排除列表

### 2. 备注：不再使用 `_redirects`

本项目仅在 Vercel 运行，不再使用 `_redirects` 文件。请以 `vercel.json` 的 `rewrites` 为准。

### 3. Service Worker路由保护

**文件**: `public/sw.js`

Service Worker已配置为拦截导航请求并在网络失败时返回缓存的index.html：

```javascript
// 处理导航请求（解决404问题的关键）
if (request.mode === 'navigate') {
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          return response;
        }
        // 如果是404或其他错误，返回缓存的index.html
        return caches.match('/index.html');
      })
      .catch(() => {
        // 如果网络请求失败，返回缓存的index.html
        return caches.match('/index.html');
      })
  );
  return;
}
```

### 4. React Router配置验证

**文件**: `src/App.tsx`

确认使用了正确的配置：

- ✅ 使用 `BrowserRouter`
- ✅ 有404路由处理 (`path="*"`)
- ✅ 所有路由都正确配置

## 🚀 部署修复步骤

### 步骤1: 应用修复

```bash
# 运行自动修复脚本
npm run fix:spa-routing

# 重新构建项目
npm run build

# 验证配置
npm run check:spa-routing
```

### 步骤2: 本地测试

```bash
# 启动本地预览
npm run preview

# 在浏览器中测试以下场景:
# 1. 访问 http://localhost:4173/dashboard
# 2. 刷新页面，确保不出现404
# 3. 直接访问 http://localhost:4173/medicines
# 4. 测试所有主要路由
```

### 步骤3: 部署到生产环境

```bash
# 如果使用Vercel CLI
vercel --prod

# 或者推送到Git仓库触发自动部署
git add .
git commit -m "fix: 修复SPA路由404问题"
git push origin main
```

### 步骤4: 清除缓存

部署完成后，需要清除各种缓存：

1. **Vercel缓存**: 在Vercel控制台中清除部署缓存
2. **CDN缓存**: 等待CDN缓存过期或手动清除
3. **浏览器缓存**:
   - 硬刷新 (Ctrl+F5 或 Cmd+Shift+R)
   - 清除浏览器缓存
   - 使用无痕模式测试

### 步骤5: 验证修复

```bash
# 测试生产环境路由
npm run diagnose:spa-routing https://yf.hongyishi.cn
```

## 🔧 故障排除

### 如果问题仍然存在

1. **检查Vercel部署日志**:
   - 确认vercel.json被正确读取
   - 检查构建过程中是否有错误

2. **验证文件部署**:
   - 确认 `vercel.json` 随构建一起部署
   - 确认 `sw.js` 文件正确部署

3. **Service Worker调试**:

   ```javascript
   // 在浏览器控制台中检查Service Worker状态
   navigator.serviceWorker.getRegistrations().then(registrations => {
     console.log('Service Workers:', registrations);
   });
   ```

4. **网络调试**:
   - 打开浏览器开发者工具
   - 查看Network标签页
   - 刷新页面，检查请求和响应

### 常见问题

**Q: 为什么本地测试正常，生产环境还是404？**
A: 可能是缓存问题。尝试：

- 清除浏览器缓存
- 使用无痕模式
- 等待CDN缓存过期（通常5-15分钟）

**Q: Service Worker是否会影响路由？**
A: Service Worker应该帮助解决路由问题。如果怀疑Service Worker有问题，可以在开发者工具中注销它：

```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
```

**Q: 如何确认Vercel配置生效？**
A: 检查Vercel部署日志，或者在Vercel控制台的Functions标签页查看是否有重写规则。

## 📋 预防措施

### 1. 部署前检查

在每次部署前运行：

```bash
npm run check:spa-routing
```

### 2. 自动化测试

考虑添加E2E测试来验证路由：

```javascript
// 示例Playwright测试
test('SPA routing works after refresh', async ({ page }) => {
  await page.goto('/dashboard');
  await page.reload();
  await expect(page).toHaveURL(/.*dashboard/);
});
```

### 3. 监控

设置监控来检测404错误：

- 使用Vercel Analytics
- 设置错误监控（如Sentry）
- 定期运行路由诊断脚本

## 🎯 总结

这个解决方案提供了多层保护：

1. **Vercel层**: 通过rewrites规则重定向到index.html
2. **备用层**: \_redirects文件作为备用
3. **客户端层**: Service Worker拦截和处理
4. **应用层**: React Router正确配置

通过这些措施，应该能够彻底解决SPA路由的404问题。如果问题仍然存在，请检查部署日志和缓存状态。
