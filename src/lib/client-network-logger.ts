/**
 * Browser-only instrumentation: logs outgoing `fetch` calls and common global errors.
 * Enable in production with `NEXT_PUBLIC_LOG_NETWORK=1` (set in App Hosting env).
 */

const enabled =
  typeof process !== "undefined" &&
  (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_LOG_NETWORK === "1");

let fetchInstalled = false;
let errorsInstalled = false;

function summarizeUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  try {
    return input.url;
  } catch {
    return "[Request]";
  }
}

function summarizeMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method;
  if (typeof input !== "string" && !(input instanceof URL)) return input.method;
  return "GET";
}

/** Next.js App Router flight requests (`?_rsc=…`); status may be non-2xx during dev/HMR without a real "missing page". */
function isNextRscFetch(url: string): boolean {
  try {
    const u = new URL(url, "http://local.invalid");
    return u.searchParams.has("_rsc");
  } catch {
    return url.includes("_rsc=");
  }
}

export function installClientNetworkLogger(): void {
  if (typeof window === "undefined" || !enabled || fetchInstalled) return;
  fetchInstalled = true;

  const native = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = summarizeUrl(input);
    const method = summarizeMethod(input, init);
    const t0 = performance.now();
    const rsc = isNextRscFetch(url);
    if (rsc) {
      console.debug(`[network → RSC] ${method}`, url);
    } else {
      console.info(`[network →] ${method}`, url);
    }

    try {
      const res = await native(input, init);
      const ms = (performance.now() - t0).toFixed(0);

      if (rsc) {
        // Do not treat as API failure; never log flight bodies (huge, confusing).
        console.debug(`[network ← RSC] ${res.status} ${ms}ms`, url);
        return res;
      }

      if (res.ok) {
        console.info(`[network ←] ${res.status} ${ms}ms`, url);
      } else {
        console.warn(`[network ←] ${res.status} ${res.statusText} ${ms}ms`, url);
        const ct = res.headers.get("content-type") ?? "";
        if (ct.includes("application/json") || (ct.includes("text/") && !ct.includes("text/x-component"))) {
          res
            .clone()
            .text()
            .then((body) => {
              const clip = body.length > 1500 ? `${body.slice(0, 1500)}…` : body;
              if (clip.trim()) console.warn("[network body]", clip);
            })
            .catch(() => {});
        }
      }
      return res;
    } catch (err) {
      const ms = (performance.now() - t0).toFixed(0);
      console.error(`[network ✗] ${method} failed after ${ms}ms`, url, err);
      throw err;
    }
  };
}

export function installGlobalErrorLoggers(): void {
  if (typeof window === "undefined" || !enabled || errorsInstalled) return;
  errorsInstalled = true;

  window.addEventListener(
    "error",
    (ev) => {
      console.error("[window error]", ev.message, ev.error ?? ev.filename, ev.lineno, ev.colno);
    },
    true,
  );

  window.addEventListener("unhandledrejection", (ev) => {
    console.error("[unhandledrejection]", ev.reason);
  });
}
