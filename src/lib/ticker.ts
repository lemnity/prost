// Единый секундный тикер для всех таймеров на странице: один setInterval,
// запускается при первом подписчике, останавливается при уходе последнего
// и на скрытой вкладке.
let sec = 0;
const subs = new Set<() => void>();
let id: ReturnType<typeof setInterval> | undefined;

const now = () => Math.floor(Date.now() / 1000);

function tick() {
  sec = now();
  subs.forEach((cb) => cb());
}
function run() {
  if (id === undefined && subs.size > 0 && !document.hidden) {
    tick();
    id = setInterval(tick, 1000);
  }
}
function halt() {
  if (id !== undefined) clearInterval(id);
  id = undefined;
}
function onVis() {
  if (document.hidden) halt();
  else run();
}

export function subscribeTicker(cb: () => void) {
  subs.add(cb);
  sec = now();
  if (subs.size === 1) document.addEventListener("visibilitychange", onVis);
  run();
  return () => {
    subs.delete(cb);
    if (subs.size === 0) {
      halt();
      document.removeEventListener("visibilitychange", onVis);
    }
  };
}

/** Текущая секунда (unix), кэшируется между тиками; 0 — тикер ещё не запускался. */
export const getTickerSnapshot = () => sec;
export const getTickerServerSnapshot = () => 0;
