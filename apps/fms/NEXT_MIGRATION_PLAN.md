# FMS项目 Next.js 迁移计划

## 🎯 迁移目标

将FMS项目从 Vite + React SPA 迁移到 Next.js，以实现**混合前端原则**，提升SEO和性能。

## 📋 迁移策略

### 阶段一：基础架构迁移 (1-2周)
- [ ] 创建新的Next.js项目结构
- [ ] 迁移现有组件和页面到Next.js App Router
- [ ] 配置TypeScript和Tailwind CSS
- [ ] 迁移Zustand stores (服务端兼容性处理)
- [ ] 设置开发和构建环境

### 阶段二：渲染策略优化 (1-2周)
- [ ] **静态生成 (SSG)**：
  - 关于页面 (`/about`)
  - FMS知识库页面 (`/education`)
  - 首页静态内容
- [ ] **服务端渲染 (SSR)**：
  - 历史记录页面 (SEO友好)
  - 报告分享页面
- [ ] **客户端渲染 (CSR)**：
  - 评估页面 (需要交互状态)
  - 训练页面 (个性化内容)

### 阶段三：性能优化 (1周)
- [ ] 代码分割和懒加载
- [ ] 图片优化 (Next.js Image组件)
- [ ] 字体优化
- [ ] PWA功能迁移

## 🔧 技术实现细节

### 项目结构
```
fms-nextjs/
├── app/                 # App Router
│   ├── layout.tsx      # 根布局
│   ├── page.tsx        # 首页
│   ├── assessment/     # 评估页面 (CSR)
│   ├── report/         # 报告页面 (SSR)
│   ├── training/       # 训练页面 (CSR)
│   ├── education/      # 教育页面 (SSG)
│   └── history/        # 历史记录 (SSR)
├── components/         # 组件 (现有结构保持)
├── hooks/              # 自定义Hooks (现有结构保持)
├── stores/             # Zustand stores (添加SSR支持)
└── lib/                # 工具函数 (现有结构保持)
```

### 关键配置

#### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  // PWA配置
  withPWA: {
    dest: 'public',
    register: true,
    skipWaiting: true,
  },
  // 静态导出配置
  output: 'export', // 如需静态部署
  images: {
    unoptimized: true, // 静态导出时需要
  },
}

module.exports = nextConfig
```

#### Zustand SSR配置
```typescript
// 添加服务端兼容性
const useStoreHook = <T>(
  store: any,
  callback: (state: any) => T,
): T => {
  const result = store(callback)
  const [data, setData] = useState<T>()

  useEffect(() => setData(result), [result])

  return data ?? result
}
```

## 📈 预期收益

### 性能提升
- **首屏加载时间**: 减少40-60%
- **SEO评分**: 从30分提升到90+分
- **Core Web Vitals**: 全面达到"Good"标准

### 开发体验
- **热重载性能**: 提升30%
- **构建优化**: 自动代码分割
- **部署灵活性**: 支持Vercel/Netlify一键部署

### 用户体验
- **搜索引擎可见性**: 教育内容可被索引
- **分享体验**: 报告页面支持社交分享预览
- **离线体验**: 更好的PWA集成

## ⚠️ 风险评估

### 技术风险
- **存储兼容性**: IndexedDB在SSR环境的处理
- **状态水合**: 客户端/服务端状态一致性
- **路由迁移**: React Router到Next.js Router的适配

### 缓解措施
- 渐进式迁移，每个页面单独测试
- 保持现有Vite版本作为备份
- 充分的测试覆盖

## 🎯 成功指标

- [ ] 所有现有功能100%可用
- [ ] Lighthouse性能评分 > 90
- [ ] SEO评分 > 90
- [ ] 构建时间 < 30秒
- [ ] 首屏FCP < 1.5秒

## 📅 实施时间表

| 阶段 | 时间 | 里程碑 |
|------|------|--------|
| 阶段一 | 第1-2周 | 基础架构完成 |
| 阶段二 | 第3-4周 | 渲染策略实施 |  
| 阶段三 | 第5周 | 性能优化完成 |
| 测试期 | 第6周 | 全面测试和修复 |
| 部署 | 第7周 | 生产环境部署 |

这个迁移将使FMS项目完全符合React生态哲学的混合前端原则，大幅提升用户体验和开发效率。 