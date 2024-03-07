const OpenAI = require("./openai")
const WaService = require("../services/wa.service")
// const qrcodeTerminal = require("qrcode-terminal");
const qrcode = require("qrcode");

// eslint-disable-next-line require-jsdoc
class WaClient {
  // eslint-disable-next-line require-jsdoc
  constructor(name) {
    this.clientId = name;
    this.client = new Client({
      puppeteer: {
        headless: true,
        args: ["--no-sandbox"],
      },
      authStrategy: new LocalAuth({ clientId: this.clientId }),
    });

    this.client.on("ready", () => {
      console.log("Ready");
      global.sessions[name] = this.client 
    });

    this.client.on("qr", (qr) => {
      this.qr = qr;
      // qrcodeTerminal.generate(qr, { small: true });
      qrcode.toDataURL(qr, function (err, url) {
        if (err) return console.log("error occurred");
        io.emit("qrcode", url);
      });
      console.log("Qrcode Recieved");
    });
    
    this.client.on("loading_screen", (percent, message) => {
      console.log("LOADING SCREEN", percent, message);
    });
    
    this.client.on("authenticated", () => {
      console.log("AUTHENTICATED");
      io.emit("connected", "connected");
    });

    this.client.on("auth_failure", (msg) => {
      // Fired if session restore was unsuccessful
      console.error("AUTHENTICATION FAILURE", msg);
    });

    this.client.on("disconnected", (reason) => {
      console.log("Client was logged out", reason);
      delete global.sessions[name];
    });

    this.client.on("message", async (msg) => {
      const instance = await WaService.getInstance(msg);
      const botCustom = {"role": "system", "content": instance.botDescription}
      const reply = await OpenAI.createChatCompletion({"role": "user", "content": msg.body}, botCustom);
        msg.reply(reply.data.choices[0].message.content); 
    });

    this.client.initialize();

    return this.client;
  }
  // eslint-disable-next-line require-jsdoc
  getQrcode() {
    return this.qr;
  }
  // eslint-disable-next-line require-jsdoc
  async sendText(to, message) {
    return this.client.sendMessage(to + "@c.us", message);
  }
  // eslint-disable-next-line require-jsdoc
  clientInit() {
    return this.client.initialize();
  }
}

module.exports = WaClient;
