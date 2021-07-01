const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const logger = require('logplease').create('api');

const { userpool, adminpool } = require('../src/database')
const genJWT = require('../src/jwt')
const check = require('../src/check')
const authorize = require('../src/authorize')

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
                const token = genJWT(user.id, user.isAdmin, user.isTeacher);
                return res.json({message: 'success', token: token});
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
        
        const users = await userpool.query("SELECT * FROM users")
        const user = users.rows.find(user => user.username == req.body.newuser.username);
        if(user != null){
            res.status(400).json({
                message: "user exists!"
            })
        }
        
        const hasher = async (saltRounds = 10) => {
            try {
                return await bcrypt.hash(req.body.newuser.password, saltRounds);
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

        const newUser = await adminpool.query("INSERT INTO users (username, passwd, isAdmin, isTeacher) VALUES ($1, $2, $3, $4) RETURNING *", [req.body.newuser.username, hashed, req.body.newuser.isAdmin, req.body.newuser.isTeacher]);
        const token = genJWT(newUser.rows[0].id);

        logger.info('added user - ' + newUser.rows[0].id)
        res.status(200).json({id: newUser.rows[0].id, token: token});

    } catch(err){
        logger.error(err.message);
        res.status(500).json({
            message: 'server error!'
        })
    }
})

router.post("/verify", authorize, (req, res) => {
    try {
      res.status(200).json({
          valid: true,
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
