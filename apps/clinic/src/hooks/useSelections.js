import { useState } from 'react';

export const useSelections = () => {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [selectedDosageForms, setSelectedDosageForms] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState([]);

  const handleSymptomSelect = (symptom) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const handleDiagnosisSelect = (diagnosis) => {
    setSelectedDiagnoses(prev => 
      prev.includes(diagnosis) ? prev.filter(d => d !== diagnosis) : [...prev, diagnosis]
    );
  };

  const handleDosageFormSelect = (dosageForm) => {
    setSelectedDosageForms(prev => 
      prev.includes(dosageForm) ? prev.filter(d => d !== dosageForm) : [...prev, dosageForm]
    );
  };

  const handleIngredientSelect = (ingredient) => {
    setSelectedIngredients(prev =>
      prev.includes(ingredient)
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  const resetSelections = () => {
    setSelectedSymptoms([]);
    setSelectedDosageForms([]);
    setSelectedIngredients([]);
    setSelectedDiagnoses([]);
  };

  return {
    selectedSymptoms,
    selectedDosageForms,
    selectedIngredients,
    selectedDiagnoses,
    handleSymptomSelect,
    handleDosageFormSelect,
    handleIngredientSelect,
    handleDiagnosisSelect,
    resetSelections,
    setSelectedDosageForms,
    setSelectedIngredients
  };
};