import type { Story, StoryDefault } from "@ladle/react";
import { useCallback, useState } from "react";
import { TranscriptOverlayComponent } from "./TranscriptOverlay";

export default {
  title: "Components/Transcript Overlay",
  args: {
    size: "md",
    fadeInDuration: 300,
    fadeOutDuration: 1000,
  },
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
      defaultValue: "md",
      description: "Size variant of the transcript overlay",
    },
    fadeInDuration: {
      control: { type: "number", min: 50, max: 2000, step: 50 },
      defaultValue: 300,
      description: "Duration of the fade-in animation in milliseconds",
    },
    fadeOutDuration: {
      control: { type: "number", min: 100, max: 5000, step: 100 },
      defaultValue: 1000,
      description: "Duration of the fade-out animation in milliseconds",
    },
  },
} satisfies StoryDefault;

export const Basic: Story<{
  size: "sm" | "md" | "lg";
  fadeInDuration: number;
  fadeOutDuration: number;
}> = ({ size, fadeInDuration, fadeOutDuration }) => (
  <TranscriptOverlayComponent
    words={[
      "Hello",
      "my",
      "name",
      "is",
      "ChatBot.",
      "How",
      "are",
      "you",
      "today?",
    ]}
    size={size}
    fadeInDuration={fadeInDuration}
    fadeOutDuration={fadeOutDuration}
    className="max-w-md"
  />
);

export const WithTurnEnd: Story<{
  size: "sm" | "md" | "lg";
  fadeInDuration: number;
  fadeOutDuration: number;
}> = ({ size, fadeInDuration, fadeOutDuration }) => (
  <TranscriptOverlayComponent
    words={["This", "transcript", "has", "ended", "and", "will", "fade", "out"]}
    size={size}
    turnEnd={true}
    fadeInDuration={fadeInDuration}
    fadeOutDuration={fadeOutDuration}
    className="max-w-md"
  />
);

export const CustomAnimations: Story<{
  size: "sm" | "md" | "lg";
  fadeInDuration: number;
  fadeOutDuration: number;
}> = ({ size, fadeInDuration, fadeOutDuration }) => (
  <TranscriptOverlayComponent
    words={["Fast", "fade", "in", "and", "slow", "fade", "out"]}
    size={size}
    fadeInDuration={fadeInDuration}
    fadeOutDuration={fadeOutDuration}
    turnEnd={true}
    className="max-w-md"
  />
);

export const LongTranscript: Story<{
  size: "sm" | "md" | "lg";
  fadeInDuration: number;
  fadeOutDuration: number;
}> = ({ size, fadeInDuration, fadeOutDuration }) => (
  <TranscriptOverlayComponent
    words={[
      "This",
      "is",
      "a",
      "much",
      "longer",
      "transcript",
      "that",
      "demonstrates",
      "how",
      "the",
      "component",
      "handles",
      "multiple",
      "words",
      "and",
      "wraps",
      "text",
      "appropriately",
      "across",
      "multiple",
      "lines",
      "while",
      "maintaining",
      "proper",
      "spacing",
      "and",
      "animation",
      "timing",
    ]}
    size={size}
    fadeInDuration={fadeInDuration}
    fadeOutDuration={fadeOutDuration}
    className="max-w-lg"
  />
);

export const SingleWord: Story<{
  size: "sm" | "md" | "lg";
  fadeInDuration: number;
  fadeOutDuration: number;
}> = ({ size, fadeInDuration, fadeOutDuration }) => (
  <TranscriptOverlayComponent
    words={["Hello"]}
    size={size}
    fadeInDuration={fadeInDuration}
    fadeOutDuration={fadeOutDuration}
    className="max-w-md"
  />
);

export const SimulatedSpeech: Story<{
  size: "sm" | "md" | "lg";
  fadeInDuration: number;
  fadeOutDuration: number;
}> = ({ size, fadeInDuration, fadeOutDuration }) => {
  const [transcript, setTranscript] = useState<string[]>([]);
  const [turnEnd, setTurnEnd] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const samplePhrases = [
    "Hello, how can I help you today?",
    "I can assist you with various tasks and answer your questions.",
    "What would you like to know about our services?",
    "I'm here to provide information and support whenever you need it.",
    "Feel free to ask me anything you'd like to know.",
  ];

  const startNewSpeech = useCallback(() => {
    const phrase =
      samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
    const words = phrase.split(" ");

    setTranscript([]);
    setTurnEnd(false);
    setIsSpeaking(true);

    // Simulate word-by-word appearance
    words.forEach((word, index) => {
      setTimeout(() => {
        setTranscript((prev) => [...prev, word]);

        // End the turn after the last word
        if (index === words.length - 1) {
          setTimeout(() => {
            setTurnEnd(true);
            setIsSpeaking(false);
          }, 500);
        }
      }, index * 200);
    });
  }, [samplePhrases]);

  const endTurn = useCallback(() => {
    setTurnEnd(true);
    setIsSpeaking(false);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript([]);
    setTurnEnd(false);
    setIsSpeaking(false);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={startNewSpeech}
          disabled={isSpeaking}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSpeaking ? "Speaking..." : "Start New Speech"}
        </button>
        <button
          onClick={endTurn}
          disabled={!isSpeaking || turnEnd}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          End Turn
        </button>
        <button
          onClick={clearTranscript}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear
        </button>
      </div>

      <div className="min-h-[100px] flex items-center justify-center">
        {transcript.length > 0 ? (
          <TranscriptOverlayComponent
            words={transcript}
            size={size}
            turnEnd={turnEnd}
            fadeInDuration={fadeInDuration}
            fadeOutDuration={fadeOutDuration}
            className="max-w-2xl"
          />
        ) : (
          <p className="text-gray-500 text-sm">
            Click "Start New Speech" to see the transcript appear
          </p>
        )}
      </div>
    </div>
  );
};

export const WordByWordAnimation: Story<{
  size: "sm" | "md" | "lg";
  fadeInDuration: number;
  fadeOutDuration: number;
}> = ({ size, fadeInDuration, fadeOutDuration }) => {
  const [currentWords, setCurrentWords] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const fullText =
    "This demonstrates the word-by-word fade-in animation effect";
  const words = fullText.split(" ");

  const startAnimation = useCallback(() => {
    setCurrentWords([]);
    setIsAnimating(true);

    words.forEach((word, index) => {
      setTimeout(() => {
        setCurrentWords((prev) => [...prev, word]);

        if (index === words.length - 1) {
          setTimeout(() => setIsAnimating(false), fadeInDuration);
        }
      }, index * 100); // Add words every 100ms
    });
  }, [words, fadeInDuration]);

  const resetAnimation = useCallback(() => {
    setCurrentWords([]);
    setIsAnimating(false);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={startAnimation}
          disabled={isAnimating}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnimating ? "Animating..." : "Start Word-by-Word Animation"}
        </button>
        <button
          onClick={resetAnimation}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reset
        </button>
      </div>

      <div className="min-h-[100px] flex items-center justify-center">
        {currentWords.length > 0 ? (
          <TranscriptOverlayComponent
            words={currentWords}
            size={size}
            fadeInDuration={fadeInDuration}
            fadeOutDuration={fadeOutDuration}
            className="max-w-2xl"
          />
        ) : (
          <p className="text-gray-500 text-sm">
            Click "Start Word-by-Word Animation" to see each word fade in
            individually
          </p>
        )}
      </div>
    </div>
  );
};

export const MultilineBackground: Story<{
  size: "sm" | "md" | "lg";
  fadeInDuration: number;
  fadeOutDuration: number;
}> = ({ size, fadeInDuration, fadeOutDuration }) => (
  <div className="space-y-4">
    <p className="text-sm text-gray-600">
      This story tests how the background wraps around multiple lines of text.
      The background should wrap around each line individually, not fill the
      entire container.
    </p>

    <div className="max-w-xs">
      <TranscriptOverlayComponent
        words={[
          "This",
          "is",
          "a",
          "test",
          "of",
          "multiline",
          "background",
          "wrapping",
          "behavior",
          "to",
          "ensure",
          "proper",
          "styling",
        ]}
        size={size}
        fadeInDuration={fadeInDuration}
        fadeOutDuration={fadeOutDuration}
        className="border-2 border-dashed border-gray-300 p-4"
      />
    </div>

    <div className="max-w-sm">
      <TranscriptOverlayComponent
        words={[
          "Another",
          "example",
          "with",
          "different",
          "width",
          "to",
          "show",
          "how",
          "the",
          "background",
          "adapts",
          "to",
          "text",
          "wrapping",
        ]}
        size={size}
        fadeInDuration={fadeInDuration}
        fadeOutDuration={fadeOutDuration}
        className="border-2 border-dashed border-gray-300 p-4"
      />
    </div>
  </div>
);

Basic.storyName = "Basic Transcript";
WithTurnEnd.storyName = "With Turn End";
CustomAnimations.storyName = "Custom Animations";
LongTranscript.storyName = "Long Transcript";
SingleWord.storyName = "Single Word";
SimulatedSpeech.storyName = "Simulated Speech";
WordByWordAnimation.storyName = "Word-by-Word Animation";
MultilineBackground.storyName = "Multiline Background";
