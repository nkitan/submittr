const express = require('express');
const router = express.Router();
const axios = require('axios');
const bcrypt = require('bcrypt');
const logger = require('logplease').create('api');

const { userpool, adminpool } = require('../src/database')
const genJWT = require('../src/jwt')
const check = require('../src/check')
const authorize = require('../src/authorize')

const tokenList = {}

router.post("/login", check, async (req, res) => {
    try {  
        const users = await userpool.query("SELECT * FROM users")
        const user = users.rows.find(user => user.username == req.body.username)
        
        if(user == null){
            return res.status(400).json({
                message: 'user not found!',
            })
        }
        
        bcrypt.compare(req.body.password, user.passwd, (err, results) => {
            if(err){
                logger.error(err.message);
                return res.status(500).json({
                    message: 'error while comparing',
                })
            }
            if (results) {
                const token = genJWT(user, process.env.JWT_SECRET, process.env.JWT_EXPIRY + 'm');
                const refreshToken = genJWT(user, process.env.REFRESH_SECRET, process.env.REFRESH_EXPIRY + ' days')
                tokenList[refreshToken] = { user: user, token: token, refreshToken: refreshToken}

                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    sameSite: "strict",
                    secure: process.env.NODE_ENV !== "development",
                    expires: new Date(new Date().getTime() + (parseInt(process.env.REFRESH_EXPIRY) * 24 * 60 * 60 * 1000))
                });

                res.cookie("token", token, {
                    httpOnly: true,
                    sameSite: "strict",
                    secure: process.env.NODE_ENV !== "development",
                    expires: new Date(new Date().getTime() + (parseInt(process.env.JWT_EXPIRY) * 60 * 1000))
                });

                return res.json({ 
                    message: 'success', 
                    expiresIn: new Date(new Date().getTime() + (parseInt(process.env.JWT_EXPIRY) * 60000))
                });
                
            } else {
                return res.status(401).json({
                    message: 'invalid credentials',
                });
            }
           })

    } catch(err){
        logger.error(err.message);
        return res.status(500).json({
            message: 'database error!',
        })
    }
})

router.get("/logout", authorize, async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if((refreshToken) && (refreshToken in tokenList)) {
        tokenList[refreshToken] = {}
    }
    
    res.cookie("refreshToken", "", {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development",
        expires: new Date(new Date().getTime() - 100)
    });

    res.cookie("token", "", {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development",
        expires: new Date(new Date().getTime() - 100)
    });

    return res.json({ 
        message: 'success', 
        expiresIn: "expired"
    });  
})

router.get("/refresh", authorize, async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if((refreshToken) && (refreshToken in tokenList)) {
        const tokenListItem = tokenList[refreshToken]
        const token = genJWT(tokenListItem.user, process.env.JWT_SECRET, process.env.JWT_EXPIRY + 'm');
        tokenList[refreshToken].token = token

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV !== "development",
            expires: new Date(new Date().getTime() + (parseInt(process.env.JWT_EXPIRY) * 60 * 1000))
        });

        return res.status(200).json({
            message: 'success',
            expiresIn: new Date(new Date().getTime() + (parseInt(process.env.JWT_EXPIRY) * 60000))
        })

    } else {
        return res.status(401).json({
            message: "invalid refresh token"
        })
    }
})

router.post("/regadmin", async (req, res) => {
try{
    if(!req.body.newuser){
        logger.error('no new user specified')
        res.status(400).json({
            message: 'no new user specified'
        })

    }

    const hasher = async (saltRounds = 10) => {
        try {
            return await bcrypt.hash(req.body.newuser.password, saltRounds );
        } catch (error) {
            logger.error(error);
            return null;
        }
    };

    const hashed = await hasher();

    if(hashed == null){
        logger.error('could not hash password')
        return res.status(500).json({
            message : 'cannot create admin!'
        })
    }

    const newUser = await adminpool.query("INSERT INTO users (username, passwd, isAdmin, isTeacher) VALUES ($1, $2, $3, $4) RETURNING *", [req.body.newuser.username, hashed, req.body.newuser.isAdmin, req.body.newuser.isTeacher]);
    const token = genJWT(newUser.rows[0].id);
    logger.info('added superuser -' + newUser.rows[0].id)
    return res.status(200).json({id: newUser.rows[0].id, token: token});

} catch(err){
    logger.error(err.message);
    return res.status(500).json({
        message: 'database error!'
    })
}
})


router.post("/register", authorize, async (req, res) => {
    try {
        if(req.isAdmin == 'false'){
            return res.status(403).json({
                message: 'insufficient permissions to register user'
            })
        }
        
        const {
            newuser        
        } = req.body;
        
        
        if(!newuser || typeof(newuser) !== 'object'){
            return res.status(400).json({
                message: 'newuser not specified!'
            })
        }

        if(!newuser.username || typeof(newuser.username) !== 'string'){
            return res.status(400).json({
                message: 'username must be a string'
            })
        }
    
        if(!newuser.isAdmin || typeof(newuser.isAdmin) !== 'string'){
            return res.status(400).json({
                message: 'isAdmin must be string'
            })
        }

        if(!newuser.isTeacher || typeof(newuser.isTeacher) !== 'string'){
            return res.status(400).json({
                message: 'isTeacher must be string'
            })
        }

        if(!newuser.classes){
            return res.status(400).json({
                message: 'classes must be specified'
            })
        }

        if(newuser.isTeacher === 'true' && typeof(newuser.classes) !== 'object'){
            return res.status(400).json({
                message: 'classes must be array for teachers'
            })
        }

        if(newuser.isTeacher === 'false' && typeof(newuser.classes) !== 'string'){
            return res.status(400).json({
                message: 'classes must be string for students'
            })
        }

        const databasrHost = process.env.DBSR_HOST || dbsr
        const databasrPort = process.env.DBSR_PORT || 6971

        const users = await userpool.query("SELECT * FROM users")
        const user = users.rows.find(user => user.username == newuser.username);
        if(user != null){
            return res.status(400).json({
                message: "user exists!"
            })
        }
        
        const hasher = async (saltRounds = 10) => {
            try {
                return await bcrypt.hash(newuser.password, saltRounds);
            } catch (err) {
                logger.error(err);
                return null;
            }
        };
        
        const hashed = await hasher()

        if(hashed === null){
            res.status(500).json({
                message: 'cannot create user!'
            })
        }

        const newUser = await adminpool.query("INSERT INTO users (username, passwd, isAdmin, isTeacher) VALUES ($1, $2, $3, $4) RETURNING *", [newuser.username, hashed, newuser.isAdmin, newuser.isTeacher]);
        const token = genJWT(newUser.rows[0].id);

        
        try {    
            axios.post(`http://${databasrHost}:${databasrPort}/dbsr/add`, {id: newUser.rows[0].id, username: newuser.username, isTeacher: newuser.isTeacher, classes: newuser.classes }, {headers: {'content-type': 'application/json'}})
        } catch(err){
            throw new Error('error adding new user ' + err)
        }

        logger.info('added user - ' + newUser.rows[0].id)
        res.status(200).json({id: newUser.rows[0].id, token: token});

    } catch(err){
        logger.error(err.message);
        res.status(500).json({
            message: 'server error!'
        })
    }
})

router.get("/verify", authorize, (req, res) => {
    try {
      res.status(200).json({
          valid: true,
          id: req.id,
          username: req.username[0],
          isTeacher: req.isTeacher == 'false' ? false : true,
          isAdmin: req.isAdmin == 'false' ? false : true
        });

    } catch (err) {
      logger.error(err.message);
      res.status(500).json({
          message: 'server error!'
      });
    }
});

module.exports = router;
