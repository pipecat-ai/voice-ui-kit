import type { ConversationProps } from "@/components/elements/Conversation";
import Conversation from "@/components/elements/Conversation";
import { Metrics } from "@/components/metrics";
import { Panel, PanelContent, PanelHeader } from "@/components/ui/panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChartIcon, MessagesSquareIcon } from "lucide-react";
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
      <Tabs className="h-full" defaultValue={defaultValue}>
        <Panel className="h-full max-sm:border-none">
          <PanelHeader variant="noPadding" className="py-1.5">
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
          <PanelContent className="p-0! overflow-hidden h-full">
            {!noConversation && (
              <TabsContent
                value="conversation"
                className="overflow-hidden h-full"
              >
                <Conversation {...conversationElementProps} />
              </TabsContent>
            )}
            {!noMetrics && (
              <TabsContent value="metrics" className="h-full">
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
