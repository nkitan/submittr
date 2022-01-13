const logger = require('logplease').create('authenticatr');
const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
logger.info(require('dotenv').config());

const host = process.env.AUTH_HOST || 'localhost';
const port = process.env.AUTH_PORT || 6970;
const corsOptions = {credentials: true, origin: ["http://localhost:3000", "http://localhost:6971"], methods: ["GET", "POST"], allowedHeaders: ['Content-Type', 'Authorization']};

app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());

app.use("/auth", require('../api/api'));

app.use("/", async(req, res)=> {
    return res.status(404).send({
        message: 'page not found!',
    })
})

app.listen(port ,() => {
    logger.info(`authenticatr running @ ${host}:${port}`)
})