const express = require('express');
const bcrypt = require('bcrypt');
require('dotenv').config();

const api = express();
const port = process.env.DATABASR_PORT || 6971;
const { Client } = require('pg');


const db_name = `${process.env.DB_NAME}`;
const db_port = process.env.DB_PORT || 6972;
const db_host = `${process.env.DB_HOST}` || "localhost";

let users = [{username: "Ankit", hashd: "lolwaa", token:"1", isAdmin: true, isTeacher: true}];

function updateUsers(){
    var db_user = `${process.env.USER_LOGIN}`;
    var db_passd = `${process.env.USER_PASSWORD}`;
    
    const client = new Client({
        user: `${db_user}`,
        host: `${db_host}`,
        database: `${db_name}`,
        password: `${db_passd}`,
        port: `${db_port}`
    })

    client.connect()
    .then(() => console.log("connected! updating now"))
    .then(() => client.query("SELECT * from users"))
    .then(results => users = results.rows)
    .catch(err => console.err(err))
    .finally(() => client.end())
}

function genToken(username, password){
    return length(username + password);
}

api.use(express.json());

api.listen(
    port,
    () => {
        console.log(`databasr running at http://localhost:${port}`);
    }
)

api.post('/user/auth',async (req,res) => {
    //updateUsers();
    const user = users.find(user => user.username == req.body.username);
    if(user == null){
        res.status(420).send({
            message: "user not found!",
            token: "",
            valid: false
        })
    } 

    try {
        if(await bcrypt.compare(req.body.password, user.password)){
            res.status(200).send({
                message: "logged in!",
                token: user.token,
                valid: true
            })
        }
    } catch (error) {
        res.status(420).send({
            message: "user not found!",
            token: "",
            valid: false
        })
    }
})

api.post('/user/validate',(req,res) => {
    updateUsers();

    const user = users.find(user => user.username == req.body.username);
    if(user == null){
        res.status(420).send({
            message: "user not found!",
            valid: false,
            isAdmin: false,
            isTeacher: false,
        })
    }

    try {
        if(user.token == req.body.token){
            res.send(200).send({
                message: "user valid",
                valid: true,
                isAdmin: user.isAdmin,
                isTeacher: user.isTeacher
            })
        }
    } catch (error) {
        res.status(420).send({
            message: "user not found!",
            valid: false,
            isAdmin: false,
            isTeacher: false
        })
    }
})


api.post('/user/add',(req,res) => {
    updateUsers();

    const user = users.find(user => user.username == req.body.username);
    if(user == null){
        res.send(420).send({
            message: "user not found!",
            valid: false
        })
    }

    try {
        if(user.token == req.body.token){
            if(user.isAdmin){
                var db_user = `${process.env.ADMIN_LOGIN}`;
                var db_passd = `${process.env.ADMIN_PASSWORD}`;

                const hashedPassword = await bcrypt.hash(req.body.user.password, 11);
                var result = "";

                const client = new Client({
                    user: `${db_user}`,
                    host: `${db_host}`,
                    database: `${db_name}`,
                    password: `${db_passd}`,
                    port: `${db_port}`
                })
            
                client.connect()
                .then(() => console.log("connected! updating now"))
                .then(() => client.query("INSERT INTO users VALUES($1, $2, $3, $4, $5)",[req.body.user.username, hashedPassword, genToken(req.body.user.username,hashedPassword,), req.body.user.isAdmin, req.body.user.isTeacher]))
                .then(results => result = results)
                .catch(err = console.err(err))
                .finally(() => client.end())

                res.status(200).send({
                    message: `${result}`
                })
            } else {
                throw "error";
            }
        }
    } catch(error){
        req.status(420).send({
            message: "user not found!"
        })
    }
})