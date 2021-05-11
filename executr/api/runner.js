const express = require('express');
require('dotenv').config();

const api = express();
const port = process.env.EXECUTR_PORT || 6969;

const executr = require('./execute')

function validate(username, token){
    var xhr = new XMLHttpRequest();
    var url = `${process.env.DATABASR_HOST}/validate`;
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
        }
    };

    xhr.send(JSON.stringify({username: `${username}`, token: `${token}`}));
    return response;
}

api.use(express.json());

api.listen(
    port,
    () => {
        console.log(`executr listenting at http://localhost:${port}`)
    }
)

api.post('/run',(req, res) =>{
    const { username } = req.body;
    const { token } = req.body;

    const { lang } = req.body;
    const { code } = req.body;
    const { args } = req.body;
    const { input } = req.body;

    if(!code || !lang){
        res.status(418).send({
            message: "invalid code/language"
        })
    }

    let validator = validate(username,token);

    if(!validator.isTeacher){
        res.status(420).send({
            message: "only teachers can execute code!"
        })
    }

    if(validator.isTeacher && validator.valid){
        let program = executr.instruct(lang,code,args,input);
        let executed = executr.execute(program);
        res.status(200).send({
            lang: `${program.lang}`,
            errors: `${executed.errors}`,
            output: `${executed.output}`
        })
    }

    res.status(420).send({
        message: "error! invalid token"
    })

});