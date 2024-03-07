const FirebaseCollection = require("../providers/FirebaseCollection");
const instancesCollection = new FirebaseCollection("instances");
const contactsCollection = new FirebaseCollection("contacts");
const messagesCollection = new FirebaseCollection("messages");
require("dotenv").config();
const stripe = require("stripe")(
  process.env.enviroment == "dev"
    ? process.env.DevSecretKeyStripe
    : process.env.LocalSecretKeyStripe
);

const newPayment = async (req, res, next) => {
  const body = req.body;
  const query = req.query;
  const user = req.user;

  console.log('====================================');
  console.log(req.query);
  console.log('====================================');

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: "*****************************",
        // For metered billing, do not pass quantity
        quantity: 1,
      },
    ],
    // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
    // the actual Session ID is returned in the query parameter when your customer
    // is redirected to the success page.
    success_url:
    process.env.enviroment == "dev" ? process.env.URLDev : process.env.URLLocal + "/wa/instance/" + query.instanceId + "?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "https://easyfastai.com/payment/fail",
  });

  // Redirect to the URL returned on the Checkout Session.
  // With express, you can redirect with:
  return res.redirect(303, session.url);
};

module.exports = {
  newPayment
};
