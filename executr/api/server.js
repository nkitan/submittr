const express = require('express');
const api = express();
const port = process.env.API_PORT || 6969;

const executr = require('./execute')
const authorizer = "LOLWIKA MUHHARAJ"

api.use(express.json());

api.listen(
    port,
    () => {
        console.log(`API ACTIVE @ http://localhost:${port}`)
    }
)

api.post('/run',(req, res) =>{

    const { lang } = req.body;
    const { code } = req.body;
    const { auth_token } = req.body;

    if(authorizer != auth_token){
        res.status(420).send({
            message: "ERROR! INVALID AUTH_TOKEN"
        })
    }

    if(!code || !lang){
        res.status(418).send({
            message: "ERROR! NO CODE / LANGUAGE"
        })
    }

    let executed = executr.execute(lang,code);
    
    res.status(200).send({
        lang: `${lang}`,
        errors: `${executed.errors}`,
        output: `${executed.output}`
    })
});