const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const config = require("../config/routes");
const jwt = require("jsonwebtoken");
const FirebaseAuth = require("../providers/FirebaseAuth");
require("dotenv").config();

const FirebaseCollection = require("../providers/FirebaseCollection");
const clientsCollection = new FirebaseCollection("users");
const auth = new FirebaseAuth(
  process.env.FirebaseAuthRestAPIURL,
  process.env.enviroment == "dev"
    ? process.env.FirebaseAPIKey
    : process.env.LocalFirebaseAPIKey
);

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    // if there is error then return Error
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const body = req.body;
    const user = await auth.signInWithEmailAndPassword(
      body.email,
      body.password
    );

    console.log("====================================");
    console.log(user.data);
    console.log("====================================");

    const userDetails = await auth.getUser(user.data.localId);
    console.log("====================================");
    console.log(userDetails);
    console.log("====================================");

    if (!userDetails.emailVerified) {
      return res.render("auth/login", {
        errors: [
          {
            msg: "Please verify your email to login by clicking on the link sent to your email",
          },
        ],
      });
    }

    res.cookie("user", user.data, {
      httpOnly: true,
      secure: true,
      maxAge: 3600000 * 14 * 24,
    });
    res.cookie("userInfo", userDetails, {
      httpOnly: true,
      secure: true,
      maxAge: 3600000 * 14 * 24,
    });
    res.redirect(config.routes.overview);
  } catch (err) {
    res.render("auth/login", {
      errors: [{
        msg: "Wrong username or password, Please try again"
      }]
    });
  }
};

const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    // if there is error then return Error
    if (!errors.isEmpty()) {
      return res.render("auth/register", {
        title: "Sign Up | EasyFastAI",
        errors: errors.errors,
      });
    }

    const body = req.body;

    const payload = {
      email: body.email.toString(),
      password: body.password.toString(),
      displayName: body.displayName.toString(),
      phoneNumber: body.phoneNumber.toString(),
    };

    const user = await auth.createUserWithEmailAndPassword(
      payload.email,
      payload.password,
      payload.displayName,
      payload.phoneNumber
    );

    if (user.errorInfo) {
      return res.render("auth/register", {
        title: "Sign Up | EasyFastAI",
        errors: [{ msg: user.errorInfo.message }],
      });
    }

    const userLogin = await auth.signInWithEmailAndPassword(
      body.email,
      body.password
    );

    if (userLogin) {
      await auth.sendEmailVerification(userLogin.data.idToken);
    }

    await clientsCollection.add({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber,
    });

    res.render("auth/login", {
      success:
        "Account created, an email sent to you with a verification link please verify your account to login",
    });
  } catch (err) {
    console.log("err", err);
    res.render("auth/register", {
      errors: [
        {
          msg: "Error, Pleas try again later and if the issue still present reach out to us",
        },
      ],
    });
  }
};

module.exports = { login, signup };
