import { useEffect } from "react";
import { FmsPageHeader } from "@/components/shared/FmsPage";

const AboutPage = () => {
  const assetBase = import.meta.env.BASE_URL;

  useEffect(() => {
    const prefersReducedMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, []);

  return (
    <div className="hys-section min-h-screen bg-background text-foreground">
      <article className="hys-container max-w-6xl overflow-x-hidden">
        <FmsPageHeader
          eyebrow="ABOUT FMS"
          title="关于本项目"
          description={
            <>
              <time dateTime="2025-07-01">2025 年 7 月</time> ·
              公益训练伤防治工具
            </>
          }
        />

        <section className="mx-auto max-w-4xl" data-tour-id="about-story">
          <div className="hys-card mb-8 overflow-hidden">
            <img
              src={`${assetBase}about.png`}
              alt="FMS功能性动作筛查系统项目图片，展示医疗救援与健康防护理念"
              loading="eager"
              decoding="async"
              className="h-auto w-full object-cover fade-in-image"
            />
          </div>

          <div className="hys-card mx-auto max-w-[70ch] p-6 md:p-12 lg:p-16">
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
      </article>
    </div>
  );
};

export default AboutPage;
