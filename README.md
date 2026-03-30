# 红医师 monorepo

整合红医师旗下多个医疗相关平台的统一代码仓库。

## 项目结构

```
hongyishi-monorepo/
├── apps/
│   ├── portal/        # 红医师门户主站
│   ├── pharmacy/      # 移动药房系统
│   ├── clinic/         # 门诊辅助诊断
│   ├── fms/            # 训练伤防治平台
│   └── heat-stroke/   # 热射病防治平台
├── packages/
│   ├── ui/             # 共享 UI 组件库
│   ├── utils/          # 共享工具库
│   └── config/         # 统一配置文件
└── openspec/          # OpenSpec 变更管理
```

## 技术栈

- **包管理**: PNPM
- **构建协调**: Turborepo
- **语言**: TypeScript（严格模式）
- **框架**: React + Next.js

## 开始开发

```bash
# 安装依赖
pnpm install

# 开发所有项目
pnpm dev

# 构建所有项目
pnpm build

# 运行测试
pnpm test
```
