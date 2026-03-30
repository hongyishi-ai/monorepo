// src/data/generateArticleList.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定义文章目录和输出文件路径
const articlesDir = path.join(__dirname, '../../public/article');
const outputFile = path.join(__dirname, 'articleList.js');

// 生成文章列表
async function generateArticleList() {
  try {
    // 检查 articlesDir 是否存在
    await fs.access(articlesDir);
  } catch (err) {
    console.error('错误: public/article 目录不存在.');
    process.exit(1);
  }

  try {
    // 读取 articlesDir 中的文件
    const files = await fs.readdir(articlesDir);

    // 过滤出 .html 文件
    const htmlFiles = files.filter(file => path.extname(file).toLowerCase() === '.html');

    // 生成导出内容
    const exportContent = `// 此文件由 generateArticleList.js 自动生成
const articles = ${JSON.stringify(htmlFiles, null, 2)};

export default articles;
`;

    // 写入到 articleList.js
    await fs.writeFile(outputFile, exportContent, 'utf8');
    console.log('成功生成 src/data/articleList.js');
  } catch (err) {
    console.error('生成 articleList.js 失败:', err);
    process.exit(1);
  }
}

// 如果脚本作为主模块运行，则执行生成
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateArticleList();
}

export { generateArticleList };
