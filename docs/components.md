# Components

#### Elements & Controls
- [ConnectButton](#connectbutton)
- [UserAudioControl](#useraudiocontrol)
- [UserVideoControl](#uservideocontrol)

#### Helpers
- [AudioClientHelper](#audioclienthelper)

---

## Elements & Controls

### [ConnectButton](../src/components/elements/ConnectButton.tsx)

Button that updates contextually based on the current transport state. 

**Optional props**

| Prop | Type | Description |
|------|------|-------------|
| `onConnect?` | `() => void` | Handler method for connecting to session |
| `onDisconnect?` | `() => void` | Handler method for disconnecting from session |
| `onClick?` | `() => void` | Generic click handler |
| `className?` | `string` | ClassName passed through to button component |
| `size?` | `ButtonSize` | Size of button component (`default` \| `sm` \| `lg` \| `xl`) |
| `stateContent?` | `ConnectButtonStateContent` | Modify button variant, className or child content based on current state |

**Example:**

```tsx
import { ConnectButton } from "@pipecat-ai/voice-ui-kit";

<ConnectButton 
    size="lg"
    onConnect={() => console.log("connecting")}
    onConnect={() => console.log("disconnecting")}
    stateContent={{
        disconnected: {
            variant: "outline",
            children: "Join the session",
            className: "font-bold"
        }
    }}
/>
```


### UserAudioControl

...

### UserVideoControl

...


...

## Helpers

### [AudioClientHelper](../src/components/helpers/AudioClientHelper.tsx)

Helper component that provides a configured Pipecat client with audio capabilities. Reduces boilerplate by handling client initialization, provider setup, and connection management.

[Example](../examples/03-app-helper/)



| Prop | Type | Description |
|------|------|-------------|
| `connectParams` | `TransportConnectionParams \| ConnectionEndpoint` | Connection parameters for the Pipecat client |
| `transportType` | `"smallwebrtc" \| "daily"` | Type of transport to use for the connection |
| `clientOptions?` | `PipecatClientOptions` | Optional configuration options for the Pipecat client |
| `children?` | `React.ReactNode` | Child components to render with the client context |

**Child Component Props**

The AudioClientHelper injects the following props into its children:

| Prop | Type | Description |
|------|------|-------------|
| `handleConnect` | `() => Promise<void>` | Function to initiate a connection to the session |
| `handleDisconnect` | `() => Promise<void>` | Function to disconnect from the current session |
| `error` | `string` | Error message if connection fails |

**Example:**

```tsx
import { AudioClientHelper } from "@pipecat-ai/voice-ui-kit";

const MyApp = ({ handleConnect, handleDisconnect, error }) => {
  return (
    <div>
      {error && <div>Error: {error}</div>}
      <button onClick={handleConnect}>Connect</button>
      <button onClick={handleDisconnect}>Disconnect</button>
    </div>
  );
};

<AudioClientHelper
    connectParams={{
        endpoint: "/api/connect",
    }}
    transportType="daily"
>
    <MyApp />
</AudioClientHelper>
```

