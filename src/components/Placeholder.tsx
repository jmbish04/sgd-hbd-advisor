import { Card } from "@heroui/react";

export default function Placeholder({ title }: { title: string }) {
  return (
    <Card className="p-6 h-full min-h-[200px] flex items-center justify-center bg-gray-50 border-dashed border-2 border-gray-200">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-400">{title}</h3>
        <p className="text-xs text-gray-400">Component Pending Migration</p>
      </div>
    </Card>
  );
}
