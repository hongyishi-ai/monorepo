import React from 'react';

const MedicationInfo = ({ medication }) => {
  const getAuthorityColor = (authority) => {
    switch (authority) {
      case 'OTC甲类':
        return 'bg-red-500 text-white dark:bg-red-700';
      case 'OTC乙类':
        return 'bg-green-500 text-white dark:bg-green-700';
      case '双跨药':
        return 'bg-yellow-500 text-black dark:bg-yellow-600 dark:text-white';
      case '处方药':
        return 'bg-gray-800 text-white dark:bg-gray-200 dark:text-black';
      default:
        return 'bg-blue-500 text-white dark:bg-blue-700';
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center mb-2">
        <h3 className="font-bold text-lg mr-2">{medication.name}</h3>
        <span className={`text-xs px-2 py-1 rounded ${getAuthorityColor(medication.authority)}`}>
          {medication.authority}
        </span>
      </div>
      <p><strong>剂型：</strong>{medication.dosageForm}</p>
      <p><strong>成分：</strong>{medication.ingredient}</p>
      <p><strong>分类：</strong>{medication.category}</p>
      {medication.diagnosis && medication.diagnosis.length > 0 && (
        <p><strong>适应症：</strong>{medication.diagnosis.join(', ')}</p>
      )}
      {medication.indications && medication.indications.length > 0 && (
        <p><strong>主治：</strong>{medication.indications.join(', ')}</p>
      )}
      <p><strong>用法用量：</strong>{medication.usageInstructions}</p>
      <p><strong>禁忌：</strong>{medication.contraindications}</p>
      <p><strong>不良反应：</strong>{medication.sideEffects}</p>
    </div>
  );
};

export default MedicationInfo;