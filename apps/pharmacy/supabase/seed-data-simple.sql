-- 简化版种子数据
-- 适用于 Supabase SQL 编辑器

-- 插入系统默认配置
INSERT INTO public.system_settings (key, value, description)
VALUES
  ('EXPIRY_WARNING_DAYS', '30', '近效期提醒天数'),
  ('LOW_STOCK_THRESHOLD', '10', '库存不足提醒阈值'),
  ('SCANNER_TIMEOUT', '30000', '扫码超时时间（毫秒）'),
  ('SCANNER_RETRY_COUNT', '3', '扫码重试次数'),
  ('SESSION_TIMEOUT', '3600', '用户会话超时时间（秒）'),
  ('BACKUP_FREQUENCY', '24', '数据备份频率（小时）'),
  ('MAX_UPLOAD_SIZE', '10485760', '最大上传文件大小（字节）'),
  ('ENABLE_SOUND_NOTIFICATION', 'true', '启用声音通知'),
  ('DEFAULT_SHELF_LOCATION', 'A-01-1', '默认货架位置'),
  ('FIFO_ENABLED', 'true', '启用先进先出原则')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 插入初始管理员用户
-- 使用实际的 UUID，这些用户已在 Supabase Auth 中创建
INSERT INTO public.users (id, email, name, role)
VALUES
  ('507c4d04-ca3b-422a-a0af-e0e0194eba5f', 'admin@pharmacy.com', '系统管理员', 'admin'),
  ('a20b17a3-7f4f-4e5c-9219-0394b5ed1c32', 'manager@pharmacy.com', '药房经理', 'manager'),
  ('75fba74b-a048-4d7c-854e-cca53d206d45', 'operator@pharmacy.com', '操作员', 'operator'),
  ('328eb867-7edf-4348-8cb1-594690a1ecf6', 'operator2@pharmacy.com', '操作员2', 'operator'),
  ('4bd14e28-ebe5-4d63-be73-0e86400c8302', 'admin@example.com', '系统管理员', 'admin')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- 插入示例药品数据
INSERT INTO public.medicines (barcode, name, specification, manufacturer, shelf_location, safety_stock)
VALUES
  -- 常用药品
  ('6901234567890', '阿莫西林胶囊', '0.25g*24粒', '华北制药股份有限公司', 'A-01-1', 50),
  ('6901234567891', '头孢克肟胶囊', '0.1g*12粒', '石药集团中诺药业有限公司', 'A-01-2', 30),
  ('6901234567892', '布洛芬缓释胶囊', '0.3g*20粒', '中美天津史克制药有限公司', 'A-02-1', 40),
  ('6901234567893', '对乙酰氨基酚片', '0.5g*12片', '华润双鹤药业股份有限公司', 'A-02-2', 60),
  ('6901234567894', '氨溴索口服溶液', '15mg/5ml*100ml', '上海勃林格殷格翰药业有限公司', 'A-03-1', 25),
  
  -- 慢性病用药
  ('6901234567895', '硝苯地平缓释片', '20mg*30片', '拜耳医药保健有限公司', 'B-01-1', 35),
  ('6901234567896', '二甲双胍片', '0.5g*30片', '中美上海施贵宝制药有限公司', 'B-01-2', 45),
  ('6901234567897', '阿托伐他汀钙片', '20mg*7片', '辉瑞制药有限公司', 'B-02-1', 20),
  ('6901234567898', '厄贝沙坦片', '150mg*14片', '赛诺菲（杭州）制药有限公司', 'B-02-2', 30),
  ('6901234567899', '格列齐特缓释片', '30mg*30片', '施维雅（天津）制药有限公司', 'B-03-1', 25),
  
  -- 中成药
  ('6901234567900', '感冒清热颗粒', '12g*10袋', '北京同仁堂股份有限公司', 'C-01-1', 40),
  ('6901234567901', '板蓝根颗粒', '10g*20袋', '广州白云山和记黄埔中药有限公司', 'C-01-2', 50),
  ('6901234567902', '藿香正气水', '10ml*10支', '太极集团重庆桐君阁药厂有限公司', 'C-02-1', 35),
  ('6901234567903', '六味地黄丸', '9g*10丸', '北京同仁堂股份有限公司', 'C-02-2', 20),
  ('6901234567904', '金银花颗粒', '5g*20袋', '康美药业股份有限公司', 'C-03-1', 30),
  
  -- 外用药品
  ('6901234567905', '红霉素软膏', '10g', '上海新亚药业有限公司', 'D-01-1', 25),
  ('6901234567906', '复方醋酸地塞米松乳膏', '20g', '天津金耀药业有限公司', 'D-01-2', 20),
  ('6901234567907', '碘伏消毒液', '500ml', '山东威高药业股份有限公司', 'D-02-1', 15),
  ('6901234567908', '创可贴', '100片/盒', '强生（中国）医疗器材有限公司', 'D-02-2', 50),
  ('6901234567909', '云南白药气雾剂', '60g', '云南白药集团股份有限公司', 'D-03-1', 10)
ON CONFLICT (barcode) DO UPDATE SET
  name = EXCLUDED.name,
  specification = EXCLUDED.specification,
  manufacturer = EXCLUDED.manufacturer,
  shelf_location = EXCLUDED.shelf_location,
  safety_stock = EXCLUDED.safety_stock,
  updated_at = NOW();