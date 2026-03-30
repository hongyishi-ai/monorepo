import React from 'react';
import { Badge } from "@/components/ui/badge";

const SelectedItemsDisplay = ({ selectedSymptoms, selectedDiagnoses }) => {
  return (
    <div className="flex flex-col space-y-2">
      <div>
        <span className="font-semibold mr-2">已选症状:</span>
        {selectedSymptoms.length > 0 ? (
          selectedSymptoms.map((symptom, index) => (
            <Badge key={index} variant="secondary" className="mr-1 mb-1">
              {symptom}
            </Badge>
          ))
        ) : (
          <span className="text-gray-500">无</span>
        )}
      </div>
      <div>
        <span className="font-semibold mr-2">已选诊断:</span>
        {selectedDiagnoses.length > 0 ? (
          selectedDiagnoses.map((diagnosis, index) => (
            <Badge key={index} variant="secondary" className="mr-1 mb-1">
              {diagnosis}
            </Badge>
          ))
        ) : (
          <span className="text-gray-500">无</span>
        )}
      </div>
    </div>
  );
};

export default SelectedItemsDisplay;