// IntroductionContent.jsx
import React from 'react';

const IntroductionContent = () => {
  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100"></h2>
      <p className="mb-4 text-gray-900 dark:text-gray-200">
        党的二十届三中全会《决定》明确指出：
      </p>
      <blockquote className="border-l-4 border-blue-500 pl-4 mb-4 italic text-gray-600 dark:border-blue-300 dark:text-gray-400">
        “分级诊疗体系是一种先进的制度设计，有助于方便群众就医、优化资源配置、降低医疗费用。”
      </blockquote>
      <p className="mb-4 text-gray-900 dark:text-gray-200">
        分级诊疗的原则在于根据疾病的轻重缓急和治疗难易程度进行分类，由不同级别的医疗卫生机构承担相应的诊疗任务，从而形成科学合理的就医和诊疗格局。在全会政策的指导下，进一步完善基层医疗范围内的分级诊疗体系，是我国医疗发展的必然要求。
      </p>
      <blockquote className="border-l-4 border-blue-500 pl-4 mb-4 italic text-gray-600 dark:border-blue-300 dark:text-gray-400">
        “国际研究表明，约80%的疾病可以通过初级卫生保障得到有效处置和解决。”
      </blockquote>
      <p className="mb-4 text-gray-900 dark:text-gray-200">
        在这一背景下，“红医师”项目应运而生。项目围绕"常见病如何诊断"、"常见药物如何使用"和"常见问题如何解决"三个关键问题，搭建智能移动终端，旨在解决初级卫生保障工作中的三大难题——医疗人员短缺、药品效用掌握不清和知识储备有限。
      </p>
      <p className="mb-4 text-gray-900 dark:text-gray-200">
        项目构建了多个便捷医疗功能模块，包括：根据患者症状推断疾病诊断、根据患者症状和诊断合理推荐药物、根据用药偏好（如性别、年龄、中西药、过敏史等）设置自定义选项，以及常见病图谱参考等。这些功能体现了"精准医疗"和"个体化治疗"的先进理念。
      </p>
      <p className="mb-4 text-gray-900 dark:text-gray-200">
        此外，项目还内置了可定制的药品说明书快速查询功能和最新临床指南速览功能，帮助医疗人员及时获取治疗信息。这些功能以"降本增效"和"集约化"为目标，旨在节省医疗人员时间，提高工作质量。
      </p>
      <p className="mb-4 text-gray-900 dark:text-gray-200">
        最后，秉持"以患者为本，服务患者"的原则，项目集成了"诊断思维链"和"医生有话说"等科普模块。针对非医疗人员的学习需求，我们提供了"临床思维讲解"、"常用药宣讲"、"同类药鉴别"和"常见用药误区"等实用的患者教育功能。
      </p>
      <p className="mb-4 text-gray-900 dark:text-gray-200">
        目前，该项目的在线部署版本为预览版，多系统离线版本正在陆续开发中。
      </p>
      <img
        src="/images/全平台展示.png"
        alt="项目介绍"
        className="w-full h-auto mt-4 rounded-lg shadow-sm"
      />
      <p className="mb-4 text-gray-900 dark:text-gray-200">
      <div className="mb-4"></div> 
        “罗马帝国不是一天建成的”，医疗保障的现代化也终究会实现。
      </p>
      
      {/* 添加5行空行 */}
      <div className="mb-40"></div>
    </div>
  );
};

export default IntroductionContent;