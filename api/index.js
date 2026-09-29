export default async function handler(req, res) {
  try {
    const { id } = req.query;
    
    // Получаем ID фильма из имени файла (например, tt1234567.png -> tt1234567)
    const cleanId = id ? id.replace('.png', '') : 'tt0111161';

    // Запрос к бесплатному API OMDB / IMDb
    const response = await fetch(`https://www.omdbapi.com/?i=${cleanId}&apikey=trilogy`);
    const data = await response.json();

    const title = data.Title || 'Movie Title';
    const rating = data.imdbRating || 'N/A';
    const votes = data.imdbVotes || 'N/A';

    // Генерируем красивую SVG-картинку
    const svg = `
      <svg width="300" height="80" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#1f1f1f" rx="8"/>
        <text x="15" y="30" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#f5c518">${title.length > 22 ? title.substring(0, 20) + '...' : title}</text>
        <text x="15" y="58" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff">★ ${rating}</text>
        <text x="100" y="56" font-family="Arial, sans-serif" font-size="12" fill="#aaaaaa">(${votes} votes)</text>
      </svg>
    `;

    // Отдаем картинку клиенту
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    res.status(200).send(svg);
  } catch (error) {
    res.status(500).send('Error generating banner');
  }
}
