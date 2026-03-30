import React, { useMemo, useCallback } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const MedicationCatalog = ({ medications, searchTerm, onMedicationSelect, activeTab }) => {
  // 使用 useCallback 优化事件处理函数
  const handleMedicationClick = useCallback((medication) => {
    onMedicationSelect(medication);
  }, [onMedicationSelect]);

  // 优化过滤逻辑
  const filteredMedications = useMemo(() => {
    if (!searchTerm) return medications;
    const searchTermLower = searchTerm.toLowerCase();
    return medications.filter(med => 
      med.name.toLowerCase().includes(searchTermLower) ||
      med.indications.some(indication => indication.toLowerCase().includes(searchTermLower)) ||
      med.diagnosis.some(diagnosis => diagnosis.toLowerCase().includes(searchTermLower)) ||
      med.dosageForm.toLowerCase().includes(searchTermLower)
    );
  }, [medications, searchTerm]);

  const groupedMedications = useMemo(() => {
    return filteredMedications.reduce((acc, med) => {
      const category = med.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(med);
      return acc;
    }, {});
  }, [filteredMedications]);

  const groupedByDiagnosis = useMemo(() => {
    return filteredMedications.reduce((acc, med) => {
      med.diagnosis.forEach(diagnosis => {
        if (!acc[diagnosis]) {
          acc[diagnosis] = [];
        }
        if (!acc[diagnosis].includes(med)) {
          acc[diagnosis].push(med);
        }
      });
      return acc;
    }, {});
  }, [filteredMedications]);

  const groupedByDosageForm = useMemo(() => {
    return filteredMedications.reduce((acc, med) => {
      const dosageForm = med.dosageForm;
      if (!acc[dosageForm]) {
        acc[dosageForm] = [];
      }
      acc[dosageForm].push(med);
      return acc;
    }, {});
  }, [filteredMedications]);

  const sortedCategories = Object.keys(groupedMedications).sort((a, b) => 
    a.localeCompare(b, 'zh-Hans-CN', { sensitivity: 'accent' })
  );

  const sortedDiagnosis = Object.keys(groupedByDiagnosis).sort((a, b) => 
    a.localeCompare(b, 'zh-Hans-CN', { sensitivity: 'accent' })
  );

  const sortedDosageForms = Object.keys(groupedByDosageForm).sort((a, b) => 
    a.localeCompare(b, 'zh-Hans-CN', { sensitivity: 'accent' })
  );

  const renderMedicationList = useCallback((medications) => (
    <ul>
      {medications
        .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN', { sensitivity: 'accent' }))
        .map((medication) => (
          <li key={medication.id || medication.name}>
            <Button
              variant="link"
              onClick={() => handleMedicationClick(medication)}
              className="text-left w-full hover:bg-gray-100 transition-colors"
            >
              {medication.name}
            </Button>
          </li>
        ))}
    </ul>
  ), [handleMedicationClick]);

  return (
    <div>
      {activeTab === 'category' && (
        <Accordion type="single" collapsible className="w-full">
          {sortedCategories.map((category, index) => (
            <AccordionItem value={`item-${index}`} key={index}>
              <AccordionTrigger>{category}</AccordionTrigger>
              <AccordionContent>
                {renderMedicationList(groupedMedications[category])}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
      {activeTab === 'diagnosis' && (
        <Accordion type="single" collapsible className="w-full">
          {sortedDiagnosis.map((diagnosis, index) => (
            <AccordionItem value={`diagnosis-${index}`} key={index}>
              <AccordionTrigger>{diagnosis}</AccordionTrigger>
              <AccordionContent>
                {renderMedicationList(groupedByDiagnosis[diagnosis])}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
      {activeTab === 'dosageForm' && (
        <Accordion type="single" collapsible className="w-full">
          {sortedDosageForms.map((dosageForm, index) => (
            <AccordionItem value={`dosageForm-${index}`} key={index}>
              <AccordionTrigger>{dosageForm}</AccordionTrigger>
              <AccordionContent>
                {renderMedicationList(groupedByDosageForm[dosageForm])}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default MedicationCatalog;