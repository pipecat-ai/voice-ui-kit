import { ClientStatus } from "@/components/elements/ClientStatus";
import { SessionInfo } from "@/components/elements/SessionInfo";
import UserAudioControl from "@/components/elements/UserAudioControl";
import AudioOutput from "@/components/elements/UserAudioOutputControl";
import UserScreenControl from "@/components/elements/UserScreenControl";
import UserVideoControl from "@/components/elements/UserVideoControl";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";
import { usePipecatClientCamControl } from "@pipecat-ai/client-react";

interface Props {
  noAudioOutput?: boolean;
  noSessionInfo?: boolean;
  noStatusInfo?: boolean;
  noUserAudio?: boolean;
  noUserVideo?: boolean;
  noScreenControl?: boolean;
  participantId?: string;
  sessionId?: string;
}

export const InfoPanel: React.FC<Props> = ({
  noAudioOutput = false,
  noSessionInfo = false,
  noStatusInfo = false,
  noUserAudio = false,
  noUserVideo = false,
  noScreenControl = false,
  participantId,
  sessionId,
}) => {
  const noDevices =
    noAudioOutput && noUserAudio && noUserVideo && noScreenControl;
  const noInfoPanel = noStatusInfo && noDevices && noSessionInfo;

  const { isCamEnabled } = usePipecatClientCamControl();

  if (noInfoPanel) return null;

  return (
    <Panel className="h-full overflow-y-auto overflow-x-hidden">
      {!noStatusInfo && (
        <>
          <PanelHeader variant="inline">
            <PanelTitle>Status</PanelTitle>
          </PanelHeader>
          <PanelContent>
            <ClientStatus />
          </PanelContent>
        </>
      )}
      {!noDevices && (
        <>
          <PanelHeader className="border-t border-t-border" variant="inline">
            <PanelTitle>Devices</PanelTitle>
          </PanelHeader>
          <PanelContent>
            {!noUserAudio && <UserAudioControl />}
            {!noUserVideo && <UserVideoControl noVideo={!isCamEnabled} />}
            {!noScreenControl && <UserScreenControl />}
            {!noAudioOutput && <AudioOutput />}
          </PanelContent>
        </>
      )}
      {!noSessionInfo && (
        <>
          <PanelHeader className="border-t border-t-border" variant="inline">
            <PanelTitle>Session</PanelTitle>
          </PanelHeader>
          <PanelContent>
            <SessionInfo sessionId={sessionId} participantId={participantId} />
          </PanelContent>
        </>
      )}
    </Panel>
  );
};

export default InfoPanel;
