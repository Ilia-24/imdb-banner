export default async function handler(req, res) {
  try {
    // Разбираем URL для извлечения параметров (так как req.query отсутствует в чистом Node.js)
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const id = url.searchParams.get('id');

    // Получаем ID фильма (поддерживает и tt0111161, и tt0111161.png)
    const cleanId = id ? id.replace('.png', '') : 'tt0111161';

    // Запрашиваем данные напрямую с IMDb
    const response = await fetch(`https://www.imdb.com/title/${cleanId}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = await response.text();

    // Парсим название фильма и рейтинг напрямую из HTML IMDb
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    let title = titleMatch ? titleMatch[1].replace(' - IMDb', '').trim() : 'Movie Title';

    const ratingMatch = html.match(/"ratingValue":\s*"?([\d.]+)"?/);
    const rating = ratingMatch ? ratingMatch[1] : 'N/A';

    const votesMatch = html.match(/"ratingCount":\s*(\d+)/);
    const rawVotes = votesMatch ? parseInt(votesMatch[1], 10) : null;
    const votes = rawVotes ? rawVotes.toLocaleString('en-US') : 'N/A';

    // Генерируем красивую SVG-картинку
    const svg = `
      <svg width="300" height="80" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#1f1f1f" rx="8"/>
        <text x="15" y="30" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#f5c518">${title.length > 24 ? title.substring(0, 22) + '...' : title}</text>
        <text x="15" y="58" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff">★ ${rating}</text>
        <text x="100" y="56" font-family="Arial, sans-serif" font-size="12" fill="#aaaaaa">(${votes} votes)</text>
      </svg>
    `.trim();

    // Отдаем SVG пользователю
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    res.status(200).send(svg);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).send('Error generating banner: ' + error.message);
  }
}
