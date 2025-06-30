import React, { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CopyCheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div
      className={cn(
        "vkui:flex vkui:items-center vkui:overflow-hidden vkui:w-full",
        className,
      )}
    >
      <span className="vkui:truncate vkui:min-w-0">{text}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="vkui:flex-none"
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
