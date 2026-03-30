// src/pages/Index.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, X } from "lucide-react";
import Drawer from "../components/Drawer";
import MedicationCatalog from "../components/MedicationCatalog";
import MedicationInfoDrawer from "../components/MedicationInfoDrawer";
import AutocompleteSearch from "../components/AutocompleteSearch";
import RightDrawer from "../components/RightDrawer";
import TopBar from "../components/TopBar";
import MobileDrawerButtons from "../components/MobileDrawerButtons";
import ErrorBoundary from "../components/ErrorBoundary";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SelectionCards from "../components/SelectionCards";
import RecommendationCards from "../components/RecommendationCards"; // 保留
import DisclaimerDialog from "../components/DisclaimerDialog"; // 确保导入

import { useSelections } from "../hooks/useSelections";
import { useRecommendations } from "../hooks/useRecommendations";
import { useMediaQuery } from "../hooks/use-media-query";
import { useMousePosition } from "../hooks/useMousePosition";

import medicationsData from "../data/medications.json";

// 自定义 Hook 来处理键盘状态
const useKeyboardStatus = () => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isOpen = window.innerHeight < 500; // 阈值可根据需要调整
      setIsKeyboardOpen(isOpen);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // 初始化检查
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isKeyboardOpen;
};

const Index = () => {
  // Drawer 状态
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);

  // 选中药物和组合
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [selectedCombination, setSelectedCombination] = useState(null);

  // 搜索和偏好设置
  const [searchTerm, setSearchTerm] = useState("");
  const [isPreferenceEnabled, setIsPreferenceEnabled] = useState(false);

  // 免责声明
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);

  // 页面加载状态
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // 偏好匹配警告
  const [showNoPreferenceMatchWarning, setShowNoPreferenceMatchWarning] = useState(false);

  // 添加 activeTab 状态
  const [activeTab, setActiveTab] = useState("category");

  // 使用自定义 Hook
  const mousePosition = useMousePosition();
  const isMobile = useMediaQuery("(max-width: 767px)"); // 视口宽度小于 768px 认为是移动端
  const isKeyboardOpen = useKeyboardStatus();

  // 使用选择和推荐的 Hook
  const {
    selectedSymptoms,
    selectedDosageForms,
    selectedIngredients,
    selectedDiagnoses,
    handleSymptomSelect,
    handleDosageFormSelect,
    handleIngredientSelect,
    handleDiagnosisSelect,
    resetSelections,
    setSelectedDosageForms,
    setSelectedIngredients,
  } = useSelections();

  const {
    recommendedMedications,
    combinedRecommendations,
    availableDosageForms,
    availableIngredients,
    noPreferenceMatchWarning,
  } = useRecommendations(
    medicationsData,
    selectedSymptoms,
    selectedDosageForms,
    selectedIngredients,
    selectedDiagnoses,
    isPreferenceEnabled
  );

  // 页面加载
  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  // 检查是否显示免责声明
  useEffect(() => {
    const shouldShowDisclaimer = localStorage.getItem("showDisclaimer");
    if (shouldShowDisclaimer === "false") {
      setShowDisclaimer(false);
    }
  }, []);

  // 监听鼠标移动以自动打开 Drawer
  useEffect(() => {
    if (!isMobile && isPageLoaded) {
      const threshold = 20;
      let timer;

      const handleMouseMove = (e) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (e.clientX <= threshold && !isLeftDrawerOpen) {
            setIsLeftDrawerOpen(true);
          } else if (e.clientX >= window.innerWidth - threshold && !isRightDrawerOpen) {
            setIsRightDrawerOpen(true);
          }
        }, 500);
      };

      window.addEventListener("mousemove", handleMouseMove);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        clearTimeout(timer);
      };
    }
  }, [isMobile, isPageLoaded, isLeftDrawerOpen, isRightDrawerOpen]);

  // 处理偏好匹配警告
  useEffect(() => {
    if (noPreferenceMatchWarning) {
      setShowNoPreferenceMatchWarning(true);
    }
  }, [noPreferenceMatchWarning]);

  // 处理药物选择
  const handleMedicationSelect = useCallback((medication) => {
    setSelectedMedication(medication);
    setSelectedCombination(null);
    setIsInfoDrawerOpen(true);
  }, []);

  const handleCombinationSelect = useCallback((combination) => {
    setSelectedCombination(combination);
    setSelectedMedication(null);
    setIsInfoDrawerOpen(true);
  }, []);

  // 重置选择
  const handleReset = useCallback(() => {
    resetSelections();
    setSearchTerm("");
  }, [resetSelections]);

  // 切换 Drawer
  const toggleLeftDrawer = () => setIsLeftDrawerOpen((prev) => !prev);
  const toggleRightDrawer = () => setIsRightDrawerOpen((prev) => !prev);

  // 关闭免责声明
  const handleCloseDisclaimer = () => {
    setShowDisclaimer(false);
    if (doNotShowAgain) {
      localStorage.setItem("showDisclaimer", "false");
    }
  };

  // 渲染主内容
  const renderMainContent = () => (
    <>
      <TopBar className="shadow-md bg-primary text-white" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-6 pt-3 bg-gray-50">
        <div className="lg:col-span-2">
          <SelectionCards
            selectedSymptoms={selectedSymptoms}
            selectedDiagnoses={selectedDiagnoses}
            selectedDosageForms={selectedDosageForms}
            handleSymptomSelect={handleSymptomSelect}
            handleDiagnosisSelect={handleDiagnosisSelect}
            handleDosageFormSelect={handleDosageFormSelect}
            availableDosageForms={availableDosageForms}
            medicationsData={medicationsData}
          />
        </div>
        <div className="lg:col-span-1">
          <RecommendationCards
            recommendedMedications={recommendedMedications}
            combinedRecommendations={combinedRecommendations}
            handleMedicationSelect={handleMedicationSelect}
            handleCombinationSelect={handleCombinationSelect}
            selectedSymptoms={selectedSymptoms}
            selectedDiagnoses={selectedDiagnoses}
          />
        </div>
      </div>
      <Button
        onClick={handleReset}
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 rounded-full p-3 bg-white shadow-lg hover:bg-primary transition-colors duration-200 text-sm"
        size="icon"
      >
        <RotateCcw className="h-5 w-5" />
      </Button>
    </>
  );

  // 关闭偏好匹配警告
  const handleCloseNoPreferenceMatchWarning = () => {
    setShowNoPreferenceMatchWarning(false);
    handleReset(); // 触发重置操作
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-0 text-base bg-gray-50 min-h-screen">
        {showDisclaimer ? (
          <DisclaimerDialog
            showDisclaimer={showDisclaimer}
            setShowDisclaimer={setShowDisclaimer}
            doNotShowAgain={doNotShowAgain}
            setDoNotShowAgain={setDoNotShowAgain}
            handleCloseDisclaimer={handleCloseDisclaimer}
          />
        ) : (
          <>
            {renderMainContent()}
            <ErrorBoundary>
              <Drawer
                isOpen={isLeftDrawerOpen}
                onClose={toggleLeftDrawer}
                className="w-full sm:w-3/4 md:w-1/2 lg:w-1/3 xl:w-1/4 text-base"
              >
                <div className="flex flex-col h-full">
                  {isMobile && isLeftDrawerOpen && (
                    <Button
                      onClick={toggleLeftDrawer}
                      className="fixed bottom-4 left-[20px] z-[9999] rounded-full p-2 bg-white shadow-md hover:bg-gray-100 transition-colors duration-200"
                      size="icon"
                    >
                      <X className="h-6 w-6" />
                    </Button>
                  )}
                  <div className="p-4 flex-shrink-0">
                    <div className="shadow-md rounded-lg">
                      <AutocompleteSearch
                        medications={medicationsData}
                        onSearch={setSearchTerm}
                      />
                    </div>
                  </div>
                  <div className="flex-shrink-0 px-4 pb-2">
                    <Tabs
                      value={activeTab}
                      onValueChange={setActiveTab}
                      className="shadow-md rounded-lg"
                    >
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="category">按类别</TabsTrigger>
                        <TabsTrigger value="diagnosis">按疾病</TabsTrigger>
                        <TabsTrigger value="dosageForm">按剂型</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="flex-grow overflow-y-auto">
                    <div className="p-4">
                      <MedicationCatalog
                        medications={medicationsData}
                        searchTerm={searchTerm}
                        onMedicationSelect={handleMedicationSelect}
                        activeTab={activeTab}
                      />
                    </div>
                  </div>
                </div>
              </Drawer>
            </ErrorBoundary>

            <ErrorBoundary>
              <RightDrawer
                isOpen={isRightDrawerOpen}
                onClose={toggleRightDrawer}
                isMobile={isMobile}
                availableIngredients={availableIngredients}
                selectedIngredients={selectedIngredients}
                setSelectedIngredients={setSelectedIngredients}
                isPreferenceEnabled={isPreferenceEnabled}
                setIsPreferenceEnabled={setIsPreferenceEnabled}
                handleReset={handleReset}
              />
            </ErrorBoundary>

            {isMobile && (
              <ErrorBoundary>
                <MobileDrawerButtons
                  onLeftDrawerToggle={toggleLeftDrawer}
                  onRightDrawerToggle={toggleRightDrawer}
                  isLeftDrawerOpen={isLeftDrawerOpen}
                  isRightDrawerOpen={isRightDrawerOpen}
                />
              </ErrorBoundary>
            )}

            <ErrorBoundary>
              <MedicationInfoDrawer
                medication={selectedMedication}
                combination={selectedCombination}
                isOpen={isInfoDrawerOpen}
                onClose={() => setIsInfoDrawerOpen(false)}
              />
            </ErrorBoundary>

            <ErrorBoundary>
              <Dialog
                open={showNoPreferenceMatchWarning}
                onOpenChange={handleCloseNoPreferenceMatchWarning}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-xl">偏好设置提醒</DialogTitle>
                    <DialogDescription className="text-sm">
                      没有找到满足您偏好设置的用药推荐。请考虑调整您的偏好设置或查看其他推荐。
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      onClick={handleCloseNoPreferenceMatchWarning}
                      className="text-sm"
                    >
                      确定
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </ErrorBoundary>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Index;
