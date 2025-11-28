import { Button } from "@heroui/react";
import { useCurrency } from "../../context/CurrencyContext";

export default function CurrencyToggle() {
  const { currency, toggle, rate } = useCurrency();
  const flag = currency === "SGD" ? "🇸🇬" : "🇺🇸";
  const nextFlag = currency === "SGD" ? "🇺🇸" : "🇸🇬";

  return (
    <div className="relative group">
      <Button
        onPress={toggle}
        size="sm"
        variant="flat"
        color="primary"
        className="font-semibold flex items-center gap-2 transition-all"
      >
        <span className="text-xl">{flag}</span>
        <span className="text-sm">{currency}</span>
        <span className="text-xs opacity-60">→ {nextFlag}</span>
      </Button>
      <div className="absolute top-full mt-1 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        1 SGD = {rate.toFixed(4)} USD
      </div>
    </div>
  );
}
