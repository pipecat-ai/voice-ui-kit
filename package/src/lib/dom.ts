export function getPipecatUiNamespace(): string {
  return ".voice-ui-kit";
}

export function getPipecatUIContainer(): HTMLElement {
  return document.querySelector(getPipecatUiNamespace()) ?? document.body;
}
