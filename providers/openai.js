const openai = require("openai");
require("dotenv").config();
const fs = require("fs");

// eslint-disable-next-line require-jsdoc
class OpenAI {
  // eslint-disable-next-line require-jsdoc
  constructor() {
    const configuration = new openai.Configuration({
      apiKey: process.env.OPENAI_KEY,
      organization: process.env.OPENAI_ORGANIZATION,
    });

    this.chatgpt = new openai.OpenAIApi(configuration);
  }
  // eslint-disable-next-line require-jsdoc
  async createChatCompletion({ chats, systemCustom }) {
    const messages = [systemCustom, ...chats];
    return await this.chatgpt.createChatCompletion({
      model: "gpt-3.5-turbo-16k",
      messages: messages,
    });
  }
  // eslint-disable-next-line require-jsdoc
  async whisper(audio) {
    const transcription = await this.chatgpt.createTranscription(
      fs.createReadStream(audio),
      "whisper-1"
    );
    return transcription;
  }
}

const singletonOpenAI = new OpenAI();

Object.freeze(singletonOpenAI);

module.exports = singletonOpenAI;
