require('dotenv').config();
'use strict';
const logger = require('logplease').create('verify');
const axios = require('axios');

const host = process.env.AUTH_HOST || 'localhost'
const port = process.env.AUTH_PORT || 6969


module.exports = async (req, res, next) => {
    try {
        if(!req.cookies.token){
            return res.status(401).send({
                message: 'token not found',
            })
        }
    
        try {    
            const url = `http://${host}:${port}/auth/verify`
            const headers = { 'Content-Type': 'application/json', Cookie: "token=" + req.cookies.token + ";"}
            const response = await axios.get(url, { headers: headers, withCredentials: true})
            const data = response.data
            
            if(!data.valid){
                throw new Error('user not valid')
            }
    
            req.id = data.id;
            req.isTeacher = data.isTeacher;
            req.isAdmin = data.isAdmin;
            next();
            
        } catch (error) {
            logger.error('verification failed: ' + error.message);
            return res.status(401).json({
                message: 'verification failed',
            });
        }
    } catch (error) {
        logger.error('error parsing token!: ' + error)
        return res.status(401).json({
            message: 'error parsing token',
        });
    }
}