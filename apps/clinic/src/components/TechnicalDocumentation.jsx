import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/components/theme-provider'; // 引入主题钩子

const TechnicalDocumentation = ({ isOpen, onClose }) => {
  const [content, setContent] = useState(''); // Markdown 内容
  const [loading, setLoading] = useState(true); // 加载状态
  const [error, setError] = useState(null); // 错误状态
  const { theme } = useTheme(); // 获取当前主题

  useEffect(() => {
    if (isOpen) {
      // 当组件打开时，加载 Markdown 文件
      fetch('/TechnicalDocumentation.md') // 使用绝对路径
        .then((response) => {
          if (!response.ok) {
            throw new Error('网络响应不是 OK');
          }
          return response.text();
        })
        .then((text) => {
          setContent(text);
          setLoading(false);
        })
        .catch((err) => {
          console.error('加载 Markdown 文件时出错:', err);
          setError(err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose} // 点击背景关闭
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()} // 阻止点击内容区域关闭
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">技术文档</h2>
            <div className="prose dark:prose-dark text-gray-600 dark:text-gray-300 space-y-4">
              {loading && <p>加载中...</p>}
              {error && <p className="text-red-500">加载内容时出错。</p>}
              {!loading && !error && (
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={theme === 'dark' ? oneDark : oneLight} // 根据主题选择样式
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TechnicalDocumentation;