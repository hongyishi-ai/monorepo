// checkDuplicates.mjs
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前脚本的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取命令行参数中的文件路径
const args = process.argv.slice(2);

if (args.length === 0) {
    console.error('请提供要检查的诊断分类文件路径。例如：');
    console.error('node checkDuplicates.mjs src/data/diagnosisCategories.js src/data/indicationCategories.js');
    process.exit(1);
}

// 动态导入多个数据文件
const categoriesList = [];

for (const arg of args) {
    const dataFilePath = path.resolve(__dirname, arg);
    try {
        const module = await import(`file://${dataFilePath}`);
        if (module.default && typeof module.default === 'object') {
            categoriesList.push({
                file: arg,
                categories: module.default
            });
        } else {
            console.warn(`文件 ${arg} 没有默认导出或导出的内容不是对象，跳过。`);
        }
    } catch (error) {
        console.error(`无法导入文件：${dataFilePath}`);
        console.error(error);
        process.exit(1);
    }
}

// 检查重复项的函数
function checkDuplicates(categoriesList) {
    const globalItemMap = new Map(); // 项目 -> [{ file, category }]
    const duplicates = new Set();
    const internalDuplicates = {};

    // 遍历所有文件和类别
    for (const { file, categories } of categoriesList) {
        for (const [category, items] of Object.entries(categories)) {
            const seenInCategory = new Set();
            for (const item of items) {
                // 检查类别内部的重复
                if (seenInCategory.has(item)) {
                    if (!internalDuplicates[file]) {
                        internalDuplicates[file] = {};
                    }
                    if (!internalDuplicates[file][category]) {
                        internalDuplicates[file][category] = new Set();
                    }
                    internalDuplicates[file][category].add(item);
                } else {
                    seenInCategory.add(item);
                }

                // 检查全局重复
                if (globalItemMap.has(item)) {
                    duplicates.add(item);
                    globalItemMap.get(item).push({ file, category });
                } else {
                    globalItemMap.set(item, [{ file, category }]);
                }
            }
        }
    }

    // 报告跨文件和跨类别的重复项
    const globalDuplicates = Array.from(duplicates).filter(item => {
        const entries = globalItemMap.get(item);
        // 重复出现在多个文件或多个类别
        const uniqueFiles = new Set(entries.map(e => e.file));
        const uniqueCategories = new Set(entries.map(e => `${e.file} - ${e.category}`));
        return uniqueFiles.size > 1 || uniqueCategories.size > 1;
    });

    if (globalDuplicates.length > 0) {
        console.log(`\n全局重复项目（跨文件或跨类别）：`);
        for (const item of globalDuplicates) {
            const entries = globalItemMap.get(item);
            console.log(`\n重复项目: "${item}" 出现在以下位置:`);
            entries.forEach(entry => console.log(` - 文件: ${entry.file}, 类别: ${entry.category}`));
        }
    } else {
        console.log('未发现任何全局重复项（跨文件或跨类别）。');
    }

    // 报告类别内部的重复
    const internalDuplicateEntries = Object.entries(internalDuplicates);
    if (internalDuplicateEntries.length > 0) {
        console.log(`\n类别内部的重复项目:`);
        for (const [file, categories] of internalDuplicateEntries) {
            console.log(`\n文件: ${file}`);
            for (const [category, items] of Object.entries(categories)) {
                console.log(`  类别: ${category}`);
                items.forEach(item => console.log(`    - ${item}`));
            }
        }
    } else {
        console.log('未发现任何类别内部的重复项。');
    }

    if (globalDuplicates.length === 0 && internalDuplicateEntries.length === 0) {
        console.log('未发现任何重复项。');
    }
}

// 执行检查
checkDuplicates(categoriesList);