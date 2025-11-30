import { Card, CardBody, CardHeader, Chip } from "@heroui/react";

export default function MehSummaryCard() {
  const topMehZones = [
    { name: "Woodlands", score: 8.2, trend: "up" },
    { name: "Jurong West", score: 7.8, trend: "stable" },
    { name: "Tampines", score: 7.5, trend: "down" },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold">Top Meh Zones</h3>
      </CardHeader>
      <CardBody className="gap-3">
        {topMehZones.map((zone) => (
          <div key={zone.name} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{zone.name}</p>
              <p className="text-sm text-gray-500">Score: {zone.score}/10</p>
            </div>
            <Chip
              size="sm"
              color={
                zone.trend === "up"
                  ? "success"
                  : zone.trend === "down"
                  ? "danger"
                  : "default"
              }
              variant="flat"
            >
              {zone.trend === "up" ? "↑" : zone.trend === "down" ? "↓" : "→"}
            </Chip>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
