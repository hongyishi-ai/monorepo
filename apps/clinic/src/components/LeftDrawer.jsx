import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Drawer from "./Drawer";
import AutocompleteSearch from "./AutocompleteSearch";
import MedicationCatalog from "./MedicationCatalog";

const LeftDrawer = ({
  isOpen,
  onClose,
  isMobile,
  medicationsData,
  searchTerm,
  setSearchTerm,
  handleMedicationSelect,
}) => {
  const [activeTab, setActiveTab] = useState("category");

  const renderDrawerCloseButton = (onClose, side) => (
    <Button
      onClick={onClose}
      className={`fixed bottom-4 ${
        side === "left" ? "left-[20px]" : "right-4"
      } z-[9999] rounded-full p-2 bg-white shadow-md hover:bg-gray-100 transition-colors duration-200`}
      size="icon"
    >
      <X className="h-6 w-6" />
    </Button>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      className="w-full sm:w-3/4 md:w-1/2 lg:w-1/3 xl:w-1/4 text-base"
    >
      <div className="flex flex-col h-full">
        {isMobile && isOpen && renderDrawerCloseButton(onClose, "left")}
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
  );
};

export default LeftDrawer;