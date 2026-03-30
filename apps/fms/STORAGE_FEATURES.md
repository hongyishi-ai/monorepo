# FMS系统 - 本地存储与PWA功能

## 📦 本地数据存储系统

### 功能概述
FMS系统现已支持完整的本地数据存储功能，确保用户的评估记录能够持久保存，即使关闭浏览器或断网也不会丢失数据。

### 核心特性

#### 1. 自动数据保存
- **评估完成自动保存**：当用户完成FMS评估后，系统会自动将结果保存到本地数据库
- **双重存储机制**：
  - 主要存储：IndexedDB（支持复杂查询和大容量存储）
  - 备用存储：localStorage（当IndexedDB不可用时的降级方案）
- **数据完整性**：保存完整的评估数据，包括：
  - 基础测试分数
  - 双侧评估结果
  - 不对称性分析
  - 疼痛测试记录
  - 排除测试结果

#### 2. 历史记录管理
- **智能分类展示**：按时间倒序展示所有评估记录
- **收藏系统**：可将重要评估记录标记为收藏
- **标签管理**：支持为评估记录添加自定义标签
- **快速搜索**：可按标签、收藏状态等条件筛选记录
- **状态指示**：直观显示评估状态（功能良好/建议改善/需要关注）

#### 3. 数据导入导出
- **完整备份**：支持导出所有评估记录为JSON格式
- **选择性导出**：可选择特定记录进行导出
- **数据恢复**：支持从备份文件恢复数据
- **跨设备同步**：通过导出/导入实现多设备间数据同步

### 技术实现

#### 存储架构
```typescript
// 使用Dexie.js操作IndexedDB
class FMSDatabase extends Dexie {
  assessments!: Table<AssessmentRecord>;
  settings!: Table<UserSettings>;
}

// 评估记录数据结构
interface AssessmentRecord {
  id?: number;
  sessionId: string;
  createdAt: Date;
  title: string;
  assessmentData: FMSAssessmentData;
  trainingPlan?: TrainingPlanData;
  isStarred: boolean;
  tags: string[];
}
```

#### 数据保护
- **自动清理**：默认保留最近100条记录，自动清理旧数据
- **收藏保护**：收藏的记录不会被自动清理
- **错误恢复**：存储失败时的优雅降级处理

## 🚀 PWA (渐进式Web应用) 功能

### 应用特性

#### 1. 离线访问支持
- **Service Worker**：自动缓存应用资源
- **智能缓存策略**：
  - 核心应用文件：预缓存策略
  - 用户数据：运行时缓存
  - 静态资源：长期缓存
- **离线提示**：网络状态变化时的友好提示

#### 2. 应用安装
- **添加到主屏幕**：支持在移动设备和桌面上安装应用
- **原生体验**：
  - 独立窗口运行
  - 隐藏浏览器地址栏
  - 快速启动
  - 应用图标和名称

#### 3. 自动更新
- **热更新**：应用更新时自动下载新版本
- **版本管理**：智能的缓存版本控制
- **更新提示**：新版本可用时的用户提示

### PWA配置

#### Manifest配置
```json
{
  "name": "FMS Assessment System",
  "short_name": "FMS",
  "display": "standalone",
  "start_url": "/",
  "theme_color": "#2563eb",
  "background_color": "#ffffff"
}
```

#### Service Worker特性
- **缓存策略**：CacheFirst用于静态资源，NetworkFirst用于动态内容
- **资源缓存**：自动缓存所有必要的应用资源
- **离线回退**：网络不可用时显示缓存内容

## 📱 用户界面更新

### 新增页面

#### 历史记录页面 (`/history`)
- **统计概览**：总记录数、收藏数、平均得分等
- **记录列表**：时间线式展示所有评估记录
- **操作按钮**：查看详情、收藏/取消收藏、删除记录
- **数据管理**：导入导出功能的用户界面

### 导航更新
- **主导航栏**：添加"历史记录"入口
- **首页集成**：展示最新评估记录和历史统计
- **快速访问**：三列布局展示历史记录、训练方案、查看报告

### 用户体验优化
- **自动跳转**：评估完成后自动跳转到报告页面
- **数据持久化**：无需手动保存，系统自动处理
- **状态反馈**：清晰的保存状态和错误提示

## 🛠️ 开发者指南

### 使用存储API

#### 保存评估数据
```typescript
import { useStorage } from '@/hooks/use-storage';

const { saveAssessment } = useStorage();

await saveAssessment(assessmentData, trainingPlan, {
  title: '自定义标题',
  description: '评估说明',
  tags: ['重要', '复查'],
  isStarred: true
});
```

#### 查询历史记录
```typescript
const { getAllAssessments, getLatestAssessment } = useStorage();

// 获取所有记录
const assessments = await getAllAssessments();

// 获取最新记录
const latest = await getLatestAssessment();
```

#### 数据导入导出
```typescript
const { exportData, importData } = useStorage();

// 导出数据
const jsonData = await exportData();

// 导入数据
const result = await importData(jsonData);
console.log(`导入了 ${result.imported} 条记录`);
```

### Hook使用指南

#### 存储Hook
- `useStorage()`: 主要的数据存储操作Hook
- `useSettings()`: 用户设置管理Hook

#### 错误处理
```typescript
const { isLoading, error, saveAssessment } = useStorage();

if (error) {
  console.error('存储错误:', error);
}
```

## 🔒 隐私与安全

### 数据安全
- **本地存储**：所有数据存储在用户设备本地，不上传到服务器
- **隐私保护**：无需账号注册，数据完全属于用户
- **加密传输**：应用通过HTTPS提供服务

### 数据控制
- **完全控制**：用户可随时删除、导出或清空所有数据
- **透明度**：清晰说明数据的存储位置和使用方式
- **可移植性**：支持数据导出，用户可自由迁移数据

## 📈 性能优化

### 存储性能
- **懒加载**：按需加载历史记录
- **分页查询**：大量数据时的分页处理
- **索引优化**：IndexedDB查询性能优化

### 应用性能
- **代码分割**：按路由分割代码，减少初始加载时间
- **资源压缩**：自动压缩和优化资源文件
- **缓存策略**：智能的缓存策略提升访问速度

## 🔮 未来规划

### 即将推出
- **数据同步**：云端备份和多设备同步
- **推送通知**：重要提醒和更新通知
- **高级筛选**：更多筛选和排序选项
- **数据分析**：长期趋势分析和图表

### 技术改进
- **性能优化**：进一步优化存储和查询性能
- **容量管理**：更智能的存储空间管理
- **备份策略**：自动备份到本地文件系统

---

通过这些功能，FMS系统现在提供了完整的本地数据管理能力，让用户能够安全、便捷地管理自己的评估历史，同时享受现代PWA应用的优秀体验。 