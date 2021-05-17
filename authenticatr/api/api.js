const express = require('express');
const router = express.Router();
const logger = require('logplease').create('api')

const { userpool, adminpool } = require('../src/database');
const genJWT = require('../src/jwt');
const check = require('../src/check');
const authorize = require('../src/authorize');

router.post("/login", check, async (req, res) => {
    try {  
        const users = await userpool.query("SELECT * FROM users");
        const user = users.rows[0].find(user => user.username == req.body.username);

        if(user == null){
            return res.status(401).send({
                message: 'user not found!',
            })
        }

        const valid = await bcrypt.compare(user.passwd,req.body.password);

        if(!valid){
            return res.status(401).send({
                message: 'user not found!',
            });
        }

        const token = genJWT(user.id, user.isAdmin, user.isTeacher);
        return res.json(token);

    } catch(error){
        logger.error(error.message);
        return res.status(500).send({
            message: 'server error!',
        })
    }
})

router.post("/register", check, authorize, async (req, res) => {
    try {
        if(!req.isAdmin){
            return res.status(403).send({
                message: 'insufficient permissions to register user',
            })
        }
        
        const users = await adminpool.query("SELECT * FROM users");
        const user = users.find(user => user.username == req.body.newuser.username);
        if(user != null){
            return res.status(404).send({
                message: 'user exists!',
            })
        }
        const newUser = await pool.query("INSERT INTO user (username, passwd, isAdmin, isTeacher) VALUES ($1, $2, $3, $4) RETURNING *", [req.body.newuser.username, req.body.newuser.password, req.body.newuser.isAdmin, req.body.newuser.isTeacher]);
        const token = genJWT(newUser.rows[0].id);
        res.json(newUser.id,token);
    } catch(error){
        logger.error('error.message');
        return res.status(500).send({
            message: 'server error!',
        })
    }
})

router.post("/verify", authorize, (req, res) => {
    try {
      res.json({
          valid: true,
          isTeacher: req.isTeacher,
          isAdmin: req.isAdmin,
        });
    } catch (err) {
      console.error(err.message);
      res.status(500).send({
          message: 'server error!',
      });
    }
  });
  
  module.exports = router;