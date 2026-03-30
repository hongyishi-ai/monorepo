// src/components/RightDrawer.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, RotateCcw, Microscope } from "lucide-react";
import Drawer from "./Drawer";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer as MobileDrawer,
  DrawerContent as MobileDrawerContent,
  DrawerTrigger as MobileDrawerTrigger,
} from "@/components/ui/drawer";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const RightDrawer = ({
  isOpen,
  onClose,
  isMobile,
  availableIngredients,
  selectedIngredients,
  setSelectedIngredients,
  isPreferenceEnabled,
  setIsPreferenceEnabled,
  handleReset,
}) => {
  const [isIngredientDrawerOpen, setIsIngredientDrawerOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const renderDrawerCloseButton = () => (
    <Button
      onClick={onClose}
      className="fixed bottom-4 right-4 z-[9999] rounded-full p-2 bg-white shadow-md hover:bg-gray-100 transition-colors duration-200"
      size="icon"
    >
      <X className="h-6 w-6" />
    </Button>
  );

  const handlePreferenceChange = (checked) => {
    setIsPreferenceEnabled(checked);
    setSelectedIngredients([]);
    handleReset();
  };

  const handleIngredientSelect = (value) => {
    if (selectedIngredients.includes(value)) {
      setSelectedIngredients(selectedIngredients.filter((i) => i !== value));
    } else {
      setSelectedIngredients([...selectedIngredients, value]);
    }
  };

  const handleResetIngredients = () => {
    setSelectedIngredients([]);
  };

  // 渲染选择成份的按钮和内容
  const renderIngredientSelector = () => {
    const triggerButton = (
      <Button
        variant="outline"
        className={`w-full flex items-center justify-center ${
          !isPreferenceEnabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        disabled={!isPreferenceEnabled}
      >
        <Microscope className="mr-2 h-5 w-5" aria-hidden="true" />
        {selectedIngredients.length > 0
          ? `已选择 ${selectedIngredients.length} 项`
          : "选择成份"}
      </Button>
    );

    const content = (
      <Command>
        <CommandInput placeholder="搜索成份..." />
        <CommandList>
          <CommandEmpty>无匹配结果。</CommandEmpty>
          <CommandGroup>
            {availableIngredients.map((item, index) => (
              <CommandItem
                key={index}
                value={item}
                onSelect={() => handleIngredientSelect(item)}
              >
                <input
                  type="checkbox"
                  checked={selectedIngredients.includes(item)}
                  readOnly
                  className="mr-2"
                />
                {item}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    );

    if (isDesktop) {
      // 在 PC 端使用 Popover
      return (
        <Popover>
          <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            {content}
          </PopoverContent>
        </Popover>
      );
    } else {
      // 在移动端使用 Drawer
      return (
        <>
          <MobileDrawer
            isOpen={isIngredientDrawerOpen}
            onOpenChange={setIsIngredientDrawerOpen}
          >
            <MobileDrawerTrigger asChild>{triggerButton}</MobileDrawerTrigger>
            <MobileDrawerContent>
              <div className="p-4 pt-0">
                <h2 className="text-lg font-semibold mb-4">选择成份</h2>
                {content}
              </div>
            </MobileDrawerContent>
          </MobileDrawer>
        </>
      );
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      side="right"
      className="w-full sm:w-3/4 md:w-1/2 lg:w-1/3 xl:w-1/4 text-base"
    >
      {isMobile && isOpen && renderDrawerCloseButton()}
      <div className="p-4 pt-16">
        <h2 className="text-lg font-semibold mb-4">偏好设置</h2>
        <div className="flex items-center justify-between mb-4">
          <span>启用偏好</span>
          <Switch
            checked={isPreferenceEnabled}
            onCheckedChange={handlePreferenceChange}
          />
        </div>
        <div className="mb-4">
          {renderIngredientSelector()}
        </div>
        {isPreferenceEnabled && (
          <Button
            onClick={handleResetIngredients}
            className="mt-4 rounded-full p-3 bg-white shadow-md hover:bg-primary transition-colors duration-200 text-sm flex items-center justify-center"
            size="icon"
          >
            <RotateCcw className="h-5 w-5" aria-hidden="true" />
          </Button>
        )}
      </div>
    </Drawer>
  );
};

export default RightDrawer;