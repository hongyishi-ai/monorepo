# 密码安全设置指南

本文档说明如何为药房库存管理系统启用和配置密码安全功能。

## 概述

系统实现了多层密码安全保护：

1. **Supabase 内置密码保护**：防止使用已泄露的密码
2. **前端密码强度验证**：实时检查密码复杂度
3. **可配置的密码策略**：管理员可自定义密码要求
4. **HaveIBeenPwned 集成**：检查密码是否在数据泄露中出现

## 1. 启用 Supabase 密码保护

### 步骤 1：登录 Supabase Dashboard

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目：`pharmacy-inventory-system`

### 步骤 2：配置认证设置

1. 在左侧导航栏中，点击 **Authentication**
2. 点击 **Settings** 标签
3. 找到 **Password Strength** 部分

### 步骤 3：启用密码保护功能

在 Password Strength 设置中，启用以下选项：

- ✅ **Enable password strength validation**
- ✅ **Prevent use of compromised passwords** (HaveIBeenPwned)
- ✅ **Minimum password length**: 设置为 12 或更高
- ✅ **Require uppercase letters**
- ✅ **Require lowercase letters**
- ✅ **Require numbers**
- ✅ **Require symbols**

### 步骤 4：保存设置

点击 **Save** 按钮保存配置。

## 2. 前端密码验证功能

系统已集成以下前端密码验证功能：

### 密码强度指示器

- 实时显示密码强度（弱/一般/良好/强）
- 可视化进度条显示
- 详细的改进建议

### 密码要求检查

- ✅ 最小长度验证
- ✅ 字符类型要求
- ✅ 常见模式检测
- ✅ 泄露密码检查

### 使用方式

```tsx
import { PasswordInputWithStrength } from '@/components/ui/password-strength-indicator';

function MyForm() {
  const [password, setPassword] = useState('');
  const [validation, setValidation] = useState(null);

  return (
    <PasswordInputWithStrength
      value={password}
      onChange={setPassword}
      onValidationChange={setValidation}
      showRequirements={true}
    />
  );
}
```

## 3. 密码策略管理

### 管理员配置

管理员可以通过系统设置页面配置密码策略：

1. 登录系统（需要管理员权限）
2. 导航到 **系统设置** > **密码安全策略**
3. 配置以下选项：
   - 最小密码长度
   - 字符要求（大写、小写、数字、特殊字符）
   - 是否启用泄露密码检查

### 系统设置键值

密码策略存储在 `system_settings` 表中：

| 设置键                       | 描述         | 默认值 |
| ---------------------------- | ------------ | ------ |
| `PASSWORD_MIN_LENGTH`        | 密码最小长度 | `12`   |
| `PASSWORD_REQUIRE_UPPERCASE` | 要求大写字母 | `true` |
| `PASSWORD_REQUIRE_LOWERCASE` | 要求小写字母 | `true` |
| `PASSWORD_REQUIRE_NUMBERS`   | 要求数字     | `true` |
| `PASSWORD_REQUIRE_SYMBOLS`   | 要求特殊字符 | `true` |
| `PASSWORD_CHECK_LEAKED`      | 检查泄露密码 | `true` |

## 4. HaveIBeenPwned 集成

### 工作原理

系统使用 HaveIBeenPwned API 的 k-anonymity 模型：

1. 计算密码的 SHA-1 哈希值
2. 只发送哈希的前5位到 API
3. 在本地检查完整哈希是否在返回列表中
4. 保护用户隐私，不泄露实际密码

### 隐私保护

- ✅ 密码从不发送到外部服务
- ✅ 只发送哈希前缀（k-anonymity）
- ✅ 本地验证，保护用户隐私
- ✅ 网络错误时不阻止用户操作

## 5. 安全最佳实践

### 密码要求建议

- **最小长度**：12-16 字符
- **复杂度**：包含大小写字母、数字、特殊字符
- **避免**：常见密码、个人信息、重复字符
- **检查**：启用泄露密码检查

### 用户教育

向用户提供以下建议：

1. 使用密码管理器生成强密码
2. 不要重复使用密码
3. 定期更换密码
4. 启用双因素认证（如果可用）

### 系统管理

1. 定期审查密码策略
2. 监控密码强度合规性
3. 教育用户密码安全
4. 考虑实施密码过期策略

## 6. 故障排除

### 常见问题

**Q: 密码验证太慢**
A: 检查网络连接，HaveIBeenPwned API 可能响应较慢

**Q: 用户抱怨密码要求太严格**
A: 可以在系统设置中适当调整要求，但不建议降低安全标准

**Q: 密码验证失败但密码看起来很强**
A: 可能是密码在数据泄露中出现过，建议用户选择其他密码

### 调试信息

检查浏览器控制台的错误信息：

```javascript
// 手动测试密码验证
import { validatePassword } from '@/utils/password-validator';

const result = await validatePassword('your-test-password');
console.log(result);
```

## 7. 更新和维护

### 定期检查

- 每月检查 Supabase 认证设置
- 每季度审查密码策略有效性
- 年度安全审计

### 版本更新

当更新系统时，确保：

1. 密码验证逻辑保持最新
2. HaveIBeenPwned API 集成正常工作
3. 用户界面友好且易用

## 8. 合规性

### 数据保护

- 符合 GDPR 隐私要求
- 不存储明文密码
- 使用安全的哈希算法

### 行业标准

- 遵循 NIST 密码指南
- 符合 OWASP 安全建议
- 满足医疗行业安全要求

---

## 总结

通过实施这些密码安全措施，药房库存管理系统能够：

1. ✅ 防止用户使用已泄露的密码
2. ✅ 确保密码符合强度要求
3. ✅ 提供友好的用户体验
4. ✅ 保护用户隐私
5. ✅ 满足安全合规要求

如有问题，请参考故障排除部分或联系系统管理员。
