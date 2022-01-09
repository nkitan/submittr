const logger = require('logplease').create('auth')
const jwt = require('jsonwebtoken');
const { userpool } = require('../src/database');

require('dotenv').config();

module.exports = async (req, res, next) => {   
    try { 
        if(!req.cookies.token){
            return res.status(400).json({
                "message": "no token found"
            })
        }

        // TODO fix error when cannot refresh more than once
        try {
            const payload = await jwt.verify(req.cookies.token, process.env.JWT_SECRET)
            req.id = payload.id;
            
            try {
                req.isAdmin = Object.values((await userpool.query("SELECT isadmin FROM users WHERE id = $1", [payload.id])).rows[0])
                req.isTeacher = Object.values((await userpool.query("SELECT isteacher FROM users WHERE id = $1", [payload.id])).rows[0])
                req.username = Object.values((await userpool.query("SELECT username FROM users WHERE id = $1", [payload.id])).rows[0])
                next();
            }

            catch(err){
                logger.error(err.message)
                return res.status(500).json({
                    message: 'database error'
                })
            }

        } catch (error) {
            logger.error(error.message)
            return res.status(401).json({
                message: "couldn't refresh"
            })
        }
    } catch (err) {
        logger.error(err.message);
        return res.status(401).json({
            valid: false,
            message: 'invalid token'
        });
    }
}
