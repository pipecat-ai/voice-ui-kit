import {
  Button,
  Card,
  CardContent,
  LogoutIcon,
  UserAudio,
} from "@pipecat-ai/voice-ui-kit";

export const Controls = ({ onEndSession }: { onEndSession: () => void }) => {
  return (
    <div className="relative z-10 h-1/2 flex flex-col w-full items-center justify-center animate-fade-in-bottom">
      <Card className="shadow-long bg-background">
        <CardContent className="flex flex-row gap-4 p-4">
          <UserAudio
            buttonProps={{ size: "xl" }}
            dropdownButtonProps={{ size: "xl" }}
          />
          <div className="w-[1px] flex-1 vkui:bg-border opacity-60 mx-2" />
          <Button onClick={onEndSession} size="xl" variant="outline" isIcon>
            <LogoutIcon className="text-destructive" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
