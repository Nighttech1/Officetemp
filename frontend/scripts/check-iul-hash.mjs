/** Quick hash sanity (run with node --experimental-strip-types or tsx; plain JS copy). */
const { webcrypto } = require("crypto");
globalThis.crypto = webcrypto;

async function sha256(buf) {
  const d = await crypto.subtle.digest("SHA-256", buf);
  return Buffer.from(d).toString("hex");
}

(async () => {
  const data = new TextEncoder().encode("hello");
  const h = await sha256(data.buffer);
  console.log("sha256(hello)=", h);
  console.log(
    "ok",
    h ===
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
  );
})();
