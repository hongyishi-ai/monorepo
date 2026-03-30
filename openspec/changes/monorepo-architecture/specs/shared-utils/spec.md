# Shared Utilities

本规范定义了红医师共享工具函数库 `@hongyishi/utils` 的模块划分、API 设计以及各 app 现有 utils 的整合策略。

## ADDED Requirements

### Requirement: Shared Utilities Library Scope

`@hongyishi/utils` (`packages/utils`) SHALL 提供跨应用共享的工具函数，以 TypeScript 实现，版本 `0.1.0`，当前为占位实现。必须与统一后的 React 版本（React 19 stable）兼容（参见 architecture-decisions/spec.md）。

导出结构：
- `.` → `./src/index.ts`
- `./format/*` → `./src/format/*`
- `./validation/*` → `./src/validation/*`
- `./api/*` → `./src/api/*`

#### Scenario: Importing from Root Export

- GIVEN 开发者需要在 fms 中使用工具函数
- WHEN 写入 `import { formatDate, validatePhone } from '@hongyishi/utils'`
- THEN TypeScript 正确解析到 `packages/utils/src/index.ts`
- AND 所有已导出工具函数类型安全

#### Scenario: Importing from Subpath Export

- GIVEN pharmacy 需要在 API 层使用请求封装
- WHEN 写入 `import { createApiClient } from '@hongyishi/utils/api'`
- THEN 打包工具通过 `exports` field 正确映射到 `src/api/`
- AND 不需要相对路径 `../../packages/utils/src/api`

---

### Requirement: Format Utilities

`packages/utils/src/format/` SHALL 提供日期、数字、文件大小等格式化函数。

#### Scenario: Date Formatting in Clinic

- GIVEN clinic 应用需要展示患者就诊日期
- WHEN 调用 `formatDate(new Date('2026-03-30'), 'YYYY-MM-DD')`
- THEN 返回 `'2026-03-30'` 格式字符串
- AND 不需要每个 app 独立实现 date-fns 或 dayjs 封装

#### Scenario: Number Formatting Across Apps

- GIVEN fms 需要展示训练评分（0-100 分制）
- WHEN 调用 `formatNumber(85.5, 'zh-CN')`
- THEN 返回 `'85.50'` 或本地化格式
- AND pharmacy 的药品数量、portal 的访问统计均可复用同一函数

#### Scenario: File Size Formatting

- GIVEN heat-stroke 需要展示上传的训练视频大小
- WHEN 调用 `formatFileSize(1048576)`（1MB in bytes）
- THEN 返回 `'1.00 MB'`
- AND 各 app 不需要独立处理字节到人类可读单位的转换

---

### Requirement: Validation Utilities

`packages/utils/src/validation/` SHALL 提供中国场景下的常用表单验证函数。

#### Scenario: Phone Number Validation

- GIVEN pharmacy 的注册表单需要验证手机号
- WHEN 调用 `validatePhone('13800138000')`
- THEN 返回 `true`
- AND `validatePhone('12345')` 返回 `false`
- AND 中国大陆 11 位手机号格式（含 +86 前缀）均被正确处理

#### Scenario: Email Validation

- GIVEN portal 的用户注册需要邮箱验证
- WHEN 调用 `validateEmail('user@example.com')`
- THEN 返回 `true`
- AND 格式错误邮箱返回 `false`

#### Scenario: Chinese ID Card Validation

- GIVEN clinic 需要核验患者身份证号
- WHEN 调用 `validateIdCard('110101199003074471')`
- THEN 校验中国公民 18 位身份证号格式（含校验位）
- AND 错误格式返回 `false`

---

### Requirement: API Utilities

`packages/utils/src/api/` SHALL 提供统一的 API 客户端封装。

#### Scenario: Creating API Client for heat-stroke

- GIVEN heat-stroke 需要调用后端热射病数据接口
- WHEN 调用 `createApiClient('https://api.hongyishi.cn/heat-stroke')`
- THEN 返回的客户端实例自动处理 JSON 序列化、错误捕获、请求拦截
- AND 所有 apps 共享同一套请求封装逻辑，行为一致

#### Scenario: Request Retry Logic

- GIVEN fms 在网络不稳定环境下调用 API
- WHEN 调用 `retryRequest(() => fetchData(), 3)`
- THEN 请求失败时自动重试最多 3 次
- AND 指数退避策略避免雪崩效应

---

### Requirement: Per-App Existing Utils Integration

各 app 目前在 `src/utils/` 目录中有个自的工具函数，SHALL follow a migration path。

#### Scenario: Migrating App Utils to Shared Package

- GIVEN clinic 的 `utils/format.ts` 中有 `formatDate` 实现
- WHEN 该函数逻辑被提取并添加到 `packages/utils/src/format/`
- THEN clinic 中的调用改为 `import { formatDate } from '@hongyishi/utils'`
- AND 源文件 `apps/clinic/src/utils/format.ts` 可以删除或保留仅供 app-specific 用途

#### Scenario: App-Specific Utils Remain Local

- GIVEN fms 的 `utils/fms-calculations.ts` 包含 FMS 专项评分算法
- WHEN 该算法不具有跨应用复用价值
- THEN 该文件保留在 `apps/fms/src/utils/` 中，不强制迁移
- AND 只有真正通用的工具才迁移到 `@hongyishi/utils`
