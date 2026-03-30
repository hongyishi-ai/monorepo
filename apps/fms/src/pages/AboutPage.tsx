import { useEffect } from 'react';

const AboutPage = () => {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="pt-12 pb-20 px-3 md:pt-28 md:pb-48 md:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="text-center px-4">
            <h1 className="text-4xl md:text-6xl mb-4 md:mb-5 font-bold text-foreground tracking-tight leading-tight md:leading-[1.1]">
              关于本项目
            </h1>
            <div className="text-gray-500 dark:text-gray-400 text-sm md:text-lg mb-8 md:mb-14">
              <time dateTime="2025-07-01">2025 年 7 月</time>
            </div>
          </header>

          {/* Main Content Grid */}
          <div className="grid gap-16 md:gap-48 mt-8 md:mt-32">
            <section className="max-w-4xl mx-auto relative">
              {/* Sticky Image */}
              <div className="sticky top-16 mb-6 md:mb-8">
                <div className="relative w-[110%] -ml-[5%] pb-[55%] overflow-hidden rounded-xl md:rounded-2xl">
                  <img 
                    src="/about.png" 
                    alt="FMS功能性动作筛查系统项目图片，展示医疗救援与健康防护理念"
                    loading="eager"
                    decoding="async"
                    className="absolute top-0 left-0 w-full h-full object-cover fade-in-image"
                  />
                </div>
              </div>

              {/* Content Card */}
              <div className="bg-card p-8 md:p-16 lg:p-20 relative -mt-32 md:-mt-72 shadow-xl border border-border rounded-xl md:rounded-2xl max-w-[70ch] mx-auto">
                <p className="mb-5 md:mb-8 text-lg text-foreground dark:text-gray-200 leading-relaxed md:leading-loose">
                  训练伤，大多不是意外。
                </p>
                <p className="mb-5 md:mb-8 text-lg text-foreground dark:text-gray-200 leading-relaxed md:leading-loose">
                  它们是身体发出的信号，是可以通过科学评估和主动干预来避免的警示。
                </p>
                <p className="mb-5 md:mb-8 text-lg text-foreground dark:text-gray-200 leading-relaxed md:leading-loose">
                  正因如此，我们创建了「红医师训练伤防治」平台。它是一个公益项目，旨在将专业的风险评估与纠正方案，带给每一位一线官兵和运动爱好者。
                </p>
                <p className="mb-5 md:mb-8 text-lg text-foreground dark:text-gray-200 leading-relaxed md:leading-loose">
                  我是一名关注训练保障多年的医疗工作者。我深知，伤病对战斗力和运动生涯的毁灭性打击。
                </p>
                <p className="mb-5 md:mb-8 text-lg text-foreground dark:text-gray-200 leading-relaxed md:leading-loose">
                  我们都懂热身的重要性。
                  <br />
                  但，这还不够。
                </p>
                <p className="mb-5 md:mb-8 text-lg text-foreground dark:text-gray-200 leading-relaxed md:leading-loose">
                  许多伤害的根源，并非准备不足，而是身体早已存在的“短板”——那些隐藏的灵活性、稳定性或活动度缺陷。这些，单靠热身无法解决。
                </p>
                <p className="mb-5 md:mb-8 text-lg text-foreground dark:text-gray-200 leading-relaxed md:leading-loose">
                  因此，我们引入FMS功能性动作筛查。它像一面镜子，精准照出身体功能的薄弱环节。先纠正，再强化，配合常规热身，才能为高强度训练铸就坚实的安全底座。
                </p>
                <p className="mb-5 md:mb-8 text-lg text-foreground dark:text-gray-200 leading-relaxed md:leading-loose">
                  健康的身体，是一切的基石。
                </p>
                <p className="mb-5 md:mb-8 text-lg text-foreground dark:text-gray-200 leading-relaxed md:leading-loose">
                  我在此，诚邀每一位战友与运动爱好者：
                  <br />
                  正视风险，主动预防。
                  <br />
                  并将这个平台，分享给更多需要它的人。
                </p>
                <p className="mb-5 md:mb-8 text-lg text-foreground dark:text-gray-200 leading-relaxed md:leading-loose">
                  「训练伤防治」平台，是一个起点。我们的目标，是构建一套完整的基层训练伤防治解决方案。它仍在完善，期待您宝贵的建议。
                </p>
                <p className="mb-5 md:mb-0 text-lg text-foreground dark:text-gray-200 leading-relaxed md:leading-loose">
                  守护大家的运动健康，我全力以赴。
                </p>
              </div>
            </section>
          </div>
        </div>
      </article>
    </main>
  );
};

export default AboutPage; 