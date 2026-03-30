import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import MedicationInfo from './MedicationInfo';

const MedicationInfoCard = ({ selectedMedication, selectedCombination }) => {
  return (
    <Card className="md:col-span-4">
      <CardHeader>
        <CardTitle>药品信息</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          {selectedMedication ? (
            <MedicationInfo medication={selectedMedication} />
          ) : selectedCombination ? (
            <div>
              <h3 className="font-bold text-lg mb-2">联合用药信息</h3>
              {selectedCombination.map((med, index) => (
                <MedicationInfo key={med.id} medication={med} />
              ))}
            </div>
          ) : (
            <p>请先选择药品或推荐组合以查看详细信息</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MedicationInfoCard;