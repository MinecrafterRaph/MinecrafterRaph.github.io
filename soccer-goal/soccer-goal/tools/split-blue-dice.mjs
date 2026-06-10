import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { PNG } from "pngjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const src = join(root, "Blaue-Würfelarten.png");
const outDir = join(root, "Würfel-Blau");

const buf = readFileSync(src);
const png = PNG.sync.read(buf);
const { width, height } = png;
const faces = 6;
const sliceH = Math.floor(height / faces);

mkdirSync(outDir, { recursive: true });

const names = ["klauen.svg", "verpassen.svg", "eigentor.svg", "abwehren.svg", "foul.svg", "klauen2.svg"];

for (let i = 0; i < faces; i++) {
  const slice = new PNG({ width, height: sliceH });
  for (let y = 0; y < sliceH; y++) {
    const srcY = i * sliceH + y;
    if (srcY >= height) break;
    for (let x = 0; x < width; x++) {
      const srcIdx = (width * srcY + x) << 2;
      const dstIdx = (width * y + x) << 2;
      slice.data[dstIdx] = png.data[srcIdx];
      slice.data[dstIdx + 1] = png.data[srcIdx + 1];
      slice.data[dstIdx + 2] = png.data[srcIdx + 2];
      slice.data[dstIdx + 3] = png.data[srcIdx + 3];
    }
  }
  const outPath = join(outDir, names[i].replace(".svg", ".png"));
  writeFileSync(outPath, PNG.sync.write(slice));
  console.log(`Wrote ${outPath} (${width}x${sliceH})`);
}

console.log(`Source: ${width}x${height}`);
