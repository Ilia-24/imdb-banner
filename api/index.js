export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const id = url.searchParams.get('id');
    const cleanId = id ? id.replace('.png', '') : 'tt0111161';

    // Отримуем параметри стилю з URL (або беремо значення за замовчуванням)
    const bgColor = '#' + (url.searchParams.get('bg') || '121212');
    const textColor = '#' + (url.searchParams.get('text') || 'ffffff');
    const width = url.searchParams.get('w') || '120';
    const height = url.searchParams.get('h') || '36';
    const rx = url.searchParams.get('rx') || '6';

    let rating = 'N/A';

    // Отримуємо рейтинг через GraphQL API IMDb
    try {
      const gqlResponse = await fetch('https://api.graphql.imdb.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'x-imdb-client-name': 'imdb-web-next',
          'x-imdb-user-country': 'US'
        },
        body: JSON.stringify({
          query: `
            query GetTitle($id: ID!) {
              title(id: $id) {
                ratingsSummary {
                  aggregateRating
                }
              }
            }
          `,
          variables: { id: cleanId }
        })
      });

      if (gqlResponse.ok) {
        const gqlData = await gqlResponse.json();
        const aggregateRating = gqlData?.data?.title?.ratingsSummary?.aggregateRating;
        if (aggregateRating) {
          rating = aggregateRating.toFixed(1);
        }
      }
    } catch (e) {
      console.error('GraphQL rating fetch failed:', e);
    }

    // Динамічний SVG баннер
    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Фон баннера -->
        <rect width="100%" height="100%" fill="${bgColor}" rx="${rx}"/>
        
        <!-- Жовта плашка IMDb -->
        <rect x="8" y="${(height - 20) / 2}" width="44" height="20" fill="#f5c518" rx="3"/>
        <text x="30" y="${(height - 20) / 2 + 14}" font-family="Impact, Arial Black, sans-serif" font-size="11" font-weight="bold" fill="#000000" text-anchor="middle">IMDb</text>
        
        <!-- Число рейтингу -->
        <text x="${Number(width) - 25}" y="${(height / 2) + 5}" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${textColor}" text-anchor="middle">${rating}</text>
      </svg>
    `.trim();

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    res.status(200).send(svg);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).send('Error generating banner: ' + error.message);
  }
}
