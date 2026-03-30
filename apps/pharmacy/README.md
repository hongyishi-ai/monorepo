# 药品出入库管理系统

一个专为药房、医院药库或药品仓储机构设计的现代化库存管理系统。

## 功能特性

- 🔍 **扫码入库/出库** - 通过条码扫描快速完成药品入库和出库操作
- 📦 **批次管理** - 完整的药品批次信息管理和先进先出控制
- 📊 **库存统计** - 实时库存监控和消耗趋势分析
- ⚠️ **智能提醒** - 近效期和库存不足自动提醒
- 👥 **用户权限** - 多角色用户管理和权限控制
- 📈 **数据报表** - 详细的出入库报表和数据导出
- 🏥 **货架管理** - 药品货架位置管理和快速定位

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **状态管理**: Zustand
- **UI框架**: Tailwind CSS + Shadcn/ui
- **数据请求**: React Query (TanStack Query)
- **表单处理**: React Hook Form + Zod
- **路由**: React Router v7
- **后端**: Supabase (PostgreSQL + 认证 + 实时订阅)
- **部署**: Vercel

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 8

### 安装依赖

```bash
npm install
```

### 环境配置（简化）

项目使用分类管理的环境配置文件：

- `.env.example` - 环境变量模板和文档
- `.env`/`.env.local` - 本地开发环境（不提交到版本控制）

复制环境变量模板：

```bash
cp .env.example .env
# 如根目录不存在 `.env.example`，可使用备用模板：
# cp docs/examples/env.example .env
```

配置必需的环境变量：

```env
# Supabase 配置 (必需)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 应用基本配置 (必需)
VITE_APP_NAME=药品出入库管理系统
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development
```

#### 验证配置

本项目在启动时会对关键环境变量进行严格校验（见 `src/lib/env.ts`）。如果缺少必要变量（如 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`、`VITE_APP_ENV`），应用会直接报错并中止启动，以避免产生不确定行为。请先按下方文档正确配置再启动。

详细的环境配置指南请参考：

- `docs/ENVIRONMENT.md` — 环境变量与配置说明
- `docs/SUPABASE_SETUP.md` — Supabase 项目与密钥获取指南

### 启动开发服务器

```bash
npm run dev
```

### 构建版本

```bash
npm run build    # 默认构建
npm run preview  # 本地预览构建产物
npm run clean    # 清理构建目录
```

## 项目结构

```
src/
├── components/          # React 组件
│   ├── ui/             # 基础 UI 组件 (Shadcn/ui)
│   ├── layout/         # 布局组件
│   ├── scanner/        # 扫码相关组件
│   ├── inventory/      # 库存管理组件
│   ├── reports/        # 报表组件
│   └── auth/           # 认证组件
├── pages/              # 页面组件
├── hooks/              # 自定义 React Hooks
├── stores/             # Zustand 状态管理
├── services/           # API 服务层
├── types/              # TypeScript 类型定义
└── utils/              # 工具函数
```

## UI 组件库

### Shadcn/ui 组件

项目使用 Shadcn/ui 作为主要的 UI 组件库，提供了完整的组件系统：

#### 基础组件

- **Button**: 按钮组件，支持多种变体和尺寸
- **Input**: 输入框组件
- **Textarea**: 多行文本输入组件
- **Label**: 标签组件
- **Badge**: 徽章组件
- **Avatar**: 头像组件
- **Skeleton**: 骨架屏组件

#### 表单组件

- **Checkbox**: 复选框组件
- **RadioGroup**: 单选按钮组组件
- **Switch**: 开关组件
- **Select**: 下拉选择组件

#### 布局组件

- **Card**: 卡片组件
- **Separator**: 分隔线组件
- **ScrollArea**: 滚动区域组件
- **Accordion**: 手风琴组件
- **Collapsible**: 可折叠组件

#### 导航组件

- **NavigationMenu**: 导航菜单组件
- **Menubar**: 菜单栏组件
- **DropdownMenu**: 下拉菜单组件
- **ContextMenu**: 右键菜单组件

#### 反馈组件

- **Alert**: 警告提示组件
- **AlertDialog**: 警告对话框组件
- **Dialog**: 对话框组件
- **Toast**: 消息提示组件
- **Tooltip**: 工具提示组件
- **Popover**: 弹出框组件
- **HoverCard**: 悬停卡片组件

#### 交互组件

- **Toggle**: 切换按钮组件
- **ToggleGroup**: 切换按钮组组件
- **Progress**: 进度条组件
- **Tabs**: 标签页组件

#### 组件测试

目前仓库未提供内置的 UI 演示路由。请直接在业务页面或 Story/测试用例中引入 `@/components/ui/*` 组件进行演示或测试。

#### 使用示例

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ExampleForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>示例表单</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='name'>姓名</Label>
          <Input id='name' placeholder='请输入姓名' />
        </div>
        <Button type='submit'>提交</Button>
      </CardContent>
    </Card>
  );
}
```

## 开发指南

### 代码规范

项目使用 ESLint 和 Prettier 进行代码规范检查：

```bash
npm run lint        # 检查代码规范
npm run lint:fix    # 自动修复代码规范问题
```

### 提交规范

使用 Conventional Commits 规范：

- `feat:` 新功能
- `fix:` 修复问题
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建或辅助工具变动

### 测试

```bash
npm run test   # 运行单元测试
```

## 部署

推荐采用“本地构建 + Vercel”方式部署，默认以手动流程为主：

1. 本地构建并预览
   - `npm run build`
   - `npm run preview`
2. 推送到 GitHub 仓库（手动提交流程）
3. 在 Vercel 连接该仓库或手动上传构建产物（可选）

说明：仓库包含一个可选的 GitHub Actions 工作流（`.github/workflows/ci.yml`），用于 Lint/Type Check/构建与 PR 预览部署。如需启用 CI，请在仓库设置中开启 Actions 并配置所需的 Secrets；若按默认手动流程使用，则无需启用该工作流。

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

如有问题或建议，请创建 Issue 或联系项目维护者。

---

## 故障排除

### 常见问题

#### 1. 应用无法启动 / 白屏

**可能原因**:

- 环境变量未配置
- Supabase连接失败

**解决方案**:

```bash
# 检查环境变量
cat .env

# 确保必需的变量存在
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_APP_ENV=development
```

#### 2. 登录失败

**可能原因**:

- Supabase认证配置错误
- 数据库用户表未正确设置

**解决方案**:

1. 检查Supabase Dashboard中的Authentication设置
2. 确认数据库迁移已执行
3. 查看浏览器控制台错误信息

#### 3. 构建失败

**可能原因**:

- 依赖版本冲突
- TypeScript类型错误

**解决方案**:

```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 检查TypeScript错误
npm run type-check
```

#### 4. 性能问题

**检查项**:

- 查看浏览器Network面板，检查请求数量和大小
- 使用React DevTools Profiler分析组件渲染
- 检查是否启用了生产模式构建

### 技术债务

项目当前的技术债务和改进计划，请参考 [TECHNICAL_DEBT.md](docs/TECHNICAL_DEBT.md)

---

_最后更新: 2024年10月9日_

### 重要变更记录（库存并发与撤回修复）

- 新增迁移 `supabase/migrations/2025-08-12_atomic_inventory_update.sql`：
  - 移除会导致“二次更新库存”的 BEFORE 触发器（若存在）。
  - 将 `process_inventory_transaction` 改为“原子条件更新”，消除并发扣减风险。
- 统一约定：库存数量仅由数据库过程函数更新，触发器仅负责审计与撤回登记。
- 修复撤回参数：`UndoTransactionService` 先查 `undoable_transactions.transaction_id` 再调用 `undo_outbound_transaction`。
- 修复撤回空值错误：将 `undo_outbound_transaction` 改为内部调用 `process_inventory_transaction` 执行入库，
  由过程统一写入 `remaining_quantity` 并原子更新 `batches.quantity`，解决 `remaining_quantity NOT NULL` 报错。

### 表单口径与页面对齐（入库/药品/批次）

- 入库页新药创建参数对齐：
  - 现在在统一出/入库页新建药品时，前端会显式传递 `unit`、`category` 和 `safety_stock`，不再依赖数据库默认值。
  - 默认取值：`unit='盒'`、`category='internal'`、`safety_stock=1`（避免低库存统计失真）。
- 批次重复处理一致化：
  - 统一出/入库页在检测到相同批次号时，弹出“合并库存”确认对话（调用 `add_batch_quantity`）。
  - 老的入库页（扫码）入口已弃用，所有导航统一到 `出/入库操作` 页面，以确保体验一致。
- 路由与预加载调整：
  - `/inbound`、`/outbound` 均重定向到 `/inventory-operation`（旧页已移除，保持兼容重定向）。
  - 预加载策略改为优先预加载 `InventoryOperationPage`，不再预加载旧入/出库独立页面。

后续改进（中优先）：将“首次入库（建批次+入库）”收敛为单个 RPC，以进一步降低中间态风险。

### 首次入库单 RPC（已落地）

- 新增数据库函数 `create_batch_and_inbound`：当批次不存在时，原子化“创建批次 + 入库”；若批次已存在，返回 `batch_exists=true` 和 `batch_id`，前端转入“合并库存”流程。
- 前端对接：
  - `useCreateBatchAndInbound`（`src/hooks/use-batches.ts`）
  - 统一页 `InventoryOperationPage` 与旧页 `InboundScanPage` 已改为优先调用该单 RPC
  - 若检测到竞态导致批次已被创建，统一页会弹出“批次合并”对话框，调用 `add_batch_quantity`

### 安全与口径统一（2025-08-13）

- 核心 RPC 改为使用 `auth.uid()` 获取真实用户，防止前端伪造 `p_user_id`。
- 保留原参数签名（包含 `p_user_id`），但在函数内部忽略该参数，确保非破坏性兼容。
- 统一返回结构新增稳定错误码 `code`（如 `OK`、`UNAUTHENTICATED`、`FORBIDDEN`、`BATCH_EXISTS`、`INSUFFICIENT_STOCK` 等）。
- 涉及文件：
  - `supabase/migrations/2025-08-13_security_and_unify.sql`
  - 影响函数：`process_inventory_transaction`、`create_batch_and_inbound`、`add_batch_quantity`、`health_check`

执行指引（数据库对齐）：

- 方式一（推荐）：在 Supabase Dashboard → SQL Editor 中打开并执行上述迁移文件的全部内容。
- 方式二（CLI）：
  - 登录并关联项目后执行：
    ```bash
    supabase db execute --file supabase/migrations/2025-08-13_security_and_unify.sql
    ```
- 验证：
  - SQL: `select public.health_check();` 应返回 `{ ok: true, now: ... }`
  - 前端：确保已登录状态下进行出/入库操作，交易记录的 `user_id` 应为当前登录用户。
