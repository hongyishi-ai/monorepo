import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import CombinedRecommendationCard from "./CombinedRecommendationCard";

const RecommendationCards = ({
  recommendedMedications = [],
  combinedRecommendations = [],
  handleMedicationSelect,
  handleCombinationSelect,
  selectedSymptoms = [],
  selectedDiagnoses = [],
}) => {
  // 确定是否有选中的症状或诊断，使用 useMemo 进行缓存，避免每次渲染时重新计算
  const hasSelections = useMemo(() => selectedSymptoms.length > 0 || selectedDiagnoses.length > 0, [selectedSymptoms, selectedDiagnoses]);

  // 记录组件当前渲染状态的信息，仅在开发环境中启用日志
  /* if (process.env.NODE_ENV === "development") {
    console.log("RecommendationCards 渲染:", {
      hasSelections,
      selectedSymptoms,
      selectedDiagnoses,
      recommendedMedicationsCount: recommendedMedications.length,
      combinedRecommendationsCount: combinedRecommendations.length,
    });
  }
  */
  return (
    <div className="space-y-4">
      {/* 单一药品推荐部分 */}
      {combinedRecommendations.length === 0 && recommendedMedications.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 py-4 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-base font-semibold mb-2">推荐用药</h2>
          <Card className="md:col-span-2">
            <CardHeader />
            <CardContent>
              <ScrollArea className="h-[200px]">
                {/* 如果没有选中的症状或诊断，显示提示信息 */}
                {!hasSelections ? (
                  <p className="text-center text-gray-500">请选择您的症状体征或诊断结果</p>
                ) :
                // 如果有推荐的药品，显示药品列表
                recommendedMedications.length > 0 ? (
                  <ul>
                    {recommendedMedications.map((med, index) => (
                      <li key={med.id || `med-${index}`} className="mb-2">
                        <Button
                          variant="link"
                          onClick={() => {
                            console.log("选择的药品:", med);
                            handleMedicationSelect(med);
                          }}
                          className="text-left"
                        >
                          {med.name}
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  // 如果没有符合条件的药品，显示提示信息
                  <p className="text-center text-gray-500">没有符合所有条件的单一药品</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 联合用药推荐部分 */}
      {combinedRecommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 py-4 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-base font-semibold mb-2">联合用药推荐</h2>
          <CombinedRecommendationCard
            combinations={combinedRecommendations}
            onSelect={(combination) => {
              console.log("选择的联合用药:", combination);
              handleCombinationSelect(combination);
            }}
          />
        </div>
      )}

      {/* 如果有选择但没有任何推荐时的提示信息 */}
      {hasSelections && recommendedMedications.length === 0 && combinedRecommendations.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 py-4 hover:shadow-lg transition-shadow duration-300">
          <p className="text-center text-gray-500">没有符合所有条件的药品推荐</p>
        </div>
      )}
    </div>
  );
};

export default RecommendationCards;