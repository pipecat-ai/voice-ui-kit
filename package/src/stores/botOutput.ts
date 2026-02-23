import type { ConversationMessagePart } from "@/types/conversation";

export type BotOutputMessageCursor = {
  currentPartIndex: number;
  currentCharIndex: number;
  /**
   * Per-part: true if fully spoken OR explicitly skipped (e.g. not meant
   * to be spoken, or mismatch recovery advanced past it).
   */
  partFinalFlags: boolean[];
};

const normalizeForMatching = (text: string): string => {
  return text.toLowerCase().replace(/[^\w\s]/g, "");
};

const skipWhitespace = (text: string, start: number): number => {
  let i = start;
  while (i < text.length && /\s/.test(text[i])) i++;
  return i;
};

/**
 * Finds where `spoken` appears in `unspoken`, starting from `startPosition`.
 * - Best-effort sequential word matching (normalized, punctuation-stripped)
 * - Returns the original start position on mismatch (no advancement)
 */
const findSpokenPositionInUnspoken = (
  spoken: string,
  unspoken: string,
  startPosition: number,
): number => {
  if (!spoken || !unspoken || startPosition >= unspoken.length) {
    return startPosition;
  }

  // If spoken text includes a leading separator space, skip leading whitespace in unspoken.
  let actualStart = startPosition;
  let spokenForMatching = spoken;
  if (spoken.startsWith(" ") && startPosition < unspoken.length) {
    actualStart = skipWhitespace(unspoken, startPosition);
    spokenForMatching = spoken.trimStart();
  } else if (startPosition === 0 && startPosition < unspoken.length) {
    // If we're at the start, also skip leading whitespace (e.g. newlines)
    actualStart = skipWhitespace(unspoken, 0);
  }

  const remainder = unspoken.slice(actualStart);
  // Sentence-level: if spoken exactly matches the remainder (normalized), consume the whole part
  // so we never leave a word unspoken due to word-matching edge cases.
  if (
    normalizeForMatching(spokenForMatching).trim() ===
    normalizeForMatching(remainder).trim()
  ) {
    return unspoken.length;
  }

  const spokenWords = normalizeForMatching(spokenForMatching)
    .split(/\s+/)
    .filter(Boolean);

  if (spokenWords.length === 0) return actualStart;

  const unspokenWords = normalizeForMatching(unspoken.slice(actualStart))
    .split(/\s+/)
    .filter(Boolean);

  // Sequential match, allowing prefix match for contractions (e.g. "I" vs "I'm")
  let matchedWords = 0;
  for (
    let i = 0;
    i < unspokenWords.length && matchedWords < spokenWords.length;
    i++
  ) {
    const target = spokenWords[matchedWords];
    const candidate = unspokenWords[i];
    if (candidate === target || candidate.startsWith(target)) {
      matchedWords++;
      continue;
    }
    return actualStart;
  }

  if (matchedWords === 0) return actualStart;

  // Convert word matches back into a character position in the original unspoken string.
  const isWordChar = (char: string): boolean => /[a-zA-Z0-9]/.test(char);
  let wordCount = 0;
  let i = actualStart;
  let inWord = false;

  while (i < unspoken.length) {
    const charIsWord = isWordChar(unspoken[i]);
    if (charIsWord && !inWord) {
      inWord = true;
      wordCount++;

      if (wordCount === matchedWords) {
        // Consume the rest of this word
        i++;
        while (i < unspoken.length && isWordChar(unspoken[i])) i++;
        // Include any punctuation after the word until the next space, then include the space
        while (i < unspoken.length) {
          if (unspoken[i] === " ") {
            i++;
            break;
          }
          i++;
        }
        return i;
      }
    } else if (!charIsWord && inWord) {
      inWord = false;
    }
    i++;
  }

  return unspoken.length;
};

/**
 * Returns true if the cursor has not yet reached the end of all text parts,
 * meaning there is still unspoken content waiting to be spoken.
 */
export function hasUnspokenContent(
  cursor: BotOutputMessageCursor,
  parts: ConversationMessagePart[],
): boolean {
  if (parts.length === 0) return false;

  for (let i = 0; i < parts.length; i++) {
    if (typeof parts[i]?.text !== "string") continue;
    if (!cursor.partFinalFlags[i]) return true;
  }

  return false;
}

/**
 * Advances the cursor for spoken text. Returns true if the cursor was advanced
 * (text was consumed), false if there was nothing to advance (e.g. no parts).
 * Used to detect "spoken-only" bots that never send unspoken events.
 */
export function applySpokenBotOutputProgress(
  cursor: BotOutputMessageCursor,
  parts: ConversationMessagePart[],
  spokenText: string,
): boolean {
  if (parts.length === 0) return false;

  // Find the next part that should be spoken (skip parts already marked final/skipped)
  let partToMatch = cursor.currentPartIndex;
  while (partToMatch < parts.length && cursor.partFinalFlags[partToMatch]) {
    partToMatch++;
  }
  if (partToMatch >= parts.length) return false;

  if (partToMatch > cursor.currentPartIndex) {
    cursor.currentPartIndex = partToMatch;
    cursor.currentCharIndex = 0;
  }

  const currentPart = parts[cursor.currentPartIndex];
  if (typeof currentPart.text !== "string") return false;

  const partText = currentPart.text;
  const startChar = cursor.currentCharIndex;

  const newPosition = findSpokenPositionInUnspoken(
    spokenText,
    partText,
    startChar,
  );
  const whitespaceEnd = skipWhitespace(partText, startChar);

  if (newPosition > whitespaceEnd) {
    cursor.currentCharIndex = newPosition;

    if (newPosition >= partText.length) {
      cursor.partFinalFlags[cursor.currentPartIndex] = true;
      if (cursor.currentPartIndex < parts.length - 1) {
        cursor.currentPartIndex++;
        cursor.currentCharIndex = 0;
      }
    }
    return true;
  }

  // Mismatch recovery: try to find the spoken text in a later part.
  for (
    let nextPartIdx = cursor.currentPartIndex + 1;
    nextPartIdx < parts.length;
    nextPartIdx++
  ) {
    const nextPart = parts[nextPartIdx];
    if (typeof nextPart.text !== "string") continue;

    const match = findSpokenPositionInUnspoken(spokenText, nextPart.text, 0);
    const nextWhitespaceEnd = skipWhitespace(nextPart.text, 0);
    if (match > nextWhitespaceEnd) {
      // Mark skipped parts as final and jump to the matched part
      for (let i = cursor.currentPartIndex; i < nextPartIdx; i++) {
        cursor.partFinalFlags[i] = true;
      }
      cursor.currentPartIndex = nextPartIdx;
      cursor.currentCharIndex = match;
      return true;
    }
  }

  // If we're stuck at the start, mark the current part as skipped to avoid deadlock.
  if (startChar === 0 && cursor.currentPartIndex < parts.length - 1) {
    cursor.partFinalFlags[cursor.currentPartIndex] = true;
    cursor.currentPartIndex++;
    cursor.currentCharIndex = 0;
    return true;
  }

  return false;
}
