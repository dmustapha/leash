import sharp from 'sharp';
import { readFileSync } from 'fs';
const svg = readFileSync('web/public/logo.svg');
// PNG exports at judged sizes
for (const s of [512, 256, 64, 32, 16]) {
  await sharp(svg, { density: 400 }).resize(s, s).png().toFile(`web/public/logo-${s}.png`);
}
await sharp('web/public/logo-512.png').toFile('web/public/logo.png');
// OG 1200x630: near-black canvas + centered combination lockup
const ogBg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0b0b0d"/>
  <rect width="1200" height="630" fill="url(#g)"/>
  <defs><radialGradient id="g" cx="80%" cy="-10%" r="90%">
    <stop offset="0%" stop-color="#f2a63b" stop-opacity="0.10"/><stop offset="60%" stop-color="#f2a63b" stop-opacity="0"/></radialGradient></defs>
  <text x="120" y="300" font-family="system-ui,sans-serif" font-size="76" font-weight="700" letter-spacing="2" fill="#f4f1ea">LEA<tspan fill="#f2a63b">S</tspan>H</text>
  <text x="122" y="372" font-family="system-ui,sans-serif" font-size="34" fill="#a8a29a">The ENS name that can un-pay it.</text>
  <text x="122" y="430" font-family="ui-monospace,monospace" font-size="22" fill="#6b665e">ENS · Hedera x402 · Privy — spend control for external agents</text>
</svg>`);
const mark = await sharp('web/public/logo.svg', { density: 400 }).resize(300, 300).png().toBuffer();
await sharp(ogBg).composite([{ input: mark, top: 165, left: 800 }]).png().toFile('web/public/og-image.png');
console.log('rasterized: logo.png(512), logo-{256,64,32,16}.png, og-image.png');
