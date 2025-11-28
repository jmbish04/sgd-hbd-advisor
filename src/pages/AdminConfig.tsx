import { Card, Input, Button, Switch } from "@heroui/react";
import { useState } from "react";

export default function AdminConfig() {
  const [config, setConfig] = useState({
    sgdataKey: "",
    aiModel: "@cf/meta/llama-3.1-8b-instruct",
    autoIngest: true,
  });

  const handleSave = () => {
    // TODO: Implement API call to save configuration
    console.log("Saving configuration:", config);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Admin Configuration</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage API keys, AI model settings, and data ingestion preferences
          </p>
        </div>

        <div className="space-y-4">
          <Input
            label="SGDATA API Key"
            type="password"
            placeholder="Enter your API key"
            value={config.sgdataKey}
            onChange={(e) => setConfig({ ...config, sgdataKey: e.target.value })}
            description="Your Singapore Data API key for HDB data access"
          />

          <Input
            label="AI Model"
            placeholder="Model identifier"
            value={config.aiModel}
            onChange={(e) => setConfig({ ...config, aiModel: e.target.value })}
            description="Cloudflare Workers AI model to use for analysis"
          />

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Automatic Ingestion</p>
              <p className="text-sm text-gray-500">
                Enable automatic data ingestion and updates
              </p>
            </div>
            <Switch
              isSelected={config.autoIngest}
              onValueChange={(checked) =>
                setConfig({ ...config, autoIngest: checked })
              }
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button color="primary" onPress={handleSave}>
            Save Configuration
          </Button>
          <Button variant="flat" onPress={() => console.log("Test connection")}>
            Test Connection
          </Button>
        </div>
      </Card>
    </div>
  );
}
