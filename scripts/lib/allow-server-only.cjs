// Lets scripts outside Next import modules guarded by "server-only". The
// package only marks modules that must never reach the browser; scripts run
// on the server, so it resolves to its own empty module here. Import this
// before anything else.
const Module = require("node:module");
const path = require("node:path");

// The package exports nothing but its guard, so point at the file directly (scripts run from the repo root).
const empty = path.join(process.cwd(), "node_modules", "server-only", "empty.js");
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  return request === "server-only" ? empty : resolve.call(this, request, ...rest);
};
