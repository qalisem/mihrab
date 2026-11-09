// Daily schedule shared by both games.
// Turns the player's local calendar date into a puzzle number, then picks that day's items
// from a shuffled list. Nothing repeats until the whole list is used up; then a new shuffle
// (a new "cycle") starts, and the first day of a cycle never reuses the previous day's items.
(function (root) {
  // Puzzle No. 1. Change this to your launch day. Month is 0-based (9 = October).
  const LAUNCH = Date.UTC(2026, 10, 8);

  function dayNumber(d) {
    d = d || new Date();
    return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - LAUNCH) / 864e5) + 1;
  }
  function dateKey(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function hash(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h;
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function shuffle(n, seed) {
    const a = Array.from({ length: n }, (_, i) => i), r = rng(seed);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  const cache = {};
  // Order of item indices for one cycle. Built in sequence so each cycle can avoid
  // reusing the items from the last day of the cycle before it.
  function cycleOrder(salt, n, per, cyc) {
    const key = salt + "|" + n + "|" + per;
    const list = cache[key] || (cache[key] = []);
    const days = Math.floor(n / per);
    for (let i = list.length; i <= cyc; i++) {
      const order = shuffle(n, hash(salt + "#" + i));
      if (i > 0) {
        const prevTail = list[i - 1].slice((days - 1) * per, days * per);
        for (let a = 0; a < per; a++) {
          if (!prevTail.includes(order[a])) continue;
          for (let b = per; b < n; b++) {
            if (!prevTail.includes(order[b])) { [order[a], order[b]] = [order[b], order[a]]; break; }
          }
        }
      }
      list.push(order);
    }
    return list[cyc];
  }

  // Items for a given day: `per` indices into a pool of size `n`. `salt` keeps games independent.
  function pick(day, per, n, salt) {
    const days = Math.floor(n / per), d = Math.max(1, day);
    const cyc = Math.floor((d - 1) / days), pos = (d - 1) % days;
    return cycleOrder(salt, n, per, cyc).slice(pos * per, pos * per + per);
  }
  function daysPerCycle(per, n) { return Math.floor(n / per); }

  root.Daily = { LAUNCH, dayNumber, dateKey, pick, daysPerCycle };
})(typeof window !== "undefined" ? window : globalThis);
