// src/components/ClinicalGuidelineAccordion.jsx

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import GuidelineAutocompleteSearch from "@/components/GuidelineAutocompleteSearch";
import ReactMarkdown from 'react-markdown';

// 系统标识到中文名称的映射
const systemNames = {
  respiratory: '呼吸系统',
  digestive: '消化系统',
  muscular: '运动系统',
  cardiovascular: '心血管系统',
  endocrine: '内分泌系统',
  nervous: '神经系统',
  integumentary: '皮肤性病',
  reproductive: '生殖系统',
  metabolic: '代谢系统',
  skeletal: '骨骼系统',
  // 添加其他系统...
};

// 辅助函数：动态导入 data 文件夹中的所有 JSON 文件
function importAllGuidelines() {
  const modules = import.meta.glob('../data/*.json', { eager: true });

  const guidelines = Object.keys(modules).map((key) => {
    const data = modules[key];
    const fileName = key.replace('../data/', '').replace('.json', '');

    const match = fileName.match(/^([^-\(]+)-(.+?)\((\d{4})\)$/);
    if (!match) {
      console.warn(`文件名 "${fileName}" 不符合预期的格式 "系统-指南名称(年份).json"`);
      return null;
    }

    const [, system, guidelineName, year] = match;

    // 为每个 Q&A 分配唯一的 ID
    const enrichedData = data.default || data;
    const combinedData = enrichedData.map((item, idx) => ({
      id: `${system}-${guidelineName}-${year}-qa-${idx}`, // 唯一 ID
      system,
      systemName: systemNames[system] || system, // 用于显示和搜索
      guidelineName,
      year,
      question: item.question,
      answer: item.answer,
    }));

    return combinedData;
  }).filter(Boolean).flat(); // 展平数组

  return guidelines;
}

export function ClinicalGuidelineAccordion() {
  const allGuidelines = useMemo(() => importAllGuidelines(), []);

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSystem, setExpandedSystem] = useState(null); // 仅允许一个系统展开
  const [expandedGuideline, setExpandedGuideline] = useState(null); // 仅允许一个指南展开
  const [expandedQaId, setExpandedQaId] = useState(null); // 仅允许一个 Q&A 展开
  const [selectedQaId, setSelectedQaId] = useState(null);

  // Refs 存储 Q&A 元素
  const qaRefs = useRef({});

  // 根据搜索词过滤数据
  const filteredData = useMemo(() => {
    if (searchTerm.trim().length === 0) {
      return allGuidelines;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return allGuidelines.filter(item =>
      item.systemName.toLowerCase().includes(lowerSearchTerm) ||
      item.guidelineName.toLowerCase().includes(lowerSearchTerm) ||
      item.question.toLowerCase().includes(lowerSearchTerm) ||
      item.answer.toLowerCase().includes(lowerSearchTerm)
    );
  }, [searchTerm, allGuidelines]);

  // 分组指南数据，根据系统和指南进行分组
  const groupedGuidelines = useMemo(() => {
    return filteredData.reduce((acc, item) => {
      if (!acc[item.system]) {
        acc[item.system] = {};
      }
      const guidelineKey = `${item.guidelineName} (${item.year})`;
      if (!acc[item.system][guidelineKey]) {
        acc[item.system][guidelineKey] = {
          guidelineName: item.guidelineName,
          year: item.year,
          qas: [],
        };
      }
      acc[item.system][guidelineKey].qas.push(item);
      return acc;
    }, {});
  }, [filteredData]);

  // 处理搜索结果选择
  const handleSelect = (guideline) => {
    const { system, guidelineName, year, id } = guideline;

    const guidelineKey = `${guidelineName} (${year})`;

    // 设置展开的系统（单选）
    setExpandedSystem(system);

    // 设置展开的指南（单选）
    setExpandedGuideline(guidelineKey);

    // 设置选中的 Q&A ID
    setExpandedQaId(id);
    setSelectedQaId(id);
  };

  // 在展开系统和指南后，滚动到选中的 Q&A 项
  useEffect(() => {
    if (selectedQaId) {
      // 等待 Accordion 动画展开
      setTimeout(() => {
        const element = qaRefs.current[selectedQaId];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // 添加高亮效果
          element.classList.add('highlight');
          // 移除高亮效果
          setTimeout(() => {
            element.classList.remove('highlight');
          }, 2000);
        }
      }, 500); // 延迟时间可根据需要调整
    }
  }, [expandedSystem, expandedGuideline, selectedQaId]);

  return (
    <div className="w-full p-4">
      {/* 移除标题，让搜索框左对齐 */}
      <GuidelineAutocompleteSearch
        guidelines={allGuidelines}
        onSelect={handleSelect}
      />

      <Accordion
        type="single" // 仅允许一个系统展开
        collapsible
        className="w-full mt-4"
        value={expandedSystem}
        onValueChange={(value) => setExpandedSystem(value)}
      >
        {/* 动态生成的系统 Accordion */}
        {Object.entries(groupedGuidelines).map(([system, guidelines]) => (
          <AccordionItem
            key={system}
            value={system}
          >
            <AccordionTrigger className="text-xl font-semibold">
              {systemNames[system] || system}
            </AccordionTrigger>
            <AccordionContent>
              <Accordion
                type="single" // 仅允许一个指南展开
                collapsible
                className="w-full mt-2"
                value={expandedGuideline}
                onValueChange={(value) => setExpandedGuideline(value)}
              >
                {/* 每个系统下的指南 */}
                {Object.entries(guidelines).map(([guidelineKey, guidelineData], index) => (
                  <AccordionItem
                    key={`${system}-${index}`}
                    value={guidelineKey}
                  >
                    <AccordionTrigger className="text-lg font-medium text-green-700">
                      {`${guidelineData.guidelineName} (${guidelineData.year})`}
                    </AccordionTrigger>
                    <AccordionContent className="pl-4">
                      <Accordion
                        type="single" // 仅允许一个 Q&A 展开
                        collapsible
                        className="w-full mt-2"
                        value={expandedQaId}
                        onValueChange={(value) => setExpandedQaId(value)}
                      >
                        {/* 每个指南下的 Q&A */}
                        {guidelineData.qas.map((item) => (
                          <AccordionItem
                            key={item.id}
                            value={item.id}
                            ref={(el) => { qaRefs.current[item.id] = el; }}
                          >
                            <AccordionTrigger className="text-base font-normal text-gray-800">
                              {item.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-sm font-light text-gray-600">
                              <ReactMarkdown>
                                {item.answer}
                              </ReactMarkdown>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </AccordionContent>
          </AccordionItem>
        ))}

        {/* 预留其他系统的占位符 */}
        {Object.keys(systemNames).filter(system => !groupedGuidelines[system]).map(system => (
          <AccordionItem key={system} value={system}>
            <AccordionTrigger className="text-xl font-semibold">
              {systemNames[system]}
            </AccordionTrigger>
            <AccordionContent>
              {`${systemNames[system]}的相关指南即将上线...`}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

export default ClinicalGuidelineAccordion;