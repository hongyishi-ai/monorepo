// src/data/validateDiagnosis.mjs
// 运行 node src/data/validateDiagnosis.mjs，校验diagnoses是否被正确分类

// 导入所需的模块
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url'; // 用于在 ES 模块中获取文件路径
import diagnosisCategories from './diagnosisCategories.js';

// 使用 fileURLToPath 确定 __dirname 以确保路径正确解析
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 异步函数进行 diagnoses 验证
(async () => {
    try {
        // 读取 medications.json 文件
        const medicationsPath = path.join(__dirname, '../data/medications.json');
        const medicationsData = await fs.readFile(medicationsPath, 'utf-8');
        const medications = JSON.parse(medicationsData); // 将读取的数据解析为 JSON

        // 创建一个 diagnosis 集合，用于存储所有分类的诊断
        const allCategorizedDiagnoses = new Set(
            Object.values(diagnosisCategories).flat() // 扁平化所有分类
        );

        // 遍历所有药品，检查它们的 diagnosis 是否正确
        medications.forEach(drug => {
            if (!drug.diagnosis || !Array.isArray(drug.diagnosis)) {
                console.warn(`药品 ${drug.name} 缺少 diagnosis 或格式不正确。`);
                return;
            }

            // 检查每个药品的 diagnosis 是否存在于分类中
            drug.diagnosis.forEach(diagnosis => {
                if (!allCategorizedDiagnoses.has(diagnosis)) {
                    console.warn(`药品 ${drug.name} 包含未分类的 diagnosis: ${diagnosis}`);
                }
            });
        });

        console.log('diagnosis 验证完成。');
    } catch (error) {
        console.error('验证过程中出错:', error);
    }
})();