const logger = require('logplease').create('databasr')
const express = require('express');
const app = express();
const cors = require('cors');
const handler = require('serve-handler');
const http = require('http');
logger.info(require('dotenv').config());

const fileserver = http.createServer((request, response) => {
  return handler(request, response);
})

const host = process.env.DBSR_HOST || 'localhost';
const port = process.env.DBSR_PORT || 6971;
const filePort = process.env.DBSR_FILEPORT || 6972;

(async () => {
    app.use(express.json());
    app.use(cors());

    app.use("/dbsr", require('../api/api'));

    app.use("/", async (req, res) => {
        return res.status(404).send({
            message: 'page not found!',
        })
    })

    fileserver.listen(filePort, () => {
        logger.info(`databasr fileserver running @ ${host}:${filePort}`)
      });

    app.listen(port , () => {
        logger.info(`databasr running @ ${host}:${port}`)
    })
})();