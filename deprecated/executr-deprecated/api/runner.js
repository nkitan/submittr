const express = require('express');
const axios = require('axios');
require('dotenv').config();
const api = express();
const port = process.env.EXECUTR_PORT || 6969;
const executr = require('./execute');


api.use(express.json());

api.listen(
    port,
    () => {
        console.log(`executr listenting at http://localhost:${port}`)
    }
)

api.post('/run',async (req, res) =>{
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

    try {
        const response = await axios.post(`http://${process.env.DATABASR_HOST}:${process.env.DATABASR_PORT}/validate`, 
        { username: `${username}` ,token: `${token}` }, {
            timeout: 3000,
            headers: {
            'Content-Type': 'application/json'
            }
        });

        if(response.data.json.valid){
            if(response.data.json.isTeacher){
                try {
                    // run code
                    let program = instruct(code,lang,args,input);
                    result = executr.execute(program);
                    
                    res.status(200).send({
                        message: "succesfully run!",
                        result: result
                    })
    
                } catch(error) {
                    res.status(400).send({
                        message: "error while running!",
                        result: outstruct("","executr runtime error!")
                    })
                }
            }
        } 
        
        res.data.headers['Content-Type']; // 'application/json;charset=utf-8',    
    } catch (error){
        console.log("[EXECUTR] - CANNOT CONNECT TO DATABASR");
    }
});