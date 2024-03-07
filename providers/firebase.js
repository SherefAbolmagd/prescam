require("dotenv").config();
const admin = require("firebase-admin");
const serviceAccount = require("../config/" + process.env.enviroment + ".json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});