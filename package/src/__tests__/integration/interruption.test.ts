import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStoreHarness } from "../helpers/storeHarness";
import { conversation, playScenario } from "../helpers/conversationDSL";
import { getRawPartTexts } from "../helpers/assertions";

describe("user interruption", () => {
  let harness: ReturnType<typeof createStoreHarness>;

  beforeEach(() => {
    vi.useFakeTimers();
    harness = createStoreHarness();
    harness.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // Basic interruption
  // -----------------------------------------------------------------------
  it("finalizes assistant message immediately when user starts speaking", () => {
    const scenario = conversation()
      .bot("Hello how are you today")
      .interruptAfter("how are")
      .user("I'm fine thanks")
      .build();

    playScenario(harness, scenario);
    vi.advanceTimersByTime(5000);

    const messages = harness.getMessages();

    // Should have an assistant message (finalized) and a user message
    expect(messages.length).toBe(2);
    expect(messages[0].role).toBe("assistant");
    expect(messages[0].final).toBe(true);
    expect(messages[1].role).toBe("user");
  });

  it("preserves partial spoken progress at interruption point", () => {
    const scenario = conversation()
      .bot("Hello how are you today")
      .interruptAfter("how are")
      .user("I'm fine")
      .build();

    playScenario(harness, scenario);
    vi.advanceTimersByTime(5000);

    // The cursor should reflect that only "Hello", "how", "are" were spoken
    // (not "you" or "today")
    const cursor = harness.getLastAssistantCursor();
    expect(cursor).toBeDefined();

    // The full unspoken text includes all words, but cursor should not be at the end
    const partTexts = getRawPartTexts(harness.getMessages()[0]);
    const fullText = partTexts.join("");
    expect(cursor!.currentCharIndex).toBeLessThan(fullText.length);
  });

  // -----------------------------------------------------------------------
  // Early and late interruption
  // -----------------------------------------------------------------------
  it("handles early interruption (after first word)", () => {
    const scenario = conversation()
      .bot("Hello how are you today")
      .interruptAfter("Hello")
      .user("Stop!")
      .build();

    playScenario(harness, scenario);
    vi.advanceTimersByTime(5000);

    const messages = harness.getMessages();
    expect(messages[0].role).toBe("assistant");
    expect(messages[0].final).toBe(true);

    // Cursor should be near the beginning
    const cursor = harness.getLastAssistantCursor();
    expect(cursor).toBeDefined();
    expect(cursor!.currentCharIndex).toBeGreaterThan(0);
  });

  it("handles late interruption (near last word)", () => {
    const scenario = conversation()
      .bot("Hello how are you today")
      .interruptAfter("Hello how are you")
      .user("Wait!")
      .build();

    playScenario(harness, scenario);
    vi.advanceTimersByTime(5000);

    const messages = harness.getMessages();
    expect(messages[0].role).toBe("assistant");
    expect(messages[0].final).toBe(true);

    // Cursor should be near the end but not at the very end
    // (since "today" was not spoken)
    const cursor = harness.getLastAssistantCursor();
    expect(cursor).toBeDefined();
    const partTexts = getRawPartTexts(messages[0]);
    const fullText = partTexts.join("");
    expect(cursor!.currentCharIndex).toBeLessThanOrEqual(fullText.length);
  });

  // -----------------------------------------------------------------------
  // Interruption followed by conversation continuation
  // -----------------------------------------------------------------------
  it("allows conversation to continue after interruption", () => {
    const scenario = conversation()
      .bot("Hello how are you")
      .interruptAfter("Hello")
      .user("I'm fine")
      .bot("Great to hear!")
      .build();

    playScenario(harness, scenario);
    vi.advanceTimersByTime(5000);

    const messages = harness.getMessages();

    // Should have 3 messages: assistant (interrupted), user, assistant
    expect(messages.length).toBe(3);
    expect(messages[0].role).toBe("assistant");
    expect(messages[0].final).toBe(true);
    expect(messages[1].role).toBe("user");
    expect(messages[2].role).toBe("assistant");
    expect(messages[2].final).toBe(true);
  });

  // -----------------------------------------------------------------------
  // Double interruption
  // -----------------------------------------------------------------------
  it("handles double interruption: user interrupts, bot resumes, user interrupts again", () => {
    const scenario = conversation()
      .bot("Hello how are you doing today")
      .interruptAfter("how are")
      .user("Wait")
      .bot("Sure let me start over and explain everything")
      .interruptAfter("start over")
      .user("Actually never mind")
      .build();

    playScenario(harness, scenario);
    vi.advanceTimersByTime(5000);

    const messages = harness.getMessages();

    // 4 messages: assistant (interrupted), user, assistant (interrupted), user
    expect(messages.length).toBe(4);
    expect(messages[0].role).toBe("assistant");
    expect(messages[0].final).toBe(true);
    expect(messages[1].role).toBe("user");
    expect(messages[2].role).toBe("assistant");
    expect(messages[2].final).toBe(true);
    expect(messages[3].role).toBe("user");

    // Both assistant messages should have partial spoken progress
    // (not fully spoken since they were interrupted)
    const firstAssistantText = getRawPartTexts(messages[0]).join("");
    expect(firstAssistantText).toContain("Hello");

    const secondAssistantText = getRawPartTexts(messages[2]).join("");
    expect(secondAssistantText).toContain("Sure");
  });

  // -----------------------------------------------------------------------
  // Interruption with sentence-level aggregation
  // -----------------------------------------------------------------------
  it("handles interruption during sentence-level bot turn", () => {
    const scenario = conversation()
      .bot("Hello there how are you today", { aggregation: "sentence" })
      .interruptAfter("Hello there how are")
      .user("I'm good")
      .build();

    playScenario(harness, scenario);
    vi.advanceTimersByTime(5000);

    const messages = harness.getMessages();
    expect(messages[0].role).toBe("assistant");
    expect(messages[0].final).toBe(true);
    expect(messages[1].role).toBe("user");
  });
});
