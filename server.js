const micro = require('micro');
const handler = require('./api/index.js');

const port = process.env.PORT || 3000;
const server = micro(handler);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
