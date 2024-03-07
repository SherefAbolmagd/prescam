const WhatsAppServer = require("./providers/sessions");

const FirebaseCollection = require("./providers/FirebaseCollection");
const instancesCollection = new FirebaseCollection("instances");

require("./services/cycle");

require("dotenv").config();
const mongoose = require("mongoose");

const uri = "**************************************************";

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));

async function initialize() {
  db.once("open", async function () {
    console.log("Connected successfully");
    const instances = await instancesCollection.all();
    for (let index = 0; index < instances.length; index++) {
      const element = instances[index];
      if (element.connected == false) continue;
      const client = new WhatsAppServer();
      client.createSession(element.instanceId);
    }
  });
}

module.exports = initialize;
