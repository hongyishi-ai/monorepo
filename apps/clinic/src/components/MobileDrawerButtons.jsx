import React from 'react';
import { Button } from "@/components/ui/button";
import { Menu } from 'lucide-react';

const MobileDrawerButtons = ({ onLeftDrawerToggle, onRightDrawerToggle, isLeftDrawerOpen, isRightDrawerOpen }) => {
  return (
    <div className="fixed bottom-4 left-4 right-4 flex justify-between px-4 pointer-events-none">
      {!isLeftDrawerOpen && (
        <Button 
          onClick={onLeftDrawerToggle} 
          className="rounded-full p-2 bg-white shadow-lg pointer-events-auto"
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}
      {!isRightDrawerOpen && (
        <Button 
          onClick={onRightDrawerToggle} 
          className="rounded-full p-2 bg-white shadow-lg ml-auto pointer-events-auto"
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default MobileDrawerButtons;