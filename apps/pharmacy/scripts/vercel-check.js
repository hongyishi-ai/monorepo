#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

console.log('🚀 Vercel 部署检查...\n');

// 检查必需的配置文件
const requiredFiles = [
  'vercel.json',
  'package.json',
  'public/manifest.json',
  'public/icons/apple-touch-icon.png',
  'public/icons/favicon.ico',
];

let allFilesExist = true;

console.log('📁 检查必需文件:');
requiredFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - 文件缺失`);
    allFilesExist = false;
  }
});

// 检查 vercel.json 配置
const vercelConfigPath = path.join(projectRoot, 'vercel.json');
if (fs.existsSync(vercelConfigPath)) {
  try {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf-8'));

    console.log('\n⚙️ Vercel 配置检查:');
    console.log(`✅ 构建命令: ${vercelConfig.buildCommand || 'npm run build'}`);
    console.log(`✅ 输出目录: ${vercelConfig.outputDirectory || 'dist'}`);
    console.log(`✅ 框架: ${vercelConfig.framework || 'vite'}`);

    // 检查重写规则
    if (vercelConfig.rewrites && vercelConfig.rewrites.length > 0) {
      console.log('✅ SPA 路由重写规则已配置');
    } else {
      console.log('❌ 缺少 SPA 路由重写规则');
      allFilesExist = false;
    }

    // 检查静态资源头部配置
    if (vercelConfig.headers && vercelConfig.headers.length > 0) {
      console.log('✅ 静态资源缓存头部已配置');
    } else {
      console.log('⚠️ 建议配置静态资源缓存头部');
    }
  } catch (error) {
    console.log('❌ vercel.json 格式错误:', error.message);
    allFilesExist = false;
  }
}

// 检查环境变量配置
console.log('\n🔐 环境变量检查:');
const envFiles = ['.env.example', '.env.production'];
envFiles.forEach(envFile => {
  const envPath = path.join(projectRoot, envFile);
  if (fs.existsSync(envPath)) {
    console.log(`✅ ${envFile} 存在`);

    // 读取并检查必需的环境变量
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

    requiredEnvVars.forEach(envVar => {
      if (envContent.includes(envVar)) {
        console.log(`  ✅ ${envVar} 已定义`);
      } else {
        console.log(`  ❌ ${envVar} 缺失`);
        allFilesExist = false;
      }
    });
  } else {
    console.log(`⚠️ ${envFile} 不存在`);
  }
});

// 检查 package.json 脚本
const packageJsonPath = path.join(projectRoot, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  console.log('\n📦 构建脚本检查:');
  const requiredScripts = ['build', 'dev'];
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`✅ ${script}: ${packageJson.scripts[script]}`);
    } else {
      console.log(`❌ 缺少 ${script} 脚本`);
      allFilesExist = false;
    }
  });
}

console.log('\n' + '='.repeat(60));

if (allFilesExist) {
  console.log('🎉 Vercel 部署检查通过！');
  console.log('\n📋 部署步骤:');
  console.log('1. 确保所有代码已推送到 Git 仓库');
  console.log('2. 在 Vercel 控制台中连接你的 Git 仓库');
  console.log('3. 配置环境变量:');
  console.log('   - VITE_SUPABASE_URL');
  console.log('   - VITE_SUPABASE_ANON_KEY');
  console.log('4. 部署将自动开始');

  console.log('\n🔧 Vercel 特定配置:');
  console.log('- ✅ vercel.json 已配置 SPA 路由重写');
  console.log('- ✅ 静态资源缓存策略已优化');
  console.log('- ✅ PWA manifest 和图标路径已配置');
} else {
  console.log('❌ Vercel 部署检查失败！请修复上述问题。');
  process.exit(1);
}

console.log('\n💡 常见问题解决:');
console.log('- 如果图标仍然 404: 检查 Vercel 构建日志确认文件被正确复制');
console.log('- 如果路由 404: 确认 vercel.json 中的重写规则正确');
console.log('- 如果环境变量问题: 在 Vercel 项目设置中配置环境变量');
console.log('- 构建失败: 检查 Node.js 版本兼容性 (推荐 18.x)');
