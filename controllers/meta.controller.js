require("dotenv").config();

const getWebhook = async (req, res, next) => {
  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = process.env.FB_ACCESS_TOKEN;

  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
};

const postWebhook = async (req, res, next) => {
  let body = req.body;
  console.log(body);
  // Checks this is an event from a page subscription
  if (body.object === "page") {
    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {
      //check the incoming message from primary app or not; if secondary app, exit
      if (entry.standby) {
        //if user's message is "back" or "exit", return the conversation to the bot
        let webhook_standby = entry.standby[0];
        if (webhook_standby && webhook_standby.message) {
          if (
            webhook_standby.message.text === "back" ||
            webhook_standby.message.text === "exit"
          ) {
            // call function to return the conversation to the primary app
            // chatbotService.passThreadControl(webhook_standby.sender.id, "primary");
            // chatbotService.takeControlConversation(webhook_standby.sender.id);
            console.log(webhook_standby);
          }
        }

        return;
      }

      //     // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        console.log(sender_psid, webhook_event);
        // handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        console.log(sender_psid, webhook_event);
        // handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
};

module.exports = {
  getWebhook,
  postWebhook,
};
