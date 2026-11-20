import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const icons = {
  "sht31": '<rect x="17" y="11" width="38" height="42" rx="6" fill="#0e7490"/><path d="M24 52v12m8-12v12m8-12v12m8-12v12" stroke="#b45309" stroke-width="3"/><rect x="25" y="20" width="22" height="22" rx="4" fill="#164e63"/><path d="M36 23c-2 4-7 8-7 12a7 7 0 0 0 14 0c0-4-5-8-7-12Z" fill="#a5f3fc"/>',
  "bmp280": '<rect x="14" y="11" width="44" height="42" rx="6" fill="#6d28d9"/><path d="M21 52v12m6-12v12m6-12v12m6-12v12m6-12v12m6-12v12" stroke="#b45309" stroke-width="3"/><rect x="23" y="19" width="26" height="23" rx="4" fill="#ede9fe"/><path d="M28 36a8 8 0 0 1 16 0m-8-1 4-6" fill="none" stroke="#6d28d9" stroke-width="2" stroke-linecap="round"/>',
  "gps": '<rect x="11" y="11" width="50" height="42" rx="7" fill="#1d4ed8"/><path d="M22 52v12m9-12v12m9-12v12m9-12v12" stroke="#b45309" stroke-width="3"/><rect x="21" y="16" width="30" height="31" rx="5" fill="#e0f2fe"/><path d="M36 22a8 8 0 0 0-8 8c0 6 8 12 8 12s8-6 8-12a8 8 0 0 0-8-8Z" fill="#1d4ed8"/><circle cx="36" cy="30" r="3" fill="#fff"/>',
  "lm35": '<path d="M27 46v17m9-17v17m9-17v17" stroke="#64748b" stroke-width="3"/><path d="M21 46V30a15 15 0 0 1 30 0v16Z" fill="#334155"/><path d="M33 29a3 3 0 1 1 6 0v7a5 5 0 1 1-6 0Z" fill="#fecaca"/><path d="M36 32v7" stroke="#b91c1c" stroke-width="2" stroke-linecap="round"/>',
  "ldr": '<path d="M31 47v17m10-17v17" stroke="#64748b" stroke-width="3"/><circle cx="36" cy="31" r="18" fill="#fdba74" stroke="#c2410c" stroke-width="2"/><path d="M25 37v-7q0-4 4-4t4 4v5q0 4 4 4t4-4v-5q0-4 4-4t4 4v5" fill="none" stroke="#7c2d12" stroke-width="2.5" stroke-linecap="round"/><path d="m54 18 5-6m-2 12 8-3" stroke="#ea580c" stroke-width="2" stroke-linecap="round"/>',
  "pot": '<path d="M27 44v20m9-20v20m9-20v20" stroke="#64748b" stroke-width="3"/><rect x="14" y="11" width="44" height="39" rx="8" fill="#0f766e"/><circle cx="36" cy="30" r="13" fill="#99f6e4"/><path d="m36 30 6-7" stroke="#134e4a" stroke-width="3" stroke-linecap="round"/><circle cx="36" cy="30" r="3" fill="#134e4a"/>',
};
const directory = new URL("../public/assets/sensor-signals/", import.meta.url);
await mkdir(directory, { recursive: true });
await Promise.all(Object.entries(icons).map(([name, art]) =>
  sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" width="96" height="96">${art}</svg>`))
    .webp({ lossless: true })
    .toFile(new URL(`${name}.webp`, directory).pathname),
));
