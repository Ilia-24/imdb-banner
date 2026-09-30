export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const id = url.searchParams.get('id');
    const cleanId = id ? id.replace('.png', '') : 'tt0111161';

    let rating = 'N/A';

    // Получаем рейтинг через GraphQL API IMDb
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

    // Минималистичный баннер (100x32 пикселя): плашка IMDb + число рейтинга
    const svg = `
      <svg width="100" height="32" viewBox="0 0 100 32" xmlns="http://www.w3.org/2000/svg">
        <!-- Фон баннера -->
        <rect width="100%" height="100%" fill="#121212" rx="6"/>
        
        <!-- Жёлтая плашка IMDb -->
        <rect x="6" y="6" width="44" height="20" fill="#f5c518" rx="3"/>
        <text x="28" y="20" font-family="Impact, Arial Black, sans-serif" font-size="11" font-weight="bold" fill="#000000" text-anchor="middle">IMDb</text>
        
        <!-- Число рейтинга -->
        <text x="73" y="21" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">${rating}</text>
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
