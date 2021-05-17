const jwt = require('jsonwebtoken');
require('dotenv').config();

function genJWT(id, isAdmin, isTeacher) {
    const payload = {
        id: id,
        isAdmin: isAdmin,
        isTeacher: isTeacher,
    }

    return jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: 30 * 60 })
}

module.exports = genJWT;