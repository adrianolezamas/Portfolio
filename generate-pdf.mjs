import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, 'mediakit.pdf');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Set A4 viewport so layout renders correctly before printing
  await page.setViewport({ width: 794, height: 1123 });

  await page.goto('http://localhost:3000/mediakit.html', {
    waitUntil: 'networkidle0',
    timeout: 20000,
  });

  // Wait for fonts and images to settle
  await new Promise(r => setTimeout(r, 1500));

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await browser.close();
  console.log('PDF saved: mediakit.pdf');
})();
