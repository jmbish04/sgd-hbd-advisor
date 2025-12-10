import { createContext, useContext, useState, useEffect } from "react";

type Currency = "SGD" | "USD";
interface CurrencyContextType {
  currency: Currency;
  rate: number;
  toggle: () => void;
  convert: (amount: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("SGD");
  const [rate, setRate] = useState(0.74);

  // Poll Worker endpoint every 30 min, simulate small ticks every 3 s
  useEffect(() => {
    async function fetchRate() {
      try {
        const res = await fetch("/api/fx");
        const data: any = await res.json() as { rate?: number };
        if (data?.rate) setRate(data.rate);
      } catch {
        console.warn("FX API fallback active");
      }
    }
    fetchRate();
    const fxInterval = setInterval(fetchRate, 1800000);
    const tick = setInterval(() => {
      setRate((r) => +(r + (Math.random() - 0.5) * 0.002).toFixed(4));
    }, 3000);
    return () => {
      clearInterval(fxInterval);
      clearInterval(tick);
    };
  }, []);

  const toggle = () => setCurrency((c) => (c === "SGD" ? "USD" : "SGD"));
  const convert = (amount: number) =>
    currency === "SGD" ? amount : +(amount * rate).toFixed(2);

  return (
    <CurrencyContext.Provider value={{ currency, rate, toggle, convert }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
