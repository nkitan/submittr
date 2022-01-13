const axios = require('axios');
require('dotenv').config();
const logger = require('logplease').create('verifyAdmin')

const host = process.env.AUTH_HOST || 'localhost'
const port = process.env.AUTH_PORT || 6969

module.exports = async (req, res, next) => {
    try {    
        if(!req.cookies.token){
            return res.status(401).send({
                message: 'token not found',
            })
        }

        const response = await axios.get(`http://${host}:${port}/auth/verify`, {headers: {'content-type': 'application/json' ,'Cookie' : "token=" + req.cookies.token + ";" }, withCredentials: true })
        if(!response.data.isAdmin){
            logger.info('user not an admin')
            return res.status(400).json({
                message: 'user is not an admin',
            });
        }

        if(!response.data.valid){
            logger.info('verification failed')
            return res.status(401).json({
                message: 'user not verified',
            })
        }

        next();
    } catch (error) {
        logger.error('verification failed');
        return res.status(500).json({
            message: 'verification failed',
        });
    }
}