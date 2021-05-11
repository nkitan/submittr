const express = require('express');
require('dotenv').config();

const api = express();
const port = process.env.LOGIN_PORT || 6970

function validate(username, token){
    var xhr = new XMLHttpRequest();
    var url = `${process.env.DATABASR_HOST}/auth`;
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
        console.log('loginr listenting at http://localhost:${port}')
    }
)

api.post('/login',(req, res) =>{
    const { username } = req.body;
    const { hashd } = req.body;

    if(!user || !hashd){
        res.status(418).send({
            message: "error! invalid username / password"
        })
    }

    let auth_token = authorize(username, hashd);

    if(auth_token.valid){
        res.status(200).send({
            status: "okay!",
            token: `${auth_token.token}`,
            isTeacher: `${auth_token.isTeacher}`,
            isAdmin: `${auth_token.isAdmin}`
        })
    }
});