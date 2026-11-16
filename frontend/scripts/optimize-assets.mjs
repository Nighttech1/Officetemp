#!/usr/bin/env node
/**
 * C-23 Asset pipeline — convert public/source/* (or generate SVG logo)
 * into WebP/AVIF under public/optimized/ using sharp when available.
 */
import { mkdir, readdir, writeFile, access } from "node:fs/promises";
import { join, extname, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const sourceDir = join(root, "public", "source");
const outDir = join(root, "public", "optimized");

const LOGO_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="DocSaaS">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#134E4A"/>
      <stop offset="100%" stop-color="#2DD4BF"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="#09090B"/>
  <circle cx="256" cy="256" r="148" fill="url(#g)" opacity="0.9"/>
  <text x="256" y="278" text-anchor="middle" font-family="Georgia, serif" font-size="120" font-weight="700" fill="#09090B">D</text>
</svg>
`;

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureSources() {
  await mkdir(sourceDir, { recursive: true });
  const logoPath = join(sourceDir, "logo.svg");
  if (!(await exists(logoPath))) {
    await writeFile(logoPath, LOGO_SVG, "utf8");
    console.log("created", logoPath);
  }
}

async function main() {
  await ensureSources();
  await mkdir(outDir, { recursive: true });

  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.warn("sharp not installed — writing SVG copy only");
    const svg = join(sourceDir, "logo.svg");
    const dest = join(outDir, "logo.svg");
    const { copyFile } = await import("node:fs/promises");
    await copyFile(svg, dest);
    console.log("copied", dest);
    return;
  }

  const files = await readdir(sourceDir);
  const rasters = files.filter((f) =>
    /\.(png|jpe?g|webp|gif|svg)$/i.test(f),
  );

  for (const file of rasters) {
    const input = join(sourceDir, file);
    const base = basename(file, extname(file));
    const pipeline = sharp(input).resize({
      width: 512,
      height: 512,
      fit: "inside",
      withoutEnlargement: true,
    });

    const webpOut = join(outDir, `${base}.webp`);
    const avifOut = join(outDir, `${base}.avif`);
    await pipeline.clone().webp({ quality: 82 }).toFile(webpOut);
    await pipeline.clone().avif({ quality: 55 }).toFile(avifOut);
    console.log("wrote", webpOut);
    console.log("wrote", avifOut);
  }

  // Also keep SVG for crisp UI marks
  if (await exists(join(sourceDir, "logo.svg"))) {
    const { copyFile } = await import("node:fs/promises");
    await copyFile(join(sourceDir, "logo.svg"), join(outDir, "logo.svg"));
  }

  console.log("optimize-assets done →", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
