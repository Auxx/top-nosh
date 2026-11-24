const url = process.argv[2];

if (!url) {
  console.error('Usage: node wait-for-url.mjs <url>');
  process.exit(2);
}

const timeoutMs = 120_000;
const intervalMs = 500;
const fetchTimeoutMs = 5000;
const deadline = Date.now() + timeoutMs;

while (Date.now() < deadline) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(fetchTimeoutMs) });
    if (response.ok) {
      process.exit(0);
    }
  } catch {
    // Server isn't listening yet, or the request timed out.
  }
  await new Promise(resolve => setTimeout(resolve, intervalMs));
}

console.error(`Timed out after ${ timeoutMs / 1000 }s waiting for ${ url }`);
process.exit(1);
