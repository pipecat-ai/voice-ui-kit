export function getPipecatUiNamespace(): string {
  return ".vkui-root";
}

export function getPipecatUIContainer(): HTMLElement {
  return document.querySelector(getPipecatUiNamespace()) ?? document.body;
}
