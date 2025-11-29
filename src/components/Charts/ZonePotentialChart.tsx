import { Card, CardBody, CardHeader } from "@heroui/react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ZonePotentialChart() {
  const data = {
    labels: ["Woodlands", "Jurong West", "Tampines", "Bedok", "Ang Mo Kio", "Sengkang"],
    datasets: [
      {
        label: "Potential Score",
        data: [8.2, 7.8, 7.5, 6.9, 7.2, 7.6],
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        ticks: {
          stepSize: 2,
        },
      },
    },
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold">Zone Potential Analysis</h3>
      </CardHeader>
      <CardBody>
        <div className="h-64">
          <Bar data={data} options={options} />
        </div>
      </CardBody>
    </Card>
  );
}
