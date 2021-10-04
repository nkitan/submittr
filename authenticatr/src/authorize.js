const logger = require('logplease').create('auth')
const jwt = require('jsonwebtoken');
const { userpool } = require('../src/database');

require('dotenv').config();

module.exports = async (req, res, next) => {
    try { 
        if(!req.headers.authorization){
            res.status(400).json({
                "message": "no token found"
            })
        }
        
        const token = req.headers.authorization;   
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.id = payload.id;

        try {
            req.isAdmin = Object.values((await userpool.query("SELECT isadmin FROM users WHERE id = $1", [payload.id])).rows[0])
            req.isTeacher = Object.values((await userpool.query("SELECT isteacher FROM users WHERE id = $1", [payload.id])).rows[0])
            req.username = Object.values((await userpool.query("SELECT username FROM users WHERE id = $1", [payload.id])).rows[0])

            next();
        }

        catch(err){
            logger.error(err.message)
            res.status(500).json({
                message: 'database error'
            })
        }

    } catch (err) {
        logger.error(err.message);
        res.status(401).json({
            valid: false,
            message: 'invalid token'
        });
    }
}
