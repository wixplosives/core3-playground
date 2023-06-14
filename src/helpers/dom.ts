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

export function classNames(...classes: Array<string | false | undefined>): string | undefined {
  let spaceSeparated = "";
  let hasClasses = false;
  for (const className of classes) {
    if (className) {
      if (hasClasses) {
        spaceSeparated += " ";
      }
      spaceSeparated += className;
      hasClasses = true;
    }
  }
  return hasClasses ? spaceSeparated : undefined;
}

export const imageMimeTypes = new Map([
  [".avif", "image/avif"],
  [".bmp", "image/bmp"],
  [".gif", "image/gif"],
  [".heif", "image/heif"],
  [".ico", "image/vnd.microsoft.icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".png", "image/png"],
  [".tif", "image/tiff"],
  [".tiff", "image/tiff"],
  [".webp", "image/webp"],
]);
