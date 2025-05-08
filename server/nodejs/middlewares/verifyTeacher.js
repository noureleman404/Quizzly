
const verifyTeacher = (req, res, next) => {
    if(req.userType !== "teacher"){
        return res.status(401).json({ message: "UnAuthorized !" });
    }
    next();
};

module.exports = { verifyTeacher };