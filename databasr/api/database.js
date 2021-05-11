const express = require('express');
require('dotenv').config();

const api = express();
const port = process.env.DATABASR_PORT || 6971;
const { Pool, Client } = require('pg');

let db_user = "notrootr";
let db_passd = "notrootrpassd";
const db_name = "userdb";
const db_port = process.env.DB_PORT || 6972;
const db_host = process.env.DB_HOST || "localhost";

api.use(express.json());
api.listen(
    port,
    () => {
        console.log(`databasr running at http://localhost:${port}`);
    }
)

api.post('/auth',(req,res) =>{
    const { username } = req.body;
    const { hashd } = req.body;

    if(!username || !hashd){
        res.status(420).send({
            message: "invalid username / password!",
            token: ""
        })
    }

    const client = new Client({
        user: `${db_user}`,
        host: `${db_host}`,
        database: `${db_name}`,
        password: `${db_passd}`,
        port: `${db_port}`
    })
    
    client.query('' , (err,res) => {
        let users = res;
        console.log(users);
    })

    users.forEach(user => {
        if(user.name === username && user.hashd === hashd){
            res.status(200).send({
                message: "cool",
                token: `${user.token}`,
                isTeacher: `${user.isTeacher}`,
                isAdmin: `${user.isAdmin}`,
                valid: true
            })
            pool.end();
        }
    });
    
    pool.end();
})

api.post('/validate',(req,res) => {
    const { username } = req.body;
    const { token } = req.body;

    const pool = new Pool({
        user: `${db_user}`,
        host: `${db_host}`,
        database: `${db_name}`,
        password: `${db_passd}`,
        port: `${db_port}`
    })
    
    pool.query('' , (err,res) => {
        let users = res;
        console.log(users);
    })

    users.forEach(user => {
        if(user.name === username && user.token === token){
            res.status(200).send({
                message: "cool",
                isTeacher: `${user.isTeacher}`,
                isAdmin: `${user.isAdmin}`,
                valid: true
            })
            pool.end();
        }
    });

    res.status(420).send({
        message: "invalid username/password",
        isTeacher: false,
        isAdmin: false,
        valid: false
    })

    pool.end();
})

api.post('/update',(req,res) =>{
    const { username } = req.body;
    const { token } = req.body;
    const { cmd } = req.body;

    const pool = new Pool({
        user: `${db_user}`,
        host: `${db_host}`,
        database: `${db_name}`,
        password: `${db_passd}`,
        port: `${db_port}`
    })
    
    pool.query('' , (err,res) => {
        let users = res;
        console.log(users);
    })

    users.forEach(user => {
        if(user.name === username && user.token === token && user.isAdmin){
            pool.query('' , (err,res) => {
                console.log(err,res);

                if(!err){
                    res.status(200).send({
                        message: "updated succesfully",
                        valid: true
                    })
                }

                res.status(400).send({
                    message: "not updated!",
                    valid: true
                })
            })        
        }
    });

    res.status(420).send({
        message: "invalid username/password",
        valid: false
    })
})