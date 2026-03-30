/* eslint-env node */
/* global process */
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * Playwright 配置文件
 * 用于药房库存管理系统的端到端测试
 */
export default defineConfig({
  // 测试目录
  testDir: './tests/e2e',

  // 全局设置
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // 报告器配置
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-report' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
    ['junit', { outputFile: 'test-results/playwright-junit.xml' }],
    ['line'],
  ],

  // 全局测试配置
  use: {
    // 基础URL
    baseURL: process.env.VITE_APP_URL || 'http://localhost:5173',

    // 浏览器设置
    headless: process.env.CI ? true : false,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    // 截图和视频
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    // 超时设置
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // 项目配置 - 不同浏览器和设备
  projects: [
    // 设置认证状态
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      teardown: 'cleanup',
    },

    // 清理
    {
      name: 'cleanup',
      testMatch: /.*\.teardown\.ts/,
    },

    // Chrome 桌面
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Firefox 桌面
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // Safari 桌面
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // 开发服务器配置
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // 输出目录
  outputDir: 'test-results/playwright-artifacts',

  // 全局超时
  globalTimeout: 60 * 60 * 1000, // 1小时
  timeout: 30 * 1000, // 30秒

  // 期望超时
  expect: {
    timeout: 5000,
  },
});
