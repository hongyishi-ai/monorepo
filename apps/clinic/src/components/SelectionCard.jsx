// src/components/SelectionCard.jsx

import React, { useMemo, useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Activity, Tablets, Microscope, X } from "lucide-react";

// 分类处理函数
const categorizeItems = (items, categories) => {
  const categorizedItems = { ...categories };
  const allCategorizedItems = new Set(Object.values(categories).flat());

  // 找出未分类的项
  const otherItems = items.filter((item) => !allCategorizedItems.has(item));

  if (otherItems.length > 0) {
    categorizedItems["其他"] = otherItems;
  }

  return categorizedItems;
};

const SelectionCard = ({
  buttonLabel,
  items,
  selectedItems,
  onItemSelect,
  isDisabled = false,
  type,
  categories,
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [searchQuery, setSearchQuery] = useState("");

  const handleSelect = (value) => {
    onItemSelect(value);
  };

  // 获取对应的图标
  const getIcon = () => {
    switch (type) {
      case "诊断":
        return <Stethoscope className="mr-2 h-4 w-4" aria-hidden="true" />;
      case "症状":
        return <Activity className="mr-2 h-4 w-4" aria-hidden="true" />;
      case "剂型":
        return <Tablets className="mr-2 h-4 w-4" aria-hidden="true" />;
      case "成份":
        return <Microscope className="mr-2 h-4 w-4" aria-hidden="true" />;
      default:
        return null;
    }
  };

  const renderTriggerButton = () => (
    <Button
      variant="outline"
      className="text-base w-full flex items-center justify-center"
      disabled={isDisabled}
    >
      {getIcon()}
      {selectedItems.length > 0
        ? `已选择 ${selectedItems.length} 项`
        : buttonLabel}
    </Button>
  );

  // 处理分类
  const processedCategories = useMemo(
    () => categorizeItems(items, categories || {}),
    [items, categories]
  );

  // 处理搜索输入
  const handleSearchChange = (value) => {
    setSearchQuery(value);
  };

  // 根据搜索查询过滤分类和选项
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return processedCategories;

    const result = {};
    Object.entries(processedCategories).forEach(
      ([categoryName, categoryItems]) => {
        const filteredItems = categoryItems.filter((item) =>
          item.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filteredItems.length > 0) {
          result[categoryName] = filteredItems;
        }
      }
    );
    return result;
  }, [searchQuery, processedCategories]);

  // 渲染内容
  const renderContent = () => (
    <Command>
      <CommandInput
        placeholder={`搜索...`}
        value={searchQuery}
        onValueChange={handleSearchChange}
      />
      <CommandList className="max-h-[300px] overflow-auto">
        <CommandEmpty>无匹配结果。</CommandEmpty>
        {Object.entries(filteredCategories).map(
          ([categoryName, categoryItems]) => (
            <CommandGroup key={categoryName}>
              {/* 分类标题 */}
              <div className="top-0 bg-white z-10 px-2 py-1 border-t">
                <h3 className="font-bold">{categoryName}</h3>
              </div>
              {/* 子选项列表 */}
              {categoryItems.map((item, index) => (
                <CommandItem
                  key={`${item}-${index}`}
                  value={item}
                  onSelect={() => handleSelect(item)}
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item)}
                    readOnly
                    className="mr-2"
                  />
                  {item}
                </CommandItem>
              ))}
            </CommandGroup>
          )
        )}
      </CommandList>
    </Command>
  );

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 py-3 space-y-3">
      <div className="flex items-center justify-between mb-0">
        {isDesktop ? (
          <Popover>
            <PopoverTrigger asChild>{renderTriggerButton()}</PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              {renderContent()}
            </PopoverContent>
          </Popover>
        ) : (
          <Drawer>
            <DrawerTrigger asChild>{renderTriggerButton()}</DrawerTrigger>
            <DrawerContent>
              <div className="mt-0 border-t-0 p-4 pt-0">{renderContent()}</div>
            </DrawerContent>
          </Drawer>
        )}
      </div>
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap mt-2">
          {selectedItems.map((item, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="m-1 flex items-center cursor-pointer"
              onClick={() => onItemSelect(item)}
            >
              {item}
              <X className="ml-1 h-3 w-4" aria-hidden="true" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectionCard;
