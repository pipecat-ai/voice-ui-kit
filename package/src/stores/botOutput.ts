import type { ConversationMessagePart } from "@/types/conversation";

export type BotOutputMessageCursor = {
  currentPartIndex: number;
  currentCharIndex: number;
  /**
   * Per-part: true if fully spoken OR explicitly skipped (e.g. not meant
   * to be spoken, or mismatch recovery advanced past it).
   */
  partFinalFlags: boolean[];
  /**
   * Per-part: true if the part was created as a spoken-only fallback (a
   * spoken event arrived with no matching unspoken content). Such parts
   * can be absorbed when an unspoken event later arrives that spans them.
   */
  partSpokenOnly: boolean[];
  /**
   * True once any unspoken event has been received for this message. When
   * true, unmatched spoken events are dropped instead of spawning fallback
   * parts (since the unspoken stream is authoritative for this message).
   */
  hasReceivedUnspoken: boolean;
};

export const normalizeForMatching = (text: string): string => {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "");
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
  // and limited skipping of mismatched unspoken words (e.g. punctuation artifacts).
  let matchedWords = 0;
  let consecutiveSkips = 0;
  let lastMatchedUnspokenIdx = -1;
  const MAX_CONSECUTIVE_SKIPS = 2;
  for (
    let i = 0;
    i < unspokenWords.length && matchedWords < spokenWords.length;
    i++
  ) {
    const target = spokenWords[matchedWords];
    const candidate = unspokenWords[i];
    if (candidate === target || candidate.startsWith(target)) {
      matchedWords++;
      consecutiveSkips = 0;
      lastMatchedUnspokenIdx = i;
      continue;
    }
    consecutiveSkips++;
    if (consecutiveSkips > MAX_CONSECUTIVE_SKIPS) return actualStart;
    // Skip this unspoken word and try matching the next one
  }

  if (matchedWords < spokenWords.length) return actualStart;

  // Convert the matched unspoken-word index back into a character position.
  // Walk whitespace-separated "chunks" that contain at least one alphanumeric
  // char (so pure-punctuation chunks like "—" are skipped — matching the
  // normalize+split tokenization used above). Stop at the chunk whose index
  // equals lastMatchedUnspokenIdx, then advance past any trailing whitespace
  // so the cursor sits at the start of the next chunk.
  const targetChunkCount = lastMatchedUnspokenIdx + 1;
  const isAlnum = (char: string): boolean => /[\p{L}\p{N}]/u.test(char);
  const isWs = (char: string): boolean => /\s/.test(char);
  let chunkCount = 0;
  let inChunk = false;
  let chunkHasAlnum = false;
  let i = actualStart;

  while (i < unspoken.length) {
    const c = unspoken[i];
    if (isWs(c)) {
      if (inChunk && chunkHasAlnum) {
        chunkCount++;
        if (chunkCount === targetChunkCount) {
          while (i < unspoken.length && isWs(unspoken[i])) i++;
          return i;
        }
      }
      inChunk = false;
      chunkHasAlnum = false;
    } else {
      inChunk = true;
      if (isAlnum(c)) chunkHasAlnum = true;
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
 * Attempts to consume spoken text against the current cursor position.
 * Returns true if the text was successfully consumed (cursor may or may not
 * advance — pure punctuation is consumed without moving the cursor), or false
 * if there was nothing to consume (e.g. no parts, all parts already spoken).
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

  // If the spoken text is pure punctuation (e.g. an em dash "—"), normalization
  // strips it to empty and word-matching would fail. Treat it as successfully
  // consumed so the cursor stays put and subsequent words continue matching.
  if (normalizeForMatching(spokenText).trim().length === 0) {
    return true;
  }

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

  // Intra-part scan-ahead recovery: if matching failed at the current position,
  // scan forward word-by-word within the same part. This prevents the cursor
  // from getting permanently stuck mid-part when a single word mismatch occurs
  // (e.g. TTS variation, punctuation boundary like `apexes."Sometimes`).
  if (startChar > 0) {
    const MAX_SCAN_WORDS = 8;
    let scanPos = startChar;
    for (let scan = 0; scan < MAX_SCAN_WORDS; scan++) {
      // Advance past current word
      while (scanPos < partText.length && !/\s/.test(partText[scanPos]))
        scanPos++;
      // Advance past whitespace to next word
      while (scanPos < partText.length && /\s/.test(partText[scanPos]))
        scanPos++;
      if (scanPos >= partText.length) break;

      const retryPos = findSpokenPositionInUnspoken(
        spokenText,
        partText,
        scanPos,
      );
      const scanWsEnd = skipWhitespace(partText, scanPos);
      if (retryPos > scanWsEnd) {
        cursor.currentCharIndex = retryPos;
        if (retryPos >= partText.length) {
          cursor.partFinalFlags[cursor.currentPartIndex] = true;
          if (cursor.currentPartIndex < parts.length - 1) {
            cursor.currentPartIndex++;
            cursor.currentCharIndex = 0;
          }
        }
        return true;
      }
    }
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
