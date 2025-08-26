import AudioOutput from "@/components/elements/AudioOutput";
import { ClientStatus } from "@/components/elements/ClientStatus";
import { SessionInfo } from "@/components/elements/SessionInfo";
import UserAudioControl from "@/components/elements/UserAudioControl";
import UserVideoControl from "@/components/elements/UserVideoControl";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";

interface Props {
  noAudioOutput?: boolean;
  noSessionInfo?: boolean;
  noStatusInfo?: boolean;
  noUserAudio?: boolean;
  noUserVideo?: boolean;
  participantId?: string;
  sessionId?: string;
}

export const InfoPanel: React.FC<Props> = ({
  noAudioOutput = false,
  noSessionInfo = false,
  noStatusInfo = false,
  noUserAudio = false,
  noUserVideo = false,
  participantId,
  sessionId,
}) => {
  const noDevices = noAudioOutput && noUserAudio && noUserVideo;
  const noInfoPanel = noStatusInfo && noDevices && noSessionInfo;

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
            {!noUserVideo && <UserVideoControl />}
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
