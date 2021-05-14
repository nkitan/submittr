const express = require('express');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;  
const xhr = new XMLHttpRequest();
require('dotenv').config();

const api = express();
const port = process.env.LOGIN_PORT || 6970

function authorize(username, hashd){
    var url = `http://${process.env.DATABASR_HOST}:${process.env.DATABASR_PORT}/auth`;
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    var post = JSON.stringify({username: `${username}`, hashd: `${hashd}`});
    xhr.send(post);
}

api.use(express.json());
api.listen(
    port,
    () => {
        console.log(`loginr listenting at http://localhost:${port}`)
    }
)

api.post('/login',(req, res) =>{
    let { username } = req.body;
    let { hashd } = req.body;

    if(!username || !hashd){
        res.status(418).send({
            message: "error! invalid username / password",
            status: "not okay!",
            token: "",
            isTeacher: false,
            isAdmin: false,
            valid: false
        })
        return;
    }

    authorize(username, hashd);
    xhr.onload = function(){
        let auth_token = JSON.parse(xhr.responseText);
        if(auth_token.valid){
            res.status(200).send({
                status: "okay!",
                token: auth_token.token,
                isTeacher: auth_token.isTeacher,
                isAdmin: auth_token.isAdmin,
                valid: auth_token.valid
            })
            return;
        } 

        else if(!auth_token.valid) {
            res.status(420).send({
                status: "not okay!",
                token: "",
                isTeacher: false,
                isAdmin: false,
                valid: false
            })
            return;
        }
    }
});