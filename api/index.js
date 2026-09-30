export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const id = url.searchParams.get('id');
    const cleanId = id ? id.replace('.png', '') : 'tt0111161';

    // Настройки цветов и размеров из URL
    const bgColor = '#' + (url.searchParams.get('bg') || '121212');
    const imdbTextColor = '#' + (url.searchParams.get('imdb_text') || 'f5c518');
    const ratingTextColor = '#' + (url.searchParams.get('text') || 'ffffff');

    const width = url.searchParams.get('w') || '120';
    const height = url.searchParams.get('h') || '36';
    const rx = url.searchParams.get('rx') || '6';

    let rating = 'N/A';

    // Получаем рейтинг с IMDb
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

    // SVG с чётким шрифтом и раздвинутыми буквами
    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Фон баннера -->
        <rect width="100%" height="100%" fill="${bgColor}" rx="${rx}"/>
        
        <!-- Четкая надпись IMDb -->
        <text x="32" y="${(height / 2) + 4}" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="900" letter-spacing="1.5" fill="${imdbTextColor}" text-anchor="middle">IMDb</text>
        
        <!-- Число рейтинга -->
        <text x="${Number(width) - 25}" y="${(height / 2) + 4}" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="bold" fill="${ratingTextColor}" text-anchor="middle">${rating}</text>
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
