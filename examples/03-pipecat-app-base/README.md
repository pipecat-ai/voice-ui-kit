# Voice UI KIt - Console Template Example

This example shows how to implement the Console UI template.

It uses NextJS to demonstrate implementing a server-side route to handle bot start to protect API keys.

## Quickstart

Install node modules and chosen Pipecat client transport:

```shell
npm i 
npm i @pipecat-ai/small-webrtc-transport
# or
npm i @pipecat-ai/daily-transport
```

Create project `.env` file and set bot start endpoint and public API key (if relevant):

```shell
BOT_START_URL="https://..."
BOT_START_PUBLIC_API_KEY="abcxyz"
```

Run the application:

```shell
npm run dev
```