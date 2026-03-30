# 作品集封面图片

此目录用于存储作品集项目的封面图片。

## 当前使用的图片

项目目前使用 Unsplash CDN 图片。为了提升性能和稳定性，建议下载这些图片到本地。

### 需要下载的图片

1. **热射病防治平台** (`reshebing.jpg`)
   - Unsplash URL: https://images.unsplash.com/photo-1518186225049-a3a89322c36a?q=80&w=1200&auto=format&fit=crop
   - 建议尺寸: 1200x800px
   - 主题: 炎热天气、沙漠、医疗

2. **基层疾病诊断平台** (`clinic.jpg`)
   - Unsplash URL: https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop
   - 建议尺寸: 1200x800px
   - 主题: 数据分析、图表、医疗技术

3. **移动药房系统** (`yf.jpg`)
   - Unsplash URL: https://images.unsplash.com/photo-1618932260643-4c9957da35b4?q=80&w=1200&auto=format&fit=crop
   - 建议尺寸: 1200x800px
   - 主题: 药品、医药箱、流动医疗

4. **训练伤防治平台** (`fms.jpg`)
   - Unsplash URL: https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop
   - 建议尺寸: 1200x800px
   - 主题: 运动、训练、健康评估

## 如何使用本地图片

1. 下载上述图片并保存到此目录
2. 修改 `src/app/_components/portfolio/PortfolioGrid.tsx` 中的 `coverImage` 路径：

```typescript
// 从
coverImage: 'https://images.unsplash.com/photo-...'

// 改为
coverImage: '/assets/portfolio/covers/reshebing.jpg'
```

## 图片优化建议

- 格式: WebP (更好的压缩率) 或 JPG
- 尺寸: 1200x800px (3:2 比例)
- 质量: 80-85%
- 使用 Next.js Image 组件自动优化
- 提供多种尺寸的响应式图片

## 工具推荐

- **下载**: wget 或浏览器直接下载
- **压缩**: TinyPNG, ImageOptim
- **转换**: Squoosh (webp 转换)

