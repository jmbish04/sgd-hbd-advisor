import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";
import { Card } from "@heroui/react";
import "leaflet/dist/leaflet.css";

// Sample HDB estates data (replace with real data from your API)
const sampleEstates = [
  { name: "Jurong West", lat: 1.34, lng: 103.7, score: 7.8, avgPrice: 420000 },
  { name: "Woodlands", lat: 1.44, lng: 103.79, score: 8.2, avgPrice: 450000 },
  { name: "Tampines", lat: 1.35, lng: 103.94, score: 7.5, avgPrice: 480000 },
  { name: "Bedok", lat: 1.32, lng: 103.93, score: 6.9, avgPrice: 490000 },
  { name: "Ang Mo Kio", lat: 1.37, lng: 103.85, score: 7.2, avgPrice: 460000 },
];

export default function MehMap() {
  const center: [number, number] = [1.3521, 103.8198]; // Singapore coordinates

  return (
    <Card className="h-full overflow-hidden">
      <MapContainer
        center={center}
        zoom={11}
        style={{ height: "100%", width: "100%", minHeight: "400px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {sampleEstates.map((estate) => (
          <Circle
            key={estate.name}
            center={[estate.lat, estate.lng]}
            radius={1000}
            pathOptions={{
              color: estate.score > 7.5 ? "#22c55e" : estate.score > 7 ? "#f59e0b" : "#ef4444",
              fillColor: estate.score > 7.5 ? "#22c55e" : estate.score > 7 ? "#f59e0b" : "#ef4444",
              fillOpacity: 0.4,
            }}
          >
            <Popup>
              <div className="text-sm">
                <h3 className="font-semibold">{estate.name}</h3>
                <p>Meh Score: {estate.score}/10</p>
                <p>Avg Price: ${estate.avgPrice.toLocaleString()}</p>
              </div>
            </Popup>
          </Circle>
        ))}
      </MapContainer>
    </Card>
  );
}
