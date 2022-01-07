const jwt = require('jsonwebtoken');
require('dotenv').config();

function genJWT(user, secret, expiresIn) {
    const payload = {
        id: user.id,
        isAdmin: user.isAdmin,
        isTeacher: user.isTeacher,
    }

    return jwt.sign(payload, secret, {expiresIn: expiresIn})
}

module.exports = genJWT;