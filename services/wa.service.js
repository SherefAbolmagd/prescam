const FirebaseCollection = require("../providers/FirebaseCollection");
const contactsCollection = new FirebaseCollection("contacts");
const instancesCollection = new FirebaseCollection("instances");
const messagesCollection = new FirebaseCollection("messages");
const tokensCollection = new FirebaseCollection("tokens");
const langchain = require("../services/langchain");
const OpenAI = require("../providers/openai");
const axios = require("axios");
const fs = require("fs");
const Stream = require("stream");
const path = require("path");
const { encode, decode } = require("gpt-3-encoder");

// eslint-disable-next-line require-jsdoc
class WaService {
  // eslint-disable-next-line require-jsdoc
  async addContact(msg, sessionName) {
    try {
      const contact = await contactsCollection.whereEqualTo(
        "mobile",
        msg.from.slice(0, -5)
      );
      if (contact.length > 0 && contact[0].instanceId == parseInt(sessionName))
        return contact;

      const contactImage = await msg.getContact();
      const url = await contactImage.getProfilePicUrl();
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
            msg.image = base64Image;
          })
          .catch((error) => {
            console.error("Failed to retrieve contact photo:", error);
            msg.image = fs.readFileSync(
              path.resolve(__dirname, "../") + "/public/assets/images/anno.jpg",
              "base64"
            );
          });
      } else {
        console.log("Contact does not have a profile picture.");
        msg.image = fs.readFileSync(
          path.resolve(__dirname, "../") + "/public/assets/images/anno.jpg",
          "base64"
        );
      }
      console.log("====================================");
      const query = await contactsCollection.add({
        name: msg._data.notifyName,
        mobile: msg.from.slice(0, -5),
        instanceId: parseInt(sessionName),
        image: msg.image,
        deviceType: msg.deviceType,
      });
      return query;
    } catch (error) {
      console.log("addContact function", error);
    }
  }

  // eslint-disable-next-line require-jsdoc
  async addmsg(msg, sessionName) {
    try {
      let text = {
        contact: msg.botReply ? msg.to.slice(0, -5) : msg.from.slice(0, -5),
        instanceId: parseInt(sessionName),
      };
      let message = {
        from: msg.botReply ? msg.to.slice(0, -5) : msg.from.slice(0, -5),
        to: msg.botReply ? msg.from.slice(0, -5) : msg.to.slice(0, -5),
        type: msg.botReply ? "out" : "in",
        botReply: msg.botReply ? true : false,
        content: msg.botReply ? msg.botReply : msg.body,
        role: msg.botReply ? "assistant" : "user",
        timeStamp: Date.now(),
      };
      let userInfo = {
        from: msg.from.slice(0, -5),
        to: msg.to.slice(0, -5),
        type: "default",
        botReply: false,
        content: "my name is " + msg._data.notifyName,
        role: "user",
        timeStamp: Date.now(),
      };
      let conv = await messagesCollection.one(`${sessionName}_${msg.from}`);
      if (conv) {
        conv = await messagesCollection.updateAppendMessage(
          `${sessionName}_${msg.from}`,
          text,
          message
        );
      } else {
        conv = await messagesCollection.addWithId(
          `${sessionName}_${msg.from}`,
          {
            ...text,
            messages: msg._data.notifyName ? [userInfo, message] : [message],
          }
        );
      }
      const instance = await instancesCollection.whereEqualTo(
        "instanceId",
        parseInt(sessionName)
      );
      await instancesCollection.update(instance[0].id, {
        count: instance[0].count + 1,
      });
      return instance[0].count >= 99 && instance[0].payment == false
        ? false
        : conv;
    } catch (error) {
      console.log("addmsg function", error);
    }
  }

  async openaiReply(msg, sessionName) {
    try {
      const instance = await instancesCollection.whereEqualTo(
        "instanceId",
        parseInt(sessionName)
      );
      if (instance[0].aibot && instance[0].langchain) {
        return langchain.query(msg.body, sessionName);
      } else if (instance[0].aibot) {
        const conv = await messagesCollection.one(`${sessionName}_${msg.from}`);

        const history = [
          {
            role: "user",
            content: msg.body,
          },
        ];
        const content = [];
        const recentMessages =
          conv.messages.length < 5 ? conv.messages : conv.messages.slice(-4);
        recentMessages.forEach((element) => {
          history.push({ role: element.role, content: element.content });
          content.push(element.content);
        });

        const botCustom = {
          role: "system",
          content: instance[0].botDescription,
        };

        const reply = await OpenAI.createChatCompletion({
          chats: history,
          systemCustom: botCustom,
        });

        const inputTokens = [...content, botCustom.content];
        const outputTokens = reply.data.choices[0].message.content;
        const inputEncoded = encode(inputTokens.join(" "));
        const outputEncoded = encode(outputTokens);

        console.log("====================================");
        console.log("Input Tokens: ", inputEncoded.length);
        console.log(
          "Price Input Tokens: $",
          (inputEncoded.length / 1000) * 0.003
        );
        console.log("Output Tokens: ", outputEncoded.length);
        console.log(
          "Price Output Tokens: $",
          (inputEncoded.length / 1000) * 0.004
        );
        console.log("====================================");

        instancesCollection.update(instance[0].id, {
          inputTokens: instance[0].inputTokens
            ? instance[0].inputTokens + inputEncoded.length
            : inputEncoded.length,
          outputTokens: instance[0].outputTokens
            ? instance[0].outputTokens + outputEncoded.length
            : outputEncoded.length,
        });

        tokensCollection.add({
          inputTokens: inputEncoded.length,
          outputTokens: outputEncoded.length,
          instanceId: parseInt(sessionName),
        });

        return reply.data.choices[0].message.content;
      } else {
        return false;
      }
    } catch (error) {
      console.log("openaiReply function", error);
    }
  }

  // eslint-disable-next-line require-jsdoc
  async editInstance(sessionName, data) {
    try {
      const instance = await instancesCollection.whereEqualTo(
        "instanceId",
        parseInt(sessionName)
      );
      const instanceUpdated = await instancesCollection.update(
        instance[0].id,
        data
      );
      return instanceUpdated;
    } catch (error) {
      console.log("editInstance function", error);
    }
  }

  // eslint-disable-next-line require-jsdoc
  async whisper(message) {
    try {
      fs.writeFile("./public/temp.ogg", message.data, "base64", function (err) {
        if (err) {
          console.log(err);
        }
      });
      return await OpenAI.whisper("./public/temp.ogg");
    } catch (error) {
      console.log("whisper function", error);
    }
  }

  async getInstanceDetails(sessionName) {
    const instance = await instancesCollection.whereEqualTo(
      "instanceId",
      parseInt(sessionName)
    );
    if (instance[0]) return instance[0];
    else return false;
  }
}

const singletonWaService = new WaService();

Object.freeze(singletonWaService);

module.exports = singletonWaService;
