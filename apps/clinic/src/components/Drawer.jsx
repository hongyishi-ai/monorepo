// src/components/Drawer.jsx
import React from 'react';
import { motion } from 'framer-motion';

const Drawer = ({ children, isOpen, onClose, side = "left", className = "" }) => {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
          <motion.div
            initial={{ x: side === "left" ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: side === "left" ? '-100%' : '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`absolute top-0 ${side}-0 h-full bg-white shadow-lg ${className}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </>
  );
};

export default Drawer; // 添加默认导出