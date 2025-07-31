import type { ConversationProps } from "@/components/elements/Conversation";
import Conversation from "@/components/elements/Conversation";
import { Metrics } from "@/components/metrics";
import { Panel, PanelContent, PanelHeader } from "@/components/ui/panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChartIcon, MessagesSquareIcon } from "@/icons";
import { memo } from "react";

interface ConversationPanelProps {
  noConversation?: boolean;
  noMetrics?: boolean;
  conversationElementProps?: Partial<ConversationProps>;
}

export const ConversationPanel: React.FC<ConversationPanelProps> = memo(
  ({ noConversation = false, noMetrics = false, conversationElementProps }) => {
    const defaultValue = noConversation ? "metrics" : "conversation";
    return (
      <Tabs className="vkui:h-full" defaultValue={defaultValue}>
        <Panel className="vkui:h-full vkui:max-sm:border-none">
          <PanelHeader variant="noPadding" className="vkui:py-1.5">
            <TabsList>
              {!noConversation && (
                <TabsTrigger value="conversation">
                  <MessagesSquareIcon size={20} />
                  Conversation
                </TabsTrigger>
              )}
              {!noMetrics && (
                <TabsTrigger value="metrics">
                  <LineChartIcon size={20} />
                  Metrics
                </TabsTrigger>
              )}
            </TabsList>
          </PanelHeader>
          <PanelContent className="vkui:p-0! vkui:overflow-hidden vkui:h-full">
            {!noConversation && (
              <TabsContent
                value="conversation"
                className="vkui:overflow-hidden vkui:h-full"
              >
                <Conversation {...conversationElementProps} />
              </TabsContent>
            )}
            {!noMetrics && (
              <TabsContent value="metrics" className="vkui:h-full">
                <Metrics />
              </TabsContent>
            )}
          </PanelContent>
        </Panel>
      </Tabs>
    );
  },
);

export default ConversationPanel;
