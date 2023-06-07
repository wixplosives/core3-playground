export const loadScript = async (targetUrl: string) => {
  const existingScriptEl = document.querySelector(`script[src="${targetUrl}"]`);
  if (existingScriptEl) {
    return;
  }
  const scriptElement = document.body.appendChild(document.createElement("script"));
  await loadWithTrigger(scriptElement, "src", targetUrl);
};

export const loadStylesheet = async (targetUrl: string) => {
  const existingLinkEl = document.querySelector(`link[href="${targetUrl}"]`);
  if (existingLinkEl) {
    return;
  }
  const linkEl = document.head.appendChild(document.createElement("link"));
  linkEl.rel = "stylesheet";
  await loadWithTrigger(linkEl, "href", targetUrl);
};

function loadWithTrigger<T extends HTMLElement, K extends keyof T>(htmlElement: T, key: K, value: T[K]) {
  return new Promise<unknown>((res, rej) => {
    htmlElement.addEventListener("load", res, { once: true });
    htmlElement.addEventListener("error", rej, { once: true });
    htmlElement[key] = value;
  });
}

export async function fetchText(targetURL: URL): Promise<string> {
  const response = await fetch(targetURL);
  if (!response.ok) {
    throw new Error(`"HTTP ${response.status}: ${response.statusText}" while fetching ${targetURL.href}`);
  }
  return response.text();
}
