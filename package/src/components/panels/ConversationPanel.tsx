import type { ConversationProps } from "@/components/elements/Conversation";
import Conversation from "@/components/elements/Conversation";
import { Metrics } from "@/components/metrics";
import { Panel, PanelContent, PanelHeader } from "@/components/ui/panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChartIcon, MessagesSquareIcon } from "lucide-react";
import { memo } from "react";

interface ConversationPanelProps {
  /**
   * Disable conversation tab.
   * @default false
   */
  noConversation?: boolean;
  /**
   * Disable metrics tab.
   * @default false
   */
  noMetrics?: boolean;
  /**
   * Props for the conversation element.
   */
  conversationElementProps?: Partial<ConversationProps>;
  /**
   * Disable the text input field in the conversation.
   * @default false
   */
  noTextInput?: boolean;
  /**
   * Disable rendering of function call messages in the conversation.
   * Function call data is still captured in the store.
   * @default false
   */
  noFunctionCalls?: boolean;
}

export const ConversationPanel: React.FC<ConversationPanelProps> = memo(
  ({
    conversationElementProps,
    noConversation = false,
    noMetrics = false,
    noTextInput = false,
    noFunctionCalls = false,
  }) => {
    const defaultValue = noConversation ? "metrics" : "conversation";

    return (
      <Tabs className="h-full" defaultValue={defaultValue}>
        <Panel className="h-full max-sm:border-none">
          <PanelHeader variant="noPadding" className="p-1.5 relative">
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
                <Conversation
                  {...conversationElementProps}
                  noTextInput={
                    conversationElementProps?.noTextInput ?? noTextInput
                  }
                  noFunctionCalls={
                    conversationElementProps?.noFunctionCalls ?? noFunctionCalls
                  }
                  botOutputRenderers={
                    conversationElementProps?.botOutputRenderers
                  }
                />
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
