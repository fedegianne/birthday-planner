const CACHE = "birthday-planner-v4";
const FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./db.js",
  "./dates.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];
self.addEventListener("install", (e) =>
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))),
);
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("birthday-planner-") && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      ),
  ),
);
self.addEventListener("fetch", (e) => {
  if (
    e.request.method !== "GET" ||
    new URL(e.request.url).origin !== location.origin ||
    !e.request.url.startsWith(self.registration.scope)
  )
    return;
  e.respondWith(
    caches
      .match(e.request)
      .then(
        (c) =>
          c ||
          fetch(e.request).catch(() =>
            e.request.mode === "navigate"
              ? caches.match("./index.html")
              : Response.error(),
          ),
      ),
  );
});
