-- 为 medicines 表添加 unit 字段
-- 执行时间: 2024-01-XX

-- 添加 unit 字段，默认值为 '盒'
ALTER TABLE medicines 
ADD COLUMN unit VARCHAR(10) NOT NULL DEFAULT '盒';

-- 添加注释
COMMENT ON COLUMN medicines.unit IS '药品基本单位，如：盒、瓶、片、粒等';

-- 更新现有数据的单位（可根据实际情况调整）
-- 这里设置一些常见的默认值，实际使用时可能需要手动调整

-- 胶囊类药品设置为 '粒'
UPDATE medicines 
SET unit = '粒' 
WHERE name LIKE '%胶囊%' OR name LIKE '%capsule%';

-- 片剂类药品设置为 '片'
UPDATE medicines 
SET unit = '片' 
WHERE name LIKE '%片%' OR name LIKE '%tablet%';

-- 注射剂类药品设置为 '支'
UPDATE medicines 
SET unit = '支' 
WHERE name LIKE '%注射%' OR name LIKE '%injection%' OR category = 'injection';

-- 口服液类药品设置为 '瓶'
UPDATE medicines 
SET unit = '瓶' 
WHERE name LIKE '%口服液%' OR name LIKE '%糖浆%' OR name LIKE '%合剂%';

-- 颗粒剂类药品设置为 '袋'
UPDATE medicines 
SET unit = '袋' 
WHERE name LIKE '%颗粒%' OR name LIKE '%冲剂%';

-- 软膏类药品设置为 '支'
UPDATE medicines 
SET unit = '支' 
WHERE name LIKE '%软膏%' OR name LIKE '%乳膏%' OR name LIKE '%凝胶%';

-- 其他保持默认的 '盒'

-- 验证更新结果
SELECT 
    unit,
    COUNT(*) as count,
    ARRAY_AGG(name ORDER BY name LIMIT 3) as sample_names
FROM medicines 
GROUP BY unit 
ORDER BY count DESC;
