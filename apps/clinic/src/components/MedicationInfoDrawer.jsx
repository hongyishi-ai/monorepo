import React from 'react';
import { motion } from 'framer-motion';
import MedicationInfo from './MedicationInfo';

const MedicationInfoDrawer = ({ medication, combination, isOpen, onClose }) => {
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50" 
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg p-4 
                     max-h-[80vh] overflow-y-auto
                     sm:max-w-md sm:mx-auto sm:my-8 sm:relative sm:rounded-lg
                     md:max-w-lg
                     lg:max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="关闭"
            >
              ×
            </button>
            
            {medication ? (
              <MedicationInfo medication={medication} />
            ) : combination ? (
              <div className="space-y-4">
                <h3 className="font-bold text-lg mb-2">联合用药信息</h3>
                {combination.map((med, index) => (
                  <div key={med.id} className="p-4 bg-gray-50 rounded-lg">
                    <MedicationInfo medication={med} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">
                请先选择药品或推荐组合以查看详细信息
              </p>
            )}
          </motion.div>
        </div>
      )}
    </>
  );
};

export default MedicationInfoDrawer;