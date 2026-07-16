# TCCC 中文交互学习流程

TCCC 学习页由 Portal Next 统一接管，使用共享 `ProjectChrome`、`TcccDecisionFlow`、主题、移动导航和内容治理组件。

## 内容状态

- 正文依据：JTS / CoTCCC《TCCC Guidelines》，2026-05-01。
- 页面语言：全中文；保留 TCCC、TFC、TACEVAC、SpO₂、EtCO₂、IV、IO、TXA 等标准缩写。
- 审核状态：已对照原文，待医学专家终审。
- TACEVAC 边界：2026 TCCC 指南明确完整 TACEVAC 指南由 CoERCCC 单独管理；本项目相关页面用于过渡、持续复评和既有训练主题维护。

## 技术边界

- 所有临床学习页位于 `/tccc/pages/<slug>`，由 Next 静态导出。
- 每页一次只显示当前决策节点，包含返回、重置、复评和未控制回路。
- 流程状态不持久化，刷新后从头开始。
- 旧版深层 HTML 与页面内样式已删除；`apps/tccc` 只保留兼容性静态资源。

## 免责声明

仅供教育训练和流程学习，不能替代现行作战医疗规范、医疗指挥链、人员授权或正式认证课程。
