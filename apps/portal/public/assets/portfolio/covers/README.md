# 作品集封面图片

此目录保留早期作品集项目封面图片。当前主站首页已经优先使用 `/assets/brand-posters/` 下的红医师品牌海报作为项目封面和首屏视觉资产。

## 当前主站使用的品牌海报

1. **热射病防治平台**
   - 当前封面: `/assets/brand-posters/heat-stroke.jpg`
   - 来源: 用户提供的“热射病防治”品牌海报

2. **训练伤防治平台**
   - 当前封面: `/assets/brand-posters/training-injury.jpg`
   - 来源: 用户提供的“训练伤防治”品牌海报

3. **战场救护 TCCC 平台**
   - 当前封面: `/assets/brand-posters/combat-rescue.jpg`
   - 来源: 用户提供的“战伤救护”品牌海报

4. **红医师品牌主视觉**
   - 当前首屏视觉: `/assets/brand-posters/hongyishi-brand.jpg`
   - 来源: 用户提供的“红医师”品牌海报

## 如何替换项目封面

1. 优先将新品牌海报保存到 `/assets/brand-posters/`
2. 修改 `apps/portal/src/lib/projects.json` 中对应项目的 `coverImage`
3. 保持路径为根相对路径，例如 `/assets/brand-posters/heat-stroke.jpg`

## 图片优化建议

- 格式: WebP (更好的压缩率) 或 JPG
- 当前海报尺寸: 906x1280px
- 质量: 80-85%
- 使用 Next.js Image 组件自动优化
- 提供多种尺寸的响应式图片
