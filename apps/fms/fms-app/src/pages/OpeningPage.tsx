import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FC } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const OpeningPage: FC = () => {
  const navigate = useNavigate();
  const targetRef = useRef<HTMLDivElement | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  });

  // 文字内容 - 分行显示，便于左对齐
  const lines = [
    "察至微，",
    "而识其著；",
    "正其动，",
    "而无其伤。",
    " ",
  ];

  // 导航到主页的函数
  const navigateToHome = () => {
    // 设置已访问标记，防止重复触发开场动画
    localStorage.setItem('fms_has_visited', 'true');
    
    // 先滚动到顶部，然后导航
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // 延迟导航，确保滚动动画完成并提供视觉连贯性
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 800);
  };

  // 监听滚动进度，当动画完成时自动路由到主页
  useEffect(() => {
    let hasNavigated = false;
    
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      // 当滚动到80%时，认为动画完成，开始路由到主页（提高灵敏度）
      if (latest >= 0.75 && !hasNavigated) {
        hasNavigated = true;
        setTimeout(() => {
          navigateToHome();
        }, 900);
      }
    });

    return () => unsubscribe();
  }, [scrollYProgress]);

  // 添加键盘快捷键，允许用户快速跳过动画
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 按空格键或回车键跳过动画
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        navigateToHome();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div ref={targetRef} className="relative">
      {/* 开场动画区域 - 全屏固定 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-8 py-20">
          {/* 左对齐的多行文字布局 */}
          <div className="text-left space-y-4 md:space-y-6">
            {lines.map((line, lineIndex) => (
              <div key={lineIndex} className="flex flex-wrap">
                {line.split(" ").map((word, wordIndex) => {
                  const totalWords = lines.reduce((acc, l) => acc + l.split(" ").length, 0);
                  const currentWordIndex = lines.slice(0, lineIndex).reduce((acc, l) => acc + l.split(" ").length, 0) + wordIndex;
                  const start = currentWordIndex / totalWords;
                  const end = start + 1 / totalWords;
                  
                  return (
                    <OpeningWord 
                      key={`${lineIndex}-${wordIndex}`} 
                      progress={scrollYProgress} 
                      range={[start, end]}
                      isFirstWord={lineIndex === 0 && wordIndex === 0}
                    >
                      {word}
                    </OpeningWord>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 底部提示信息 */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-sm text-muted-foreground space-y-2"
          >
            <p className="hidden md:block">向下滚动继续</p>
            <p className="md:hidden">向下滑动继续</p>
            <div className="flex justify-center">
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-primary"
              >
                ↓
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 优化移动端滚动灵敏度 - 减少滚动距离 */}
      <div className="h-[450vh] md:h-[700vh]" />
    </div>
  );
};

interface OpeningWordProps {
  children: React.ReactNode;
  progress: import("framer-motion").MotionValue<number>;
  range: [number, number];
  isFirstWord?: boolean;
}

const OpeningWord: FC<OpeningWordProps> = ({ children, progress, range, isFirstWord = false }) => {
  // 首行文字初始有轻微可见性，其他文字完全隐藏
  const initialOpacity = isFirstWord ? 0.50 : 0;
  const opacity = useTransform(progress, range, [initialOpacity, 1]);
  const scale = useTransform(progress, range, [0.9, 1]);
  const y = useTransform(progress, range, [20, 0]);
  
  return (
    <motion.span 
      style={{ opacity, scale, y }}
      className="relative mr-4 mb-3 inline-block text-4xl font-light tracking-widest text-black/15 dark:text-white/15 md:mr-6 md:mb-4 md:text-5xl lg:mr-8 lg:mb-5 lg:text-6xl xl:mr-10 xl:mb-6 xl:text-7xl"
    >
      {/* 背景文字 - 更淡的效果 */}
      <span className="absolute inset-0 opacity-25 blur-[0.5px]">{children}</span>
      {/* 前景文字 - 更强的对比 */}
      <motion.span
        style={{ opacity }}
        className="relative z-10 font-medium text-black dark:text-white drop-shadow-sm"
      >
        {children}
      </motion.span>
    </motion.span>
  );
};

export default OpeningPage; 