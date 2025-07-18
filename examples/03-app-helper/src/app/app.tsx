import {
  Card,
  CardContent,
  CardHeader,
  ConnectButton,
  FullScreenContainer,
  HelperChildProps,
  InfoIcon,
} from "@pipecat-ai/voice-ui-kit";

export const App = ({
  handleConnect,
  handleDisconnect,
  error,
}: HelperChildProps) => {
  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Card className="vkui:shadow-long min-w-md gap-0" destructive>
          <CardHeader className="vkui:font-semibold flex flex-row items-center">
            <InfoIcon size={24} />
            An Error Occurred
          </CardHeader>
          <CardContent>
            <p className="vkui:text-sm vkui:text-balanced">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <FullScreenContainer>
      <div className="p-5">
        <div className="mx-auto max-w-xl bg-black 5 text-white p-12 rounded-2xl">
          <ConnectButton
            size="lg"
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        </div>
      </div>
    </FullScreenContainer>
  );
};
