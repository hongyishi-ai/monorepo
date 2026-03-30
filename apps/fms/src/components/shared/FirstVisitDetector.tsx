import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ProductTour } from '@/components/ui/product-tour';
import { useProductTour } from '@/hooks/useProductTour';

const FirstVisitDetector = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isOpen,
    currentPageTour,
    closeTour
  } = useProductTour();

  // 创建增强的tour配置，包含导航逻辑
  const enhancedTourConfig = {
    ...currentPageTour,
    steps: currentPageTour.steps.map(step => ({
      ...step,
      action: step.action ? {
        ...step.action,
        onClick: () => {
          if (step.id === 'start-assessment') {
            navigate('/assessment');
          } else {
            step.action?.onClick();
          }
        }
      } : undefined
    }))
  };

  useEffect(() => {
    // 检查是否是首次访问网站
    const hasVisitedBefore = localStorage.getItem('fms_has_visited');
    
    // 检查URL参数，如果有skip_opening=true则跳过开场动画
    const urlParams = new URLSearchParams(window.location.search);
    const skipOpening = urlParams.get('skip_opening') === 'true';
    
    // 如果是首次访问且当前不在开场页面，且没有跳过参数，则导航到开场页面
    if (!hasVisitedBefore && location.pathname !== '/opening' && !skipOpening) {
      navigate('/opening', { replace: true });
      return;
    }
    
    // 如果有跳过参数，设置已访问标记
    if (skipOpening && !hasVisitedBefore) {
      localStorage.setItem('fms_has_visited', 'true');
    }
  }, [navigate, location.pathname]);

  return (
    <>
      {children}
      {/* 产品引导组件 */}
      <ProductTour
        isOpen={isOpen}
        onRequestClose={closeTour}
        config={enhancedTourConfig}
      />
    </>
  );
};

export default FirstVisitDetector; 