import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const DisclaimerDialog = ({
  showDisclaimer,
  setShowDisclaimer,
  doNotShowAgain,
  setDoNotShowAgain,
  handleCloseDisclaimer,
}) => (
  <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
    <DialogContent className="sm:max-w-[425px] text-base">
      <DialogHeader>
        <DialogTitle className="text-xl">声明</DialogTitle>
      </DialogHeader>
      <DialogDescription className="text-sm">
        1. 处方药物应在医疗专业人员指导下使用。<br />2. 所有说明书和临床指南信息均来源于网络。<br />
        3. 使用本应用即表示您知晓并同意此声明。<br />
        <br />注意：红医师辅助诊疗系统不适用于以下情况：<br /> - 任何胸部沉重、紧绷或挤压性疼痛，尤其是伴随脸色苍白或出汗（可能是心脏病发作的迹象）<br /> - 面部一侧下垂及/或手臂无力或言语困难<br /> - 突然出现的意识模糊、嗜睡或迷失方向<br /> - 严重呼吸困难<br /> - 任何未控制的出血<br /> - 痉挛或癫痫发作<br /> - 面部或身体任何部位的突然迅速肿胀<br /> - 紧急事故后的烧伤和严重伤害<br />如果您出现以上任何症状，请拨打120医疗急救电话或前往急诊科。
      </DialogDescription>
      <div className="flex items-center space-x-2 mt-4">
        <Checkbox
          id="doNotShowAgain"
          checked={doNotShowAgain}
          onCheckedChange={(checked) => setDoNotShowAgain(checked)}
        />
        <label
          htmlFor="doNotShowAgain"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          不再显示
        </label>
      </div>
      <DialogFooter>
        <Button onClick={handleCloseDisclaimer} className="text-sm">
          我已阅读并同意
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default DisclaimerDialog;