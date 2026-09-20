const fs = require('node:fs/promises');
const path = require('node:path');

const sampleUrls = [
  'https://rasamalaysia.com/sesame-chicken/',
  // 'https://rasamalaysia.com/one-pan-greek-chicken/',
  'https://thestayathomechef.com/sheet-pan-sausage-and-veggies/',
  'https://mykoreankitchen.com/tteokbokki-spicy-rice-cakes/',
  'https://thecozycook.com/homemade-ramen/',
  'https://www.theflavorbender.com/easy-homemade-chicken-ramen/'
];

const apiBaseUrl = process.env.API_BASE_URL
  || (process.env.SERVER_HTTP_PORT ? `http://localhost:${process.env.SERVER_HTTP_PORT}` : 'http://localhost:5998');
const outputDir = path.resolve(__dirname);

function getOutputFileName(urlString) {
  const parsed = new URL(urlString);
  const domain = parsed.hostname.replace(/^www\./, '');
  return `${domain}.json`;
}

async function fetchAndSaveSamples() {
  console.log(`Target API Base URL: ${apiBaseUrl}`);
  console.log(`Output Directory: ${outputDir}`);
  console.log(`Total URLs to process: ${sampleUrls.length}\n`);

  await fs.mkdir(outputDir, { recursive: true });

  let successCount = 0;
  let failureCount = 0;

  for (const url of sampleUrls) {
    const filename = getOutputFileName(url);
    const outputPath = path.join(outputDir, filename);

    console.log(`[Processing] ${url}`);
    const endpoint = `${apiBaseUrl}/api/debug/recipe/import?recipe-url=${encodeURIComponent(url)}`;

    try {
      const response = await fetch(endpoint);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[Error] Failed to fetch ${url}. Status: ${response.status} ${response.statusText}. Response: ${errorText}`
        );
        failureCount++;
        continue;
      }

      const data = await response.json();
      await fs.writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
      console.log(`[Success] Saved to ${filename}`);
      successCount++;
    } catch (error) {
      console.error(`[Error] Failed processing ${url}: ${error.message}`);
      if (error.cause && error.cause.code === 'ECONNREFUSED') {
        console.error(
          `[Notice] Unable to connect to ${apiBaseUrl}. Ensure the API server is running with SERVER_DEVELOPMENT_MODE=true.`
        );
      }
      failureCount++;
    }
  }

  console.log(`\nFinished: ${successCount} succeeded, ${failureCount} failed.`);
}

fetchAndSaveSamples().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
