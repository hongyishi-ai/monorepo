import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";

const FloatingModule = ({ isVisible, children }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.5
            }
          }}
          exit={{ 
            opacity: 0, 
            y: -20, 
            scale: 0.95,
            transition: {
              duration: 0.2
            }
          }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md"
        >
          <Card className="shadow-lg backdrop-blur-sm bg-white/90">
            <CardContent className="p-4">
              {children}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingModule;