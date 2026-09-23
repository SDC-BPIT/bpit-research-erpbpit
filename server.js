const { createServer } = require('http');
const parseurl = require('parseurl');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res, parseurl(req));
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> BPIT Research ERP server ready on http://localhost:${port}`);
  });
});
