const express = require('express');
const axios = requireq('axios');
require('dotenv').config();

module.exports = async (req, res, next) => {
    const token = req.header("token");
    if(!token){
        return res.status(403).send({
            message: 'not authorized',
        })
    }

    try {    
        axios({
            url: `http://${process.env.AUTH_HOST}:${process.env.AUTH_PORT}/verify`,
            method: 'post',
            headers: {
                'token': `${req.body.token}`,
                'Content-Type': 'application/json'
            }
         })
         .then(response => {
            if(response.isTeacher){
                res.status(200).json(true);
                next();
            }

            throw new Error('not a teacher');
         }) 
         .catch(err => {
            throw new Error(err);
         });        
    } catch (error) {
        logger.error(error.message);
        return res.status(403).send({
            message: 'invalid token',
        });
    }
}