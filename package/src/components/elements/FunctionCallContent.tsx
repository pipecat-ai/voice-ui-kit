import type { NestedFunctionCall } from "@/lib/functionCalls";
import { cn } from "@/lib/utils";
import type {
  FunctionCallData,
  FunctionCallRenderer,
} from "@pipecat-ai/client-react";
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
  /**
   * Function calls that ran as part of this one, rendered indented below it.
   * See `nestFunctionCalls` for how they are grouped.
   */
  nestedCalls?: NestedFunctionCall[];
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
  nestedCalls = [],
  classNames = {},
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Nested calls stay visible regardless of whether the parent's details are
  // expanded, so a child that is still running shows its spinner.
  const nested = nestedCalls.length > 0 && (
    <div className="ml-3.5 pl-3 border-l-2 border-muted flex flex-col gap-1">
      {nestedCalls.map((child, index) => (
        <FunctionCallContent
          key={child.functionCall.tool_call_id ?? index}
          functionCall={child.functionCall}
          functionCallLabel={functionCallLabel}
          functionCallRenderer={functionCallRenderer}
          nestedCalls={child.children}
        />
      ))}
    </div>
  );

  if (functionCallRenderer) {
    return (
      <>
        {functionCallRenderer(functionCall)}
        {nested}
      </>
    );
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
            {nestedCalls.length > 0 && (
              <span className="text-muted-foreground">
                · {nestedCalls.length} nested{" "}
                {nestedCalls.length === 1 ? "call" : "calls"}
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

        {nested}
      </div>
    </Collapsible>
  );
};
