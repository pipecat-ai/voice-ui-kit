import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CopyCheckIcon, CopyIcon } from "lucide-react";
import React, { useState } from "react";

interface CopyTextProps {
  className?: string;
  iconSize?: number;
  text: string;
}

export const CopyText: React.FC<CopyTextProps> = ({
  text,
  iconSize = 16,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className={cn("flex items-center overflow-hidden w-full", className)}>
      <span className="truncate min-w-0">{text}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              isIcon
              size="sm"
              className="flex-none text-muted-foreground"
              onClick={copyToClipboard}
              aria-label="Copy to clipboard"
            >
              {copied ? (
                <CopyCheckIcon size={iconSize} />
              ) : (
                <CopyIcon size={iconSize} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {copied ? "Copied!" : "Copy to clipboard"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default CopyText;
