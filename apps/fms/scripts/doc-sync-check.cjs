#!/usr/bin/env node

/**
 * 文档同步检查脚本
 * 用于检查代码变更是否需要更新文档
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DocumentSyncChecker {
  constructor() {
    this.configPath = path.join(__dirname, '../DOC_SYNC_CONFIG.json');
    this.config = this.loadConfig();
    this.warnings = [];
    this.errors = [];
  }

  loadConfig() {
    try {
      const configContent = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(configContent).documentSyncConfig;
    } catch (error) {
      console.error('❌ 无法加载文档同步配置:', error.message);
      process.exit(1);
    }
  }

  async checkFileChanges() {
    console.log('🔍 检查文件变更...');
    
    try {
      // 获取git状态
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      const changedFiles = gitStatus.split('\n').filter(line => line.trim());
      
      if (changedFiles.length === 0) {
        console.log('✅ 没有文件变更');
        return;
      }

      console.log(`📝 发现 ${changedFiles.length} 个变更文件`);
      
      // 分析变更文件
      for (const fileLine of changedFiles) {
        const fileName = fileLine.substring(3).trim();
        this.analyzeFileChange(fileName);
      }

    } catch (error) {
      console.log('ℹ️  Git状态检查失败，可能不在Git仓库中');
    }
  }

  analyzeFileChange(fileName) {
    const watchedCategories = this.config.watchedFiles;
    
    for (const [category, config] of Object.entries(watchedCategories)) {
      for (const pattern of config.patterns) {
        if (this.matchesPattern(fileName, pattern)) {
          this.checkDocumentSync(category, fileName, config);
          break;
        }
      }
    }
  }

  matchesPattern(fileName, pattern) {
    // 简化的glob匹配
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\./g, '\\.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(fileName);
  }

  checkDocumentSync(category, fileName, config) {
    console.log(`🔎 检查 ${category} 类别文件: ${fileName}`);
    
    // 检查相关文档是否需要更新
    for (const docPath of config.triggers) {
      const fullDocPath = path.join(__dirname, '..', docPath);
      
      if (fs.existsSync(fullDocPath)) {
        const docStats = fs.statSync(fullDocPath);
        const fileStats = fs.statSync(path.join(__dirname, '..', fileName));
        
        if (fileStats.mtime > docStats.mtime) {
          this.warnings.push({
            type: 'outdated_document',
            message: `文档 ${docPath} 可能需要更新 (${category} 文件 ${fileName} 已变更)`,
            file: fileName,
            document: docPath,
            category: category
          });
        }
      } else {
        this.errors.push({
          type: 'missing_document',
          message: `缺少文档文件: ${docPath}`,
          document: docPath
        });
      }
    }
  }

  async checkFeatureSync() {
    console.log('🔍 检查功能状态同步...');
    
    // 检查是否有新功能文件但README未更新
    const libFiles = this.getFilesInDirectory('src/lib');
    const hooksFiles = this.getFilesInDirectory('src/hooks');
    const componentFiles = this.getFilesInDirectory('src/components');
    
    const allFeatureFiles = [...libFiles, ...hooksFiles, ...componentFiles];
    
    // 读取README文件
    const readmePath = path.join(__dirname, '../README.md');
    if (fs.existsSync(readmePath)) {
      const readmeContent = fs.readFileSync(readmePath, 'utf8');
      
      // 检查是否有新功能但README中还在"未来计划"中
      this.checkFeatureDocumentation(allFeatureFiles, readmeContent);
    }
  }

  getFilesInDirectory(dirPath) {
    const fullPath = path.join(__dirname, '..', dirPath);
    if (!fs.existsSync(fullPath)) return [];
    
    try {
      return fs.readdirSync(fullPath, { recursive: true })
        .filter(file => file.endsWith('.ts') || file.endsWith('.tsx'))
        .map(file => path.join(dirPath, file));
    } catch (error) {
      return [];
    }
  }

  checkFeatureDocumentation(featureFiles, readmeContent) {
    // 检查关键功能文件
    const keyFeatures = [
      { file: 'src/lib/trainingAlgorithm.ts', name: '训练算法' },
      { file: 'src/hooks/use-storage.tsx', name: '本地存储' },
      { file: 'src/pages/HistoryPage.tsx', name: '历史记录管理' },
      { file: 'src/lib/storage.ts', name: 'PWA支持' }
    ];

    for (const feature of keyFeatures) {
      const featureExists = featureFiles.some(file => file.includes(feature.file.split('/').pop()));
      const isInFuturePlans = readmeContent.includes('未来计划') && 
                              readmeContent.toLowerCase().includes(feature.name.toLowerCase());
      
      if (featureExists && isInFuturePlans) {
        this.warnings.push({
          type: 'feature_documentation_mismatch',
          message: `功能 "${feature.name}" 已实现但仍在README的"未来计划"中`,
          feature: feature.name,
          file: feature.file
        });
      }
    }
  }

  async checkTestStatus() {
    console.log('🔍 检查测试状态...');
    
    try {
      // 运行测试并获取结果
      const testResult = execSync('npm run test:run 2>&1', { encoding: 'utf8' });
      
      // 分析测试结果
      const passedMatch = testResult.match(/(\d+) passed/);
      const failedMatch = testResult.match(/(\d+) failed/);
      
      const testStats = {
        passed: passedMatch ? parseInt(passedMatch[1]) : 0,
        failed: failedMatch ? parseInt(failedMatch[1]) : 0,
        total: 0
      };
      
      testStats.total = testStats.passed + testStats.failed;
      
      // 更新测试结果文档
      this.updateTestResults(testStats);
      
    } catch (error) {
      console.log('⚠️  测试运行失败或有测试未通过');
      this.warnings.push({
        type: 'test_execution_failed',
        message: '测试执行失败，请检查测试状态',
        details: error.message
      });
    }
  }

  updateTestResults(testStats) {
    const testResultsPath = path.join(__dirname, '../TEST_RESULTS.md');
    const timestamp = new Date().toLocaleString('zh-CN');
    
    const content = `# FMS项目测试结果

## 最新测试状态 (${timestamp})

- ✅ **通过测试**: ${testStats.passed}
- ${testStats.failed > 0 ? '❌' : '✅'} **失败测试**: ${testStats.failed}
- 📊 **总测试数**: ${testStats.total}
- 📈 **通过率**: ${testStats.total > 0 ? Math.round((testStats.passed / testStats.total) * 100) : 0}%

## 测试覆盖范围

### 组件测试
- Assessment测试套件
- Integration测试套件
- UI组件测试

### 功能测试
- 评估流程测试
- 数据存储测试
- 状态管理测试

## 自动化更新
此文档由 \`doc-sync-check.js\` 脚本自动维护。

最后更新: ${timestamp}
`;

    fs.writeFileSync(testResultsPath, content, 'utf8');
    console.log(`📝 已更新测试结果文档: ${testStats.passed}/${testStats.total} 通过`);
  }

  async generateReport() {
    console.log('\n📋 生成文档同步报告...');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ 所有文档都已同步，无需更新');
      return true;
    }

    if (this.errors.length > 0) {
      console.log('\n❌ 发现错误:');
      this.errors.forEach(error => {
        console.log(`   • ${error.message}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  发现警告:');
      this.warnings.forEach(warning => {
        console.log(`   • ${warning.message}`);
      });
    }

    console.log('\n📝 建议操作:');
    console.log('   1. 检查标记的文档是否需要更新');
    console.log('   2. 将已实现功能从"未来计划"移至"已实现功能"');
    console.log('   3. 更新测试状态和覆盖率信息');

    return this.errors.length === 0;
  }

  async run() {
    console.log('🚀 开始文档同步检查...\n');
    
    await this.checkFileChanges();
    await this.checkFeatureSync();
    await this.checkTestStatus();
    
    const success = await this.generateReport();
    
    console.log('\n✨ 文档同步检查完成');
    return success;
  }
}

// 执行检查
if (require.main === module) {
  const checker = new DocumentSyncChecker();
  checker.run().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = DocumentSyncChecker; 