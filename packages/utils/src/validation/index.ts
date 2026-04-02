// 手机号验证（中国大陆）
export function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

// 邮箱验证
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 身份证号验证（中国大陆）
export function validateIdCard(idCard: string): boolean {
  if (!/^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(idCard)) {
    return false;
  }
  // 校验码验证
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard[i]) * weights[i];
  }
  const remainder = sum % 11;
  return checkCodes[remainder].toUpperCase() === idCard[17].toUpperCase();
}

// URL 验证
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// 金额验证（最多两位小数）
export function validateMoney(amount: number | string): boolean {
  const str = typeof amount === 'number' ? String(amount) : amount;
  return /^-?\d+(\.\d{1,2})?$/.test(str) && parseFloat(str) >= 0;
}
