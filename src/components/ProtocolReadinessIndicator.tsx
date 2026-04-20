/**
 * Protocol Readiness Indicator
 * Shows adapter readiness status in UI
 */

import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Eye, 
  Zap, 
  AlertCircle 
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProtocolReadinessIndicatorProps {
  readiness: "demo" | "shadow" | "live";
  blockingIssues?: string[];
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ProtocolReadinessIndicator({
  readiness,
  blockingIssues = [],
  showLabel = true,
  size = "md",
}: ProtocolReadinessIndicatorProps) {
  const getReadinessConfig = () => {
    switch (readiness) {
      case "demo":
        return {
          icon: Shield,
          label: "Demo Only",
          color: "bg-amber-500/10 text-amber-500 border-amber-500/50",
          description: "Adapter uses placeholder data. Safe for testing only.",
        };
      case "shadow":
        return {
          icon: Eye,
          label: "Shadow Ready",
          color: "bg-blue-500/10 text-blue-500 border-blue-500/50",
          description: "Adapter uses real data for reads. No live execution yet.",
        };
      case "live":
        return {
          icon: Zap,
          label: "Live Ready",
          color: "bg-green-500/10 text-green-500 border-green-500/50",
          description: "Adapter fully tested and approved for live execution.",
        };
    }
  };

  const config = getReadinessConfig();
  const Icon = config.icon;
  
  const iconSize = size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5";
  const textSize = size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base";

  const badgeContent = (
    <Badge variant="outline" className={`${config.color} gap-1 ${textSize}`}>
      <Icon className={iconSize} />
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );

  if (blockingIssues.length === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badgeContent}
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium mb-1">{config.label}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            {badgeContent}
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-medium mb-1">{config.label}</p>
          <p className="text-xs text-muted-foreground mb-2">{config.description}</p>
          <div className="text-xs">
            <p className="font-medium text-amber-500 mb-1">Blocking Issues:</p>
            <ul className="list-disc ml-4 space-y-1">
              {blockingIssues.map((issue, idx) => (
                <li key={idx} className="text-muted-foreground">{issue}</li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}