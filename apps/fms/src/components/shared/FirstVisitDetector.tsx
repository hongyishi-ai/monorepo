import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { safeLocalStorage } from "@/lib/safe-storage";

const FirstVisitDetector = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 检查是否是首次访问网站
    const hasVisitedBefore = safeLocalStorage.getItem("fms_has_visited");

    // 检查URL参数，如果有skip_opening=true则跳过开场动画
    const urlParams = new URLSearchParams(window.location.search);
    const skipOpening = urlParams.get("skip_opening") === "true";
    const isRootEntry = location.pathname === "/";

    // 首次访问根路径时显示开场页；任务深链接必须保持可达。
    if (!hasVisitedBefore && isRootEntry && !skipOpening) {
      navigate("/opening", { replace: true });
      return;
    }

    // 如果有跳过参数，设置已访问标记
    if (skipOpening && !hasVisitedBefore) {
      safeLocalStorage.setItem("fms_has_visited", "true");
    }
  }, [navigate, location.pathname]);

  return <>{children}</>;
};

export default FirstVisitDetector;
