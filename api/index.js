export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const id = url.searchParams.get('id');
    const cleanId = id ? id.replace('.png', '') : 'tt0111161';

    let title = 'Movie Title';
    let rating = 'N/A';
    let votes = 'N/A';

    // 1. Пробуем получить данные через GraphQL API с полным набором заголовков
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
                titleText { text }
                ratingsSummary {
                  aggregateRating
                  voteCount
                }
              }
            }
          `,
          variables: { id: cleanId }
        })
      });

      if (gqlResponse.ok) {
        const gqlData = await gqlResponse.json();
        const titleData = gqlData?.data?.title;
        if (titleData) {
          title = titleData.titleText?.text || title;
          rating = titleData.ratingsSummary?.aggregateRating ? titleData.ratingsSummary.aggregateRating.toFixed(1) : rating;
          const rawVotes = titleData.ratingsSummary?.voteCount;
          votes = rawVotes ? rawVotes.toLocaleString('en-US') : votes;
        }
      }
    } catch (e) {
      console.error('GraphQL fetch failed, falling back to suggestion API:', e);
    }

    // 2. Если название всё ещё дефолтное — делаем фоллбек на надёжный Suggestion API IMDb
    if (title === 'Movie Title') {
      const suggestUrl = `https://v3.sg.media-imdb.com/suggestion/x/${cleanId}.json`;
      const sgResponse = await fetch(suggestUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
      });

      if (sgResponse.ok) {
        const sgData = await sgResponse.json();
        const movie = sgData?.d?.find(item => item.id === cleanId);
        if (movie) {
          title = movie.l || title;
        }
      }
    }

    // Генерируем красивый SVG баннер
    const svg = `
      <svg width="300" height="80" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#1f1f1f" rx="8"/>
        <text x="15" y="30" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#f5c518">${title.length > 24 ? title.substring(0, 22) + '...' : title}</text>
        <text x="15" y="58" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff">★ ${rating}</text>
        <text x="100" y="56" font-family="Arial, sans-serif" font-size="12" fill="#aaaaaa">(${votes} votes)</text>
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
