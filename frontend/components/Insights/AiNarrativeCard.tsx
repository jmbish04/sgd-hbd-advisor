import { Card, CardBody, CardHeader, Spinner, Chip } from "@heroui/react";
import { useState, useEffect } from "react";

export default function AiNarrativeCard() {
  const [narrative, setNarrative] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate AI narrative generation
    // In production, this would call your AI endpoint
    setTimeout(() => {
      setNarrative(
        "Based on current market trends, Woodlands and Jurong West show strong potential for capital appreciation. " +
        "These estates benefit from upcoming MRT developments and improved connectivity to the CBD. " +
        "Rental yields remain stable at 3.5-4%, making them attractive for both owner-occupiers and investors. " +
        "Consider 4-room flats in mature estates for balanced risk-reward profiles."
      );
      setLoading(false);
    }, 1500);
  }, []);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">AI Market Analysis</h3>
          <Chip size="sm" variant="flat" color="secondary">
            Powered by Gemini
          </Chip>
        </div>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
            <span className="ml-3 text-gray-500">Generating insights...</span>
          </div>
        ) : (
          <p className="text-gray-700 leading-relaxed">{narrative}</p>
        )}
      </CardBody>
    </Card>
  );
}
