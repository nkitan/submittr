const logger = require('logplease').create('authenticatr')
const express = require('express');
const app = express();;
const cors = require('cors');

const host = process.env.AUTH_PORT || 'localhost';
const port = process.env.AUTH_PORT || 6971;


app.use(express.json());
app.use(cors());

app.use("/auth", require("../api/api"));

app.use("/", async(req, res)=> {
    return res.status(404).send({
        message: 'page not found!',
    })
})

app.listen(port ,() => {
    logger.info(`authenticatr running @ ${host}:${port}`)
})