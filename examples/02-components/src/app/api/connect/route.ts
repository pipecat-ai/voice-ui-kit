import { NextResponse } from "next/server";

export async function POST() {
  // Check if required environment variables are set
  if (!process.env.BOT_START_URL) {
    return NextResponse.json(
      { error: "BOT_START_URL environment variable is not configured" },
      { status: 500 },
    );
  }

  try {
    // Prepare headers - make API key optional
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Only add Authorization header if API key is provided
    if (process.env.BOT_START_PUBLIC_API_KEY) {
      headers.Authorization = `Bearer ${process.env.BOT_START_PUBLIC_API_KEY}`;
    }

    const response = await fetch(process.env.BOT_START_URL, {
      method: "POST",
      mode: "cors",
      headers,
      body: JSON.stringify({
        createDailyRoom: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to connect to Pipecat: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return NextResponse.json({
      room_url: data.dailyRoom,
      token: data.dailyToken,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to process connection request: ${error}` },
      { status: 500 },
    );
  }
}
