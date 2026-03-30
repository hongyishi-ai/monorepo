export const findCombinedRecommendations = (medications, symptoms, dosageForms, ingredients, diagnoses) => {
  let validCombinations = [];
  
  for (let i = 1; i <= medications.length; i++) {
    const combinations = getCombinations(medications, i);
    for (const combo of combinations) {
      const comboSymptoms = new Set(combo.flatMap(med => med.indications));
      const comboDosageForms = new Set(combo.map(med => med.dosageForm));
      const comboIngredients = new Set(combo.map(med => med.ingredient));
      const comboDiagnoses = new Set(combo.flatMap(med => med.diagnosis));
      
      if (
        symptoms.every(s => comboSymptoms.has(s)) &&
        diagnoses.every(d => comboDiagnoses.has(d)) &&
        (dosageForms.length === 0 || dosageForms.some(d => comboDosageForms.has(d))) &&
        (ingredients.length === 0 || ingredients.some(i => comboIngredients.has(i)))
      ) {
        validCombinations.push(combo);
      }
    }
    if (validCombinations.length > 0) break;
  }

  validCombinations.sort((a, b) => getSymptomOverlap(a) - getSymptomOverlap(b));
  return validCombinations.slice(0, 3);
};

const getCombinations = (array, size) => {
  const result = [];
  function combine(start, combo) {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < array.length; i++) {
      combo.push(array[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }
  combine(0, []);
  return result;
};

const getSymptomOverlap = (medications) => {
  const symptomSets = medications.map(med => new Set(med.indications));
  let overlap = 0;
  for (let i = 0; i < symptomSets.length; i++) {
    for (let j = i + 1; j < symptomSets.length; j++) {
      overlap += new Set([...symptomSets[i]].filter(x => symptomSets[j].has(x))).size;
    }
  }
  return overlap;
};

export const filterMedications = (medications, symptoms, dosageForms, ingredients, diagnoses) => {
  const filteredMedications = medications.filter(med =>
    (symptoms.length === 0 || symptoms.every(symptom => med.indications.includes(symptom))) &&
    (diagnoses.length === 0 || diagnoses.every(diagnosis => med.diagnosis.includes(diagnosis))) &&
    (dosageForms.length === 0 || dosageForms.includes(med.dosageForm)) &&
    (ingredients.length === 0 || ingredients.includes(med.ingredient))
  );

  const newAvailableDosageForms = Array.from(new Set(filteredMedications.map(med => med.dosageForm)));
  const newAvailableIngredients = Array.from(new Set(filteredMedications.map(med => med.ingredient)));

  return { filteredMedications, newAvailableDosageForms, newAvailableIngredients };
};