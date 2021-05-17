const logger = require('logplease').create('auth')
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = async (req, res, next) => {
    const token = req.header("token");
    if(!token){
        return res.status(403).send({
            message: 'not authorized',
        })
    }

    try {    
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        
        req.id = payload.id;
        req.isAdmin = payload.isAdmin;
        req.isTeacher = payload.isTeacher;
        next();
        
    } catch (error) {
        logger.error(error.message);
        return res.status(403).send({
            message: 'invalid token',
        });
    }
}