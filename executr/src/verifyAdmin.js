const axios = require('axios');
require('dotenv').config();
const logger = require('logplease').create('verifyAdmin')

const host = process.env.AUTH_HOST || 'localhost'
const port = process.env.AUTH_PORT || 6969

module.exports = async (req, res, next) => {
    const token = req.body.token;
    if(!token){
        return res.status(401).send({
            message: 'not authorized',
        })
    }

    try {    
        const response = await axios.post(`http://${host}:${port}/auth/verify`, { token : token }, {headers: {'content-type': 'application/json'}})
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