const axios = require('axios');
require('dotenv').config();
const logger = require('logplease').create('verify');

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
        if(!response.data.valid){
            throw new Error('user not valid')
        }

        req.id = response.data.id;
        req.isTeacher = response.data.isTeacher;
        next();
        
    } catch (error) {
        logger.error('verification failed ' + error);
        return res.status(500).json({
            message: 'verification failed',
        });
    }
}