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
    <div ref={targetRef} className="relative min-h-screen">
      {/* 开场动画区域 - 全屏固定 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(217,48,37,0.18),transparent_24rem),linear-gradient(rgba(18,49,60,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(18,49,60,0.06)_1px,transparent_1px)] bg-[length:auto,72px_72px,72px_72px]" />
          <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-primary/70 shadow-[0_0_18px_rgba(217,48,37,0.38)]" />
          <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background" />
        </div>

        <div className="absolute left-5 top-5 z-10 flex items-end gap-3 md:left-8 md:top-8">
          <div className="font-black leading-none text-primary">红医师</div>
          <div className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-secondary">FMS</div>
        </div>

        <div className="absolute bottom-5 right-5 z-10 hidden font-mono text-xs font-bold uppercase tracking-[0.28em] text-secondary/70 md:block">
          XUN LIAN SHANG FANG ZHI
        </div>

        <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-center px-6 py-20 md:px-8">
          {/* 左对齐的多行文字布局 */}
          <div className="text-left space-y-2 md:space-y-4">
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
        <div className="fixed bottom-8 left-1/2 z-10 -translate-x-1/2 transform text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="space-y-2 font-mono text-sm font-bold text-secondary/75"
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
  const initialOpacity = isFirstWord ? 0.72 : 0;
  const opacity = useTransform(progress, range, [initialOpacity, 1]);
  const scale = useTransform(progress, range, [0.9, 1]);
  const y = useTransform(progress, range, [20, 0]);
  
  return (
    <motion.span 
      style={{ opacity, scale, y }}
      className="relative mr-3 mb-2 inline-block text-5xl font-black tracking-normal text-primary/20 md:mr-5 md:mb-3 md:text-7xl lg:mr-7 lg:mb-4 lg:text-8xl"
    >
      {/* 前景文字 - 更强的对比 */}
      <span className="relative z-10 font-black text-primary drop-shadow-sm">
        {children}
      </span>
    </motion.span>
  );
};

export default OpeningPage; 
