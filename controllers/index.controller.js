require("dotenv").config();
const phoneUtil =
  require("google-libphonenumber").PhoneNumberUtil.getInstance();

const FirebaseCollection = require("../providers/FirebaseCollection");
const instancesCollection = new FirebaseCollection("instances");
const contactsCollection = new FirebaseCollection("contacts");

const FirebaseAuth = require("../providers/FirebaseAuth");

const getUserInstances = async (req, res, next) => {
  try {
    console.log(req.user);
    const instances = await instancesCollection.whereEqualTo(
      "userId",
      req.user.email
    );
    res.render("instancesList", {
      title: "Instances",
      instances: instances,
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
};

const getLoginPage = async (req, res, next) => {
  res.render("auth/login", { title: "Login" });
};

const getSignupPage = async (req, res, next) => {
  res.render("auth/register", { title: "Sign Up | EasyFastAI" });
};

const getLandingPage = async (req, res, next) => {
  res.render("landingPageV2", { title: "Easy Fast AI" });
};

const getOverviewPage = async (req, res, next) => {
  const instances = await instancesCollection.whereEqualTo(
    "userId",
    req.user.email
  );

  res.render("overview", {
    title: "Overview",
    instances: instances,
    user: req.user
  });
};

module.exports = {
  getUserInstances,
  getLoginPage,
  getSignupPage,
  getLandingPage,
  getOverviewPage,
};
