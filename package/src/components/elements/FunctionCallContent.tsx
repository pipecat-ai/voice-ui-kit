import { cn } from "@/lib/utils";
import type {
  FunctionCallData,
  FunctionCallRenderer,
} from "@/types/conversation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckIcon,
  ChevronRightIcon,
  LoaderCircleIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";

interface FunctionCallContentProps {
  functionCall: FunctionCallData;
  /** Label for function call entries */
  functionCallLabel?: string;
  /** Custom renderer for function call messages. When provided, replaces the default rendering. */
  functionCallRenderer?: FunctionCallRenderer;
  classNames?: {
    container?: string;
  };
}

const StatusIcon: React.FC<{
  status: FunctionCallData["status"];
  cancelled?: boolean;
}> = ({ status, cancelled }) => {
  if (status === "completed" && cancelled) {
    return <XIcon size={14} className="text-destructive" />;
  }
  switch (status) {
    case "started":
    case "in_progress":
      return <LoaderCircleIcon size={14} className="animate-spin" />;
    case "completed":
      return <CheckIcon size={14} className="text-green-600" />;
  }
};

export const FunctionCallContent: React.FC<FunctionCallContentProps> = ({
  functionCall,
  functionCallLabel = "Function call",
  functionCallRenderer,
  classNames = {},
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (functionCallRenderer) {
    return <>{functionCallRenderer(functionCall)}</>;
  }

  const hasDetails =
    (functionCall.args && Object.keys(functionCall.args).length > 0) ||
    functionCall.result !== undefined;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn("flex flex-col gap-1", classNames.container)}>
        <CollapsibleTrigger asChild disabled={!hasDetails}>
          <button
            className={cn(
              "flex items-center gap-2 text-xs font-mono",
              "text-muted-foreground transition-colors",
              hasDetails && "hover:text-foreground cursor-pointer",
              !hasDetails && "cursor-default",
              "select-none",
            )}
          >
            {hasDetails && (
              <ChevronRightIcon
                size={14}
                className={cn(
                  "transition-transform duration-200",
                  isOpen && "rotate-90",
                )}
              />
            )}
            <StatusIcon
              status={functionCall.status}
              cancelled={functionCall.cancelled}
            />
            <span className="font-semibold">{functionCallLabel}</span>
            {functionCall.function_name && (
              <span className="text-muted-foreground">
                ({functionCall.function_name})
              </span>
            )}
          </button>
        </CollapsibleTrigger>

        {hasDetails && (
          <CollapsibleContent>
            <div
              className={cn(
                "pl-3 border-l-2 border-muted text-xs font-mono",
                "flex flex-col gap-2 mt-1",
                hasDetails && "ml-3.5",
              )}
            >
              {functionCall.args &&
                Object.keys(functionCall.args).length > 0 && (
                  <div>
                    <div className="font-semibold text-muted-foreground mb-1">
                      Arguments
                    </div>
                    <pre className="bg-muted/50 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                      {JSON.stringify(functionCall.args, null, 2)}
                    </pre>
                  </div>
                )}

              {functionCall.result !== undefined && (
                <div>
                  <div className="font-semibold text-muted-foreground mb-1">
                    Result
                  </div>
                  <pre className="bg-muted/50 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                    {typeof functionCall.result === "string"
                      ? functionCall.result
                      : JSON.stringify(functionCall.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
};
