import { Card, CardBody, CardHeader } from "@heroui/react";
import { useCurrency } from "../../context/CurrencyContext";

export default function KeyMetricsCard() {
  const { convert, currency } = useCurrency();

  const metrics = [
    {
      label: "Median HDB Price",
      value: convert(450000),
      change: "+2.3%",
      positive: true,
    },
    {
      label: "Rental Yield",
      value: "3.8%",
      change: "-0.2%",
      positive: false,
      isPercent: true,
    },
    {
      label: "Meh Zones Found",
      value: 12,
      change: "+3",
      positive: true,
      isCount: true,
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold">Key Metrics</h3>
      </CardHeader>
      <CardBody className="gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-1">
            <p className="text-sm text-gray-600">{metric.label}</p>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold">
                {metric.isCount
                  ? metric.value
                  : metric.isPercent
                  ? metric.value
                  : `${currency === "SGD" ? "S$" : "$"}${typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}`}
              </p>
              <span
                className={`text-sm ${
                  metric.positive ? "text-green-600" : "text-red-600"
                }`}
              >
                {metric.change}
              </span>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
