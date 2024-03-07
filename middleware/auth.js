const jwt = require("jsonwebtoken");
const config = require("../config/routes");
const FirebaseAuth = require("../providers/FirebaseAuth");
const auth = new FirebaseAuth(process.env.FirebaseAuthRestAPIURL, process.env.LocalFirebaseAPIKey);
require("dotenv").config();

const verifyToken = async (req, res, next) => {
  const user =
    req.body.user || req.query.user || req.headers["x-access-user"] || req.cookies["user"];

  if (!user) {
    return res.redirect(config.routes.homePage)
  }
  try {
    const decoded = await auth.getUser(user.localId);
    req.user = decoded;
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
  return next();
};

module.exports = verifyToken;