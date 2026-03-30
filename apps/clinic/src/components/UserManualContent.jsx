// src/components/UserManualContent.jsx
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/components/theme-provider'; // 确保路径正确

const UserManualContent = () => {
  const [markdownContent, setMarkdownContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { theme } = useTheme(); // 获取当前主题

  useEffect(() => {
    // 在 Vite 中，public 文件夹中的文件可以通过根路径访问
    fetch('/Start/Start.md')
      .then((response) => {
        if (!response.ok) {
          throw new Error('网络响应不是 OK');
        }
        return response.text();
      })
      .then((text) => {
        setMarkdownContent(text);
        setLoading(false);
      })
      .catch((err) => {
        console.error('获取 Markdown 文件失败:', err);
        setError(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p>加载中...</p>;
  }

  if (error) {
    return <p>加载内容时出错: {error.message}</p>;
  }

  return (
    <div className="prose dark:prose-dark max-w-none">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={theme === 'dark' ? oneDark : oneLight}
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
        {markdownContent}
      </ReactMarkdown>
      {/* 添加更多详细的使用说明 */}
    </div>
  );
};

export default UserManualContent;