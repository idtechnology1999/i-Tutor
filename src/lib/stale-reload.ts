/* After a new version of the site is published, its code files get new names
   and the old ones are gone. A tab left open from before still asks for the old
   files when the student opens another page, which fails and used to leave a
   white screen. Then the page reloads once to pick up the new version. */

const KEY = 'itutor-stale-reload';
/** Never reload again within this long, so a real outage can't loop. */
const GAP_MS = 30_000;

export function reloadForNewVersion(): boolean {
  try {
    const last = Number(window.sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last < GAP_MS) return false;
    window.sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* storage blocked: reload anyway (the gap check is just a guard) */
  }
  window.location.reload();
  return true;
}

/** A page's code failed to download (old file name, or the network dropped). */
export const isChunkError = (err: unknown) =>
  /dynamically imported module|Importing a module script failed|error loading dynamically imported|Failed to fetch|ChunkLoadError|Unable to preload CSS/i.test(
    String((err as Error)?.message ?? err),
  );

export function watchForNewVersion() {
  // Vite reports a failed download of a page's files here.
  window.addEventListener('vite:preloadError', (event) => {
    if (reloadForNewVersion()) event.preventDefault();
  });
}
