// src/hooks/useRecommendations.js
import { useState, useEffect, useMemo } from 'react';
import { filterMedications, findCombinedRecommendations } from '../utils/medicationUtils';

export const useRecommendations = (medicationsData, selectedSymptoms, selectedDosageForms, selectedIngredients, selectedDiagnoses, isPreferenceEnabled) => {
  const [noPreferenceMatchWarning, setNoPreferenceMatchWarning] = useState(false);

  const { recommendedMedications, combinedRecommendations, availableDosageForms, availableIngredients } = useMemo(() => {
    const { filteredMedications, newAvailableDosageForms, newAvailableIngredients } = filterMedications(
      medicationsData,
      selectedSymptoms,
      selectedDosageForms,
      isPreferenceEnabled && selectedIngredients.length > 0 ? selectedIngredients : [],
      selectedDiagnoses
    );

    let combined = [];
    if (filteredMedications.length === 0 && (selectedSymptoms.length > 0 || selectedDiagnoses.length > 0)) {
      combined = findCombinedRecommendations(
        medicationsData,
        selectedSymptoms,
        selectedDosageForms,
        isPreferenceEnabled && selectedIngredients.length > 0 ? selectedIngredients : [],
        selectedDiagnoses
      );
    }

    return {
      recommendedMedications: filteredMedications,
      combinedRecommendations: combined,
      availableDosageForms: newAvailableDosageForms,
      availableIngredients: newAvailableIngredients,
    };
  }, [medicationsData, selectedSymptoms, selectedDosageForms, selectedIngredients, selectedDiagnoses, isPreferenceEnabled]);

  useEffect(() => {
    if (isPreferenceEnabled && selectedIngredients.length > 0 && recommendedMedications.length === 0) {
      setNoPreferenceMatchWarning(true);
    } else {
      setNoPreferenceMatchWarning(false);
    }
  }, [isPreferenceEnabled, selectedIngredients, recommendedMedications]);

  return {
    recommendedMedications,
    combinedRecommendations,
    availableDosageForms,
    availableIngredients,
    noPreferenceMatchWarning,
  };
};