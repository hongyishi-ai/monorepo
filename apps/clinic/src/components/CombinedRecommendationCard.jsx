import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const CombinedRecommendationCard = ({ title, combinations, onSelect }) => {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          {combinations.map((combo, index) => (
            <div key={index} className="mb-4">
              <Button
                variant="link"
                onClick={() => onSelect(combo)}
                className="text-left font-bold"
              >
                推荐组合 {index + 1}:
              </Button>
              <ul>
                {combo.map(med => (
                  <li key={med.id}>{med.name}</li>
                ))}
              </ul>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CombinedRecommendationCard;