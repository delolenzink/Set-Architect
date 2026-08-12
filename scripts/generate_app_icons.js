import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const svgPath = path.resolve(process.cwd(), 'public/logo.svg');
const svgBuffer = fs.readFileSync(svgPath);

const targets = [
  { name: 'public/icon-192.png', width: 192 },
  { name: 'public/icon-512.png', width: 512 },
  { name: 'public/apple-touch-icon.png', width: 180 },
  { name: 'public/favicon.png', width: 64 },
  { name: 'public/logo.png', width: 512 },
];

for (const target of targets) {
  const resvg = new Resvg(svgBuffer, {
    fitTo: {
      mode: 'width',
      value: target.width,
    },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  
  const outputPath = path.resolve(process.cwd(), target.name);
  fs.writeFileSync(outputPath, pngBuffer);
  console.log(`Generated ${target.name} (${target.width}x${target.width})`);
}
