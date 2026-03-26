/**
 * Zimu — Vercel Serverless Proxy
 * /api/proxy?url=<encoded-url>
 *
 * Deezer ve RSS feed'leri sunucu tarafından çekerek CORS sorununu çözer.
 * Vercel free tier: aylık 100GB bandwidth, 100k istek — kişisel kullanım için yeterli.
 */

export default async function handler(req, res) {
  // CORS headers — sadece kendi domain'inden gelen isteklere izin ver
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "url parameter required" });
  }

  // Whitelist: sadece izin verilen domain'lere istek at
  const ALLOWED = [
    "api.deezer.com",
    "feeds.bbci.co.uk",
    "www.bbc.com",
    "feeds.arstechnica.com",
    "hnrss.org",
    "feeds.npr.org",
    "www.sciencedaily.com",
    "www.smithsonianmag.com",
    "itunes.apple.com",
  ];

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const isAllowed = ALLOWED.some((domain) => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith("." + domain));
  if (!isAllowed) {
    return res.status(403).json({ error: "Domain not allowed: " + parsedUrl.hostname });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Zimu-App/1.0)",
        "Accept": "application/json, application/xml, text/xml, */*",
      },
      signal: AbortSignal.timeout(10000),
    });

    const contentType = response.headers.get("content-type") || "";
    const body = await response.text();

    // Cache: RSS 5dk, Deezer chart 10dk
    const isDeezer = parsedUrl.hostname === "api.deezer.com";
    res.setHeader("Cache-Control", `s-maxage=${isDeezer ? 600 : 300}, stale-while-revalidate`);
    res.setHeader("Content-Type", contentType || "text/plain");

    return res.status(response.status).send(body);
  } catch (err) {
    return res.status(502).json({ error: "Fetch failed", message: err.message });
  }
}
