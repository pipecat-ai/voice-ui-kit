import { WidgetTemplate } from ".";

export default {
  title: "Templates/Widget",
  component: WidgetTemplate,
};

export const Default = () => (
  <WidgetTemplate
    connectParams={{
      webrtcUrl: "http://localhost:7860/api/offer",
    }}
  />
);
