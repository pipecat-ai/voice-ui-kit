import { NextResponse } from "next/server";

export async function POST() {
  if (!process.env.BOT_START_URL) {
    return NextResponse.json(
      { error: "BOT_START_URL environment variable is not configured" },
      { status: 500 },
    );
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

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
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {}

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status },
      );
    }

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        room_url: data.dailyRoom,
        token: data.dailyToken,
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to process connection request: ${errorMessage}` },
      { status: 500 },
    );
  }
}
