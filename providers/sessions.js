const WaService = require("../services/wa.service");
const qrcode = require("qrcode");
const axios = require("axios");
const { encode } = require("gpt-3-encoder");
const { MongoStore } = require("wwebjs-mongo");
const mongoose = require("mongoose");

const maxAttempts = 5; // Maximum number of connection attempts add one to the desired number

class WhatsAppServer {
  constructor() {
    this.sessions = {};
    this.attemptCount = 0;
  }

  async createSession(sessionName) {
    // const session = new Client({
    //   authStrategy: new LocalAuth({ clientId: sessionName }),
    // });

    const store = new MongoStore({ mongoose: mongoose });
    const session = new Client({
      authStrategy: new RemoteAuth({
        clientId: sessionName,
        store: store,
        backupSyncIntervalMs: 300000,
      }),
    });

    session.on("remote_session_saved", () => {
      console.log('====================================');
      console.log("Session Saved On Mongo");
      console.log('====================================');
    });

    session.on("qr", (qrCode) => {
      session.qrCode = qrCode;
      console.log(`QR code generated for session ${sessionName}`);
      if (this.attemptCount < maxAttempts - 1)
        qrcode.toDataURL(qrCode, function (err, url) {
          if (err) return console.log("error occurred");
          io.emit("qrcode " + sessionName, url);
        });
      this.attemptCount++;
      if (this.attemptCount >= maxAttempts) {
        console.log(
          `Failed to connect after ${maxAttempts} attempts. Stopping QR code generation.`
        );
        io.emit("no scan " + sessionName, "no scan");
        session.destroy();
      } else {
        console.log(
          `Failed to connect. Attempt ${this.attemptCount}/${maxAttempts}. Restarting...`
        );
        initializeClient();
      }
    });

    session.on("ready", async () => {
      console.log(`WhatsApp session ${sessionName} is ready`);
      global.sessions[sessionName] = session;
      io.emit("connected " + sessionName, "connected");
      const owner = {
        connected: true,
      };
      const url = await session.getProfilePicUrl(session.info.me._serialized);
      // Check if the contact has a profile picture
      if (url) {
        // Make an HTTP request to retrieve the photo
        await axios
          .get(url, { responseType: "arraybuffer" })
          .then((response) => {
            // Convert the image buffer to base64
            const base64Image = Buffer.from(response.data, "binary").toString(
              "base64"
            );
            owner.image = "data:image/jpeg;base64," + base64Image;
          })
          .catch((error) => {
            console.error("Failed to retrieve contact photo:", error);
          });
      } else {
        console.log("Contact does not have a profile picture.");
      }
      owner.waName = session.info.pushname;
      owner.waNumber = session.info.me.user;
      WaService.editInstance(sessionName, owner);
    });

    session.on("message", async (message) => {
      const instance = await WaService.getInstanceDetails(sessionName);
      if (instance?.aibot == false) {
        return;
      }
      if (message.type == "ptt") {
        const audio = await message.downloadMedia();

        const transcription = await WaService.whisper(audio);

        if (transcription?.data?.text) {
          message.body = transcription.data.text;
          message.reply("*Transcript:* " + message.body);
        } else {
          message.reply(
            "Sorry I didn't get that could you repeat that once more."
          );
          return;
        }
      } else if (
        message.isStatus ||
        message.broadcast ||
        message.type != "chat" ||
        message.from.includes("g")
      ) {
        return;
      }

      console.log(message);
      const chat = await message.getChat();
      console.log(message.from);
      session.sendSeen(message.from);
      chat.sendStateTyping();
      if (encode(message.body).length > 1000) {
        chat.clearState();
        console.log("Too Long: ", encode(message.body).length);
        message.reply(
          "Sorry this text is too long for me to process, Would you please try again with small amount of words?"
        );
        return;
      }
      const msg = await WaService.addmsg(
        { ...message, botReply: false },
        sessionName
      );
      if (msg == false) {
        chat.clearState();
        return;
      }
      const reply = await WaService.openaiReply(message, sessionName);
      const contact = await WaService.addContact(message, sessionName);
      if (reply) {
        await WaService.addmsg({ ...message, botReply: reply }, sessionName);
        message.reply(reply);
      }
      chat.clearState();
    });

    // session.on("message_create", async (message) => {
    //   console.log(message);
    // });

    session.on("disconnected", (reason) => {
      console.log("Client was logged out", reason);
      WaService.editInstance(sessionName, { connected: false });
      delete global.sessions[sessionName];
      session.destroy();
    });

    session.on("loading_screen", (percent, message) => {
      console.log("LOADING SCREEN", percent, message);
      io.emit("loading " + sessionName, "loading");
    });

    session.initialize().catch((error) => {
      console.error(
        `Error initializing WhatsApp session ${sessionName}: ${error.message}`
      );
    });

    this.sessions[sessionName] = session;
    return session;
  }

  getSession(sessionName) {
    return this.sessions[sessionName] || null;
  }

  async sendMessage(sessionName, phoneNumber, message) {
    try {
      const session = this.getSession(sessionName);

      if (!session) {
        throw new Error(`Session ${sessionName} not found`);
      }

      const number = phoneNumber.includes("@c.us")
        ? phoneNumber
        : `${phoneNumber}@c.us`;
      const chat = await session.getChatById(number);

      if (!chat) {
        throw new Error(`Chat with ${phoneNumber} not found`);
      }

      chat.sendMessage(message);
    } catch (error) {
      console.log("sendMessage function", error);
    }
  }
}

module.exports = WhatsAppServer;
