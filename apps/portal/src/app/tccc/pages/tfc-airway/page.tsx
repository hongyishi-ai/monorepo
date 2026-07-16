import { TcccModulePage } from "../../_components/TcccModulePage";
import { tcccModuleBySlug } from "../../_data/tcccFlowRegistry";

function getAirwayModule() {
  const module = tcccModuleBySlug.get("tfc-airway");

  if (!module) {
    throw new Error("Missing TFC airway module definition");
  }

  return module;
}

const airwayModule = getAirwayModule();

export const metadata = {
  title: "TFC 气道管理决策训练 | 红医师",
  description:
    "依据 JTS / CoTCCC 2026-05-01 指南复核的战术野战救治气道管理中文交互流程。",
};

export default function TcccAirwayPage() {
  return <TcccModulePage module={airwayModule} />;
}
