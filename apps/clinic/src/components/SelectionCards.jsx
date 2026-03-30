// src/components/SelectionCards.jsx

import React from "react";
import SelectionCard from "./SelectionCard";
import diagnosisCategories from '../data/diagnosisCategories';
import indicationCategories from '../data/indicationCategories';

const SelectionCards = ({
  selectedSymptoms,
  selectedDiagnoses,
  selectedDosageForms,
  handleSymptomSelect,
  handleDiagnosisSelect,
  handleDosageFormSelect,
  availableDosageForms,
  medicationsData,
}) => {
  // 计算唯一症状和诊断
  const uniqueSymptoms = Array.from(
    new Set(
      medicationsData.flatMap((med) => med.indications).filter(Boolean)
    )
  ).sort();

  const uniqueDiagnoses = Array.from(
    new Set(
      medicationsData.flatMap((med) => med.diagnosis).filter(Boolean)
    )
  ).sort();

  const isDosageFormDisabled =
    selectedSymptoms.length === 0 && selectedDiagnoses.length === 0;

  return (
    <div className="space-y-4">
      <SelectionCard
        buttonLabel="选择诊断"
        items={uniqueDiagnoses}
        selectedItems={selectedDiagnoses}
        onItemSelect={handleDiagnosisSelect}
        type="诊断"
        categories={diagnosisCategories} // 传递诊断分类
      />
      <SelectionCard
        buttonLabel="选择症状"
        items={uniqueSymptoms}
        selectedItems={selectedSymptoms}
        onItemSelect={handleSymptomSelect}
        type="症状"
        categories={indicationCategories} // 传递症状分类
      />
      <SelectionCard
        buttonLabel="选择剂型"
        items={availableDosageForms}
        selectedItems={selectedDosageForms}
        onItemSelect={handleDosageFormSelect}
        isDisabled={isDosageFormDisabled}
        type="剂型"
        // 剂型不需要分类，不传递 categories
      />
    </div>
  );
};

export default SelectionCards;