// TopBar.jsx
import React, { useState } from 'react';
import { useMediaQuery } from '../hooks/use-media-query';
import { ModeToggle } from './mode-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Menu, ChevronsUpDown, Check } from 'lucide-react';
import AuthorInfoCard from './AuthorInfoCard';
import TechnicalDocumentation from './TechnicalDocumentation';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu"
import { Button } from "./ui/button"
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { cn } from "../lib/utils"
import diagnoses from '../data/diagnoses';
import { ClinicalGuidelineAccordion } from './ClinicalGuidelineAccordion'; // 引入临床指南组件
import DoctorsSpeakSheet from './DoctorsSpeakSheet'; // 引入医生有话说组件

// 引入“立即开始”和“常见问题”的内容组件
import UserManualContent from './UserManualContent';
import FAQContent from './FAQContent';
import IntroductionContent from './IntroductionContent'; // 确保路径正确

// 引入诊断组件
import ColdDiagnosis from './ColdDiagnosis';
import DiarrheaDiagnosis from './DiarrheaDiagnosis';
import DigestiveDiagnosis from './DigestiveDiagnosis';
import DiagnosisFlow from './DiagnosisFlow';
import DiagnosisFlow1 from './DiagnosisFlow1';

// 引入 Tabs 组件
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

const knowledgeBase = [
  {
    title: "诊断思维链",
    href: "#",
    description: "了解医生诊断过程中的思维链条",
  },
  {
    title: "临床指南汇编",
    href: "#",
    description: "汇集各类临床指南，帮助医生决策",
  },
  {
    title: "常见症状图谱",
    href: "#",
    description: "提供常见症状的详细图谱",
  },
  {
    title: "医生有话说",
    href: "#",
    description: "医生分享的经验和见解",
    onClick: () => setIsDoctorsSpeakOpen(true),
  },
];

const TopBar = () => {
  const isMobile = useMediaQuery("(max-width: 767px)"); // 确保这里的查询条件正确
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isAuthorInfoOpen, setIsAuthorInfoOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isGuidelineOpen, setIsGuidelineOpen] = useState(false); // 新增状态管理临床指南sidesheet
  const [isDoctorsSpeakOpen, setIsDoctorsSpeakOpen] = useState(false);

  // 新增状态变量用于通用侧边栏
  const [activeSidebar, setActiveSidebar] = useState(null); // 'manual'、'faq' 或 'introduction'

  // 新增状态变量用于控制诊断 Sheet
  const [isDiagnosisSheetOpen, setIsDiagnosisSheetOpen] = useState(false);

  // 新增状态变量用于选择当前显示的诊断组件
  const [activeDiagnosis, setActiveDiagnosis] = useState('cold');

  const handleDiagnosisSelect = (value) => {
    setSelectedDiagnosis(value);
    setIsPopoverOpen(false); // 关闭 Popover
  };

  const renderDiagnosisSelector = () => {
    const commonContent = (
      <Command className="max-h-[300px] overflow-y-auto">
        <CommandInput placeholder="搜索思维链..." />
        <CommandList>
          <CommandEmpty>未找到诊断。</CommandEmpty>
          <CommandGroup>
            {diagnoses.map((diagnosis) => (
              <CommandItem
                key={diagnosis.value}
                value={diagnosis.value}
                onSelect={(currentValue) => {
                  handleDiagnosisSelect(currentValue);
                  setIsPopoverOpen(false); // 选择后关闭 Popover
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedDiagnosis === diagnosis.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {diagnosis.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    );

    if (isDesktop) {
      return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isPopoverOpen}
              className="w-[200px] justify-between"
            >
              {selectedDiagnosis
                ? diagnoses.find((diagnosis) => diagnosis.value === selectedDiagnosis)?.label
                : "想学习什么..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            {commonContent}
          </PopoverContent>
        </Popover>
      );
    } else {
      return (
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-[200px] justify-between"
            >
              {selectedDiagnosis
                ? diagnoses.find((diagnosis) => diagnosis.value === selectedDiagnosis)?.label
                : "想了解什么..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <div className="mt-0 border-t-0 p-4 pt-0">
              {commonContent}
            </div>
          </SheetContent>
        </Sheet>
      );
    }
  };

  return (
    <>
      <div className="flex justify-between items-center py-3 px-6 bg-gradient-to-r from-[#93F9B9] to-[#1D976C] dark:from-[#4A5568] dark:to-[#2D3748] z-10 shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="logo">
            <img src="/images/your-logo.png" alt="您的 LOGO" className="h-10 w-10" />
          </div>
          {!isMobile && (
            <h1 className="text-xl font-bold text-white">红医师预览版</h1>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-white hover:bg-white/10">快速入门</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-6 items-center w-[250px] md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                          href="#"
                          onClick={(e) => {
                            e.preventDefault(); // 防止默认链接行为
                            setIsDiagnosisSheetOpen(true); // 打开诊断 Sheet
                          }}
                        >
                          <div className="mb-2 mt-4 text-lg font-medium">
                            红医师基层门诊辅助决策系统
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            为基层医疗机构提供智能化的诊断和用药建议。
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    {/* 修改“项目介绍”的 ListItem */}
                    <ListItem 
                      href="#"
                      title="项目介绍"
                      onClick={(e) => {
                        e.preventDefault(); // 防止默认链接行为
                        setActiveSidebar('introduction');
                      }}
                    >
                      了解系统的基本功能和使用方法。
                    </ListItem>
                    {/* 修改“立即开始”的 ListItem */}
                    <ListItem 
                      href="#"
                      title="立即开始"
                      onClick={(e) => {
                        e.preventDefault(); // 防止默认链接行为
                        setActiveSidebar('manual');
                      }}
                    >
                      如何开始使用系统进行诊断和用药推荐。
                    </ListItem>
                    {/* 修改“常见问题”的 ListItem */}
                    <ListItem 
                      href="#"
                      title="常见问题"
                      onClick={(e) => {
                        e.preventDefault(); // 防止默认链接行为
                        setActiveSidebar('faq');
                      }}
                    >
                      解答使用过程中的常见疑问。
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-white hover:bg-white/10">知识库</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[250px] gap-3 p-4 item-center md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {knowledgeBase.map((item) => (
                      <ListItem
                        key={item.title}
                        title={item.title}
                        href={item.href}
                        onClick={() => {
                          if (item.title === "诊断思维链") {
                            setIsSheetOpen(true);
                          } else if (item.title === "临床指南汇编") {
                            setIsGuidelineOpen(true);
                          } else if (item.title === "医生有话说") {
                            setIsDoctorsSpeakOpen(true);
                          } else if (item.onClick) {
                            item.onClick();
                          }
                        }}
                      >
                        {item.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setIsAuthorInfoOpen(true)}>作者信息</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsHelpOpen(true)}>技术文档</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <AuthorInfoCard isOpen={isAuthorInfoOpen} onClose={() => setIsAuthorInfoOpen(false)} />
      <TechnicalDocumentation isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      
      {/* 临床指南汇编sidesheet */}
      <Sheet open={isGuidelineOpen} onOpenChange={setIsGuidelineOpen}>
        <SheetContent side="top" className="w-full h-screen p-0">
          <div className="flex flex-col h-full p-6 overflow-hidden">
            <h2 className="text-2xl font-bold mb-4">临床指南汇编</h2>
            <div className="flex-grow overflow-auto">
              <ClinicalGuidelineAccordion />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* 诊断思维链sidesheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="top" className="w-full h-screen p-0">
          <div className="flex flex-col h-full p-6 overflow-hidden">
            <h2 className="text-2xl font-bold mb-4">诊断思维链</h2>
            <div className="mb-4">
              {renderDiagnosisSelector()}
            </div>
            {selectedDiagnosis && (
              <div className="flex-grow overflow-auto">
                <img
                  src={`/images/DiagnosisFlowchart/${selectedDiagnosis}.svg`}
                  alt={`${selectedDiagnosis}诊断思维链`}
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* 医生有话说sidesheet */}
      <DoctorsSpeakSheet isOpen={isDoctorsSpeakOpen} onOpenChange={setIsDoctorsSpeakOpen} />

      {/* 通用侧边栏 */}
      <Sheet open={activeSidebar !== null} onOpenChange={(open) => {
        if (!open) setActiveSidebar(null);
      }}>
        <SheetContent side="top" className="w-full h-screen p-0">
          <div className="flex flex-col h-full p-6 overflow-auto">
            {/* 根据 activeSidebar 渲染不同的内容 */}
            {activeSidebar === 'manual' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold"></h2>
                </div>
                <UserManualContent />
              </>
            )}
            {activeSidebar === 'faq' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">常见问题</h2>
                </div>
                <FAQContent />
              </>
            )}
            {activeSidebar === 'introduction' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">项目介绍</h2>
                </div>
                {/* 如果有独立的 IntroductionContent 组件，可以在此引用 */}
                <IntroductionContent />
                {/* 如果仅需显示图片，可以直接在此嵌入 */}
                <div className="flex-grow overflow-auto">
                  <img
                    src="/images/全平台展示.png"
                    alt="项目介绍"
                    className="w-full h-auto"
                  />
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* 新增：诊断流程的 Sheet */}
      <Sheet open={isDiagnosisSheetOpen} onOpenChange={setIsDiagnosisSheetOpen}>
        <SheetContent side="top" className="w-full h-screen overflow-hidden flex flex-col">
          <div className="flex flex-col h-full">
            <div className="p-6 flex-shrink-0">
              <h2 className="text-2xl font-bold mb-4">红医师辅助诊断</h2>
              <Tabs value={activeDiagnosis} onValueChange={setActiveDiagnosis}>
                <TabsList className="mb-4">
                  <TabsTrigger value="cold">感冒</TabsTrigger>
                  <TabsTrigger value="diarrhea">腹泻</TabsTrigger>
                  <TabsTrigger value="digestive">消化科</TabsTrigger>
                  <TabsTrigger value="Flow">流程</TabsTrigger>
                  <TabsTrigger value="Flow1">流程总</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex-grow overflow-y-auto">
              <div className="px-6 pb-32"> {/* 增加底部 padding，为固定按钮留出空间 */}
                <Tabs value={activeDiagnosis}>
                  <TabsContent value="cold" className="mt-0">
                    <ColdDiagnosis />
                  </TabsContent>
                  <TabsContent value="diarrhea" className="mt-0">
                    <DiarrheaDiagnosis />
                  </TabsContent>
                  <TabsContent value="digestive" className="mt-0">
                    <DigestiveDiagnosis />
                  </TabsContent>
                  <TabsContent value="Flow" className="mt-0">
                    <DiagnosisFlow />
                  </TabsContent>
                  <TabsContent value="Flow1" className="mt-0">
                    <DiagnosisFlow1 />
                  </TabsContent>

                </Tabs>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

const ListItem = React.forwardRef(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={`block select-none space-y-2 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${className}`}
          {...props}
        >
          <div className="text-base font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
});

ListItem.displayName = "ListItem";

export default TopBar;
