module.exports = function(req, res, next) {
    if (req.path === "/register") {
      if (![req.body.username, req.body.token, req.body.newusername, req.body.newpassword].every(Boolean)) {
        return res.status(401).json({message: "invalid credentials"});
      } 
    } else if (req.path === "/login") {
      if (![req.body.username, req.body.password].every(Boolean)) {
        return res.status(401).json({message: "invalid credentials"});
      } 
    }
  
    next();
  };