import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Eye, Zap } from "lucide-react";

type OperationMode = "demo" | "shadow" | "live";

export function ModeSelector() {
  const [mode, setMode] = useState<OperationMode>("demo");

  const modes = [
    { 
      value: "demo", 
      label: "Demo", 
      icon: AlertCircle,
      color: "bg-muted text-muted-foreground",
      description: "Simulated portfolio"
    },
    { 
      value: "shadow", 
      label: "Shadow", 
      icon: Eye,
      color: "bg-accent/20 text-accent",
      description: "Read-only recommendations"
    },
    { 
      value: "live", 
      label: "Live", 
      icon: Zap,
      color: "bg-success/20 text-success",
      description: "Automated execution"
    },
  ];

  const currentMode = modes.find(m => m.value === mode);

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-xs text-muted-foreground">{currentMode?.description}</p>
      </div>
      <Tabs value={mode} onValueChange={(v) => setMode(v as OperationMode)}>
        <TabsList>
          {modes.map((m) => (
            <TabsTrigger key={m.value} value={m.value} className="gap-1.5">
              <m.icon className="h-3.5 w-3.5" />
              {m.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}