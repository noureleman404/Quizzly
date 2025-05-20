const verifyStudent = (req, res, next) => {
    if(req.userType !== "student"){
        return res.status(401).json({ message: "UnAuthorized !" });
    }
    next();
};

module.exports = { verifyStudent };