export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const id = url.searchParams.get('id');
    const cleanId = id ? id.replace('.png', '') : 'tt0111161';

    // Запрос к GraphQL API IMDb
    const response = await fetch('https://api.graphql.imdb.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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

    const result = await response.json();
    const titleData = result?.data?.title;

    const title = titleData?.titleText?.text || 'Movie Title';
    const rating = titleData?.ratingsSummary?.aggregateRating ? titleData.ratingsSummary.aggregateRating.toFixed(1) : 'N/A';
    const rawVotes = titleData?.ratingsSummary?.voteCount;
    const votes = rawVotes ? rawVotes.toLocaleString('en-US') : 'N/A';

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
