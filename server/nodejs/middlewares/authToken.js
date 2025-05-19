const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; 

    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }

    jwt.verify(token, "123", (err, decoded) => {
        if (err) {
            console.log(err)
            return res.status(401).json({ message: "UnAuthorized !" });
        }
        // console.log(decoded);
        req.userID = decoded.id;
        req.userType = decoded.type;
        req.userName = decoded.userName;
        // console.log(decoded.userName);
        next();
    });
};

module.exports = { verifyToken };