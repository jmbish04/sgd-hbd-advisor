import { Card } from "@heroui/react";
import MehMap from "../components/Map/MehMap";
import KeyMetricsCard from "../components/Insights/KeyMetricsCard";
import MehSummaryCard from "../components/Insights/MehSummaryCard";
import AiNarrativeCard from "../components/Insights/AiNarrativeCard";
import ZonePotentialChart from "../components/Charts/ZonePotentialChart";
import RentalYieldTrendChart from "../components/Charts/RentalYieldTrendChart";

export function Landing() {
  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Singapore HDB Market Intelligence
        </h1>
        <p className="text-gray-600 text-sm mt-2">
          A live analytical view of undervalued HDB estates ("Meh Zones") —
          integrating spatial, economic, and AI reasoning layers.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Map Section */}
        <div className="col-span-12 md:col-span-8">
           <div className="h-[500px]">
             <MehMap />
           </div>
        </div>

        {/* Metrics Side Panel */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
          <KeyMetricsCard />
          <MehSummaryCard />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-6">
          <ZonePotentialChart />
        </div>
        <div className="col-span-12 md:col-span-6">
          <RentalYieldTrendChart />
        </div>
      </div>

      {/* AI Analysis */}
      <AiNarrativeCard />
    </div>
  );
}
