import { UserAudioControl } from "@/components/elements";
import {
  PipecatAppBase,
  type PipecatBaseChildProps,
} from "@/components/PipecatAppBase";
import {
  Button,
  Card,
  CardContent,
  Divider,
  ErrorCard,
  Input,
  SpinLoader,
} from "@/components/ui";
import { usePipecatConnectionState } from "@/hooks";
import { cn } from "@/lib/utils";
import { TransportConnectionParams } from "@pipecat-ai/client-js";
import { ChevronDownIcon, SendIcon } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";

export interface WidgetTemplateProps {
  /**
   * The URL of the Pipecat server to connect to.
   */
  serverUrl?: string;
  /**
   * Debounce time in milliseconds for the send function.
   * @default 300
   */
  debounceTime?: number;

  /**
   * The label of the toggle button.
   * @default "Open"
   */
  toggleButtonLabel?: string;

  classNames?: {
    container?: string;
    toggleContainer?: string;
    toggleButton?: string;
    widgetContainer?: string;
  };

  connectParams?: TransportConnectionParams;
}

const TextInput = ({ debounceTime = 300 }: { debounceTime?: number }) => {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const { state } = usePipecatConnectionState();

  const handleSend = useCallback(() => {
    setIsSending(true);
    console.log(message);
    setMessage("");
    setIsSending(false);
  }, [message]);

  useEffect(() => {
    if (!message.trim()) return;

    const timeoutId = setTimeout(() => {
      handleSend();
    }, debounceTime);

    return () => clearTimeout(timeoutId);
  }, [message, debounceTime, handleSend]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  return (
    <div className="flex flex-row gap-2">
      <Input
        placeholder="Type message..."
        value={message}
        onChange={handleInputChange}
        disabled={isSending || state !== "connected"}
        className="flex-1"
        size="lg"
      />
      <Button
        onClick={handleSend}
        disabled={isSending || state !== "connected"}
        isLoading={isSending}
        size="lg"
        isIcon
      >
        <SendIcon />
      </Button>
    </div>
  );
};

const WidgetPanel = (props: WidgetTemplateProps) => {
  return (
    <Card
      withGradientBorder
      className={cn(
        "w-full self-end justify-self-end max-w-md z-20 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        props.classNames?.widgetContainer,
      )}
      shadow="xlong"
      size="lg"
      rounded="xl"
    >
      <CardContent>
        <TextInput debounceTime={props.debounceTime} />
        <Divider size="md" />
        <UserAudioControl size="lg" />
      </CardContent>
    </Card>
  );
};

export const WidgetTemplate: React.FC<WidgetTemplateProps> = memo(
  ({ classNames, toggleButtonLabel = "Open", connectParams, ...rest }) => {
    const [isOpen, setIsOpen] = useState(false);

    const widgetComp = (
      <PipecatAppBase
        connectParams={connectParams || {}}
        transportType="smallwebrtc"
        noThemeProvider
        connectOnMount
      >
        {({ client, error }: PipecatBaseChildProps) => {
          return !client ? (
            <SpinLoader />
          ) : error ? (
            <ErrorCard>{error}</ErrorCard>
          ) : (
            <WidgetPanel {...rest} />
          );
        }}
      </PipecatAppBase>
    );

    return (
      <div
        className={cn("relative flex flex-col gap-4", classNames?.container)}
      >
        {isOpen && widgetComp}

        <Card
          rounded="xl"
          className={cn(
            "justify-self-end self-end z-20 duration-300 transition-discrete transition-all overflow-hidden",
            isOpen ? "shadow-xshort" : "shadow-xlong",
            classNames?.toggleContainer,
          )}
        >
          <CardContent>
            <Button
              onClick={() => setIsOpen(!isOpen)}
              isIcon={isOpen}
              size="lg"
              className={cn(classNames?.toggleButton)}
            >
              {isOpen ? <ChevronDownIcon /> : toggleButtonLabel}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  },
);
