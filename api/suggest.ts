export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = (req.query?.q as string) || '';
  if (!query) {
    return res.status(200).json([]);
  }
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data: any = await response.json();
      if (Array.isArray(data) && Array.isArray(data[1])) {
        return res.status(200).json(data[1].slice(0, 8));
      }
    }
    return res.status(200).json([]);
  } catch (err) {
    return res.status(200).json([]);
  }
}
