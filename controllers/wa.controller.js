const FirebaseCollection = require("../providers/FirebaseCollection");
const instancesCollection = new FirebaseCollection("instances");
const contactsCollection = new FirebaseCollection("contacts");
const messagesCollection = new FirebaseCollection("messages");
const WhatsAppServer = require("../providers/sessions");
require("dotenv").config();
const stripe = require("stripe")(
  process.env.enviroment == "dev"
    ? process.env.DevSecretKeyStripe
    : process.env.LocalSecretKeyStripe
);
const formidable = require("formidable");
const fs = require("fs");

const sendText = async (req, res, next) => {
  try {
    global.sessions[req.params.instanceId].sendMessage(
      req.params.to + "@c.us",
      req.params.message
    );
    const text = {
      from: global.sessions[req.params.instanceId].info.me.user,
      to: req.params.to,
      body: req.params.message,
      instanceId: parseInt(req.params.instanceId),
      type: "out",
    };
    const messages = await messagesCollection.add(text);
    res.status(200).send({ status: "Sucess" });
  } catch (err) {
    next(err);
  }
};

const customeBot = async (req, res, next) => {
  try {
    const user = req.user;
    const body = req.body;
    const query = await instancesCollection.whereEqualTo(
      "instanceId",
      body.instanceId
    );
    if (user.email != query[0].userId)
      return res.status(404).send({ status: "Not Found" });
    const updated = await instancesCollection.update(query[0].id, {
      botDescription: body.text,
    });
    res.status(200).send(updated);
  } catch (err) {
    res.send(err);
  }
};

const aibotToggle = async (req, res, next) => {
  try {
    const user = req.user;
    const query = await instancesCollection.whereEqualTo(
      "instanceId",
      req.body.instanceId
    );
    if (query.length > 0)
      if (query[0].userId !== user.email)
        return res.status(404).send("Not Found");

    const updated = await instancesCollection.update(query[0].id, {
      aibot: req.body.aibot,
    });
    res.status(200).send(updated);
  } catch (err) {
    res.send(err);
  }
};

const langchainToggle = async (req, res, next) => {
  try {
    const user = req.user;
    const query = await instancesCollection.whereEqualTo(
      "instanceId",
      req.body.instanceId
    );
    if (query.length > 0)
      if (query[0].userId !== user.email)
        return res.status(404).send("Not Found");

    const updated = await instancesCollection.update(query[0].id, {
      langchain: req.body.langchain,
    });
    res.status(200).send(updated);
  } catch (err) {
    res.send(err);
  }
};

const getInstanceDetails = async (req, res, next) => {
  const instanceId = req.params.id;
  const user = req.user;

  const instance = await instancesCollection.whereEqualTo(
    "instanceId",
    parseInt(instanceId)
  );
  if (instance.length > 0)
    if (instance[0].userId !== user.email)
      return res.status(404).send("Not Found");

  if (req.query.session_id && instance[0].payment == false) {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        req.query.session_id
      );
      if (session.success_url.includes(instance[0].instanceId)) {
        const upadated = await instancesCollection.update(instance[0].id, {
          payment: true,
          paymentSessionId: req.query.session_id,
        });
        instance[0] = { ...instance[0], ...upadated };
      }
    } catch (error) {
      console.log("====================================");
      console.log(error);
      console.log("====================================");
    }
  }

  const contacts = await contactsCollection.whereEqualTo(
    "instanceId",
    parseInt(instanceId)
  );

  const messages = await messagesCollection.whereEqualTo(
    "instanceId",
    parseInt(instanceId)
  );

  !global.sessions[instanceId] &&
    new WhatsAppServer().createSession(instanceId);

  var uploadedFiles = [];
  const baseDirectoryPath = `${__dirname}/../documents/${instanceId}/`;
  if (!fs.existsSync(baseDirectoryPath)) {
    fs.mkdirSync(baseDirectoryPath);
  }
  fs.readdir(baseDirectoryPath, (err, files) => {
    files.forEach((file) => {
      if (file != "data") uploadedFiles.push(file);
    });
    res.render("instance", {
      title: "Instances",
      instanceId: instanceId,
      instance: instance[0],
      messages: messages,
      contacts: contacts,
      status: global.sessions[instanceId] ? "connected" : "not connected",
      user: req.user,
      uploadedFiles: uploadedFiles,
    });
  });
};

const getInstanceMessages = async (req, res, next) => {
  const instanceId = req.params.id;
  const user = req.user;

  const instance = await instancesCollection.whereEqualTo(
    "instanceId",
    parseInt(instanceId)
  );
  if (instance.length > 0)
    if (instance[0].userId !== user.email)
      return res.status(404).send("Not Found");

  const contacts = await contactsCollection.whereEqualTo(
    "instanceId",
    parseInt(instanceId)
  );

  const messages = await messagesCollection.whereEqualTo(
    "instanceId",
    parseInt(instanceId)
  );

  res.render("instanceMessages", {
    title: "Instances",
    instanceId: instanceId,
    instance: instance[0],
    messages: messages,
    contacts: contacts,
    status: global.sessions[instanceId] ? "connected" : "not connected",
    user: req.user,
  });
};

const newInstance = async (req, res, next) => {
  const body = req.body;
  const user = req.user;
  const instanceId = Date.now();

  const instance = {
    ...body,
    instanceId: instanceId,
    userId: user.email,
    user: user,
    aibot: false,
    botDescription: "",
    connected: false,
    waName: "",
    waNumber: "",
    image: "/assets/images/avatars/4.jpg",
    payment: false,
    count: 0,
  };

  const query = await instancesCollection.add(instance);
  const waSession = new WhatsAppServer().createSession(instanceId);

  res.redirect("/wa/instance/" + instanceId);
};

const getMessages = async (req, res, next) => {
  const chat = await global.sessions[req.params.instanceId].getChatById(
    req.params.contact + "@c.us"
  );
  const messages = await chat.fetchMessages({ limit: 100 });
  res.status(200).send({ chat: messages });
};

const uploadFiles = async (req, res, next) => {
  const form = new formidable.IncomingForm();
  const baseDirectoryPath = `${__dirname}/../documents/${req.params.instanceId}/`;
  try {
    if (!fs.existsSync(baseDirectoryPath)) {
      fs.mkdirSync(baseDirectoryPath);
      console.log("Folder Created Successfully.");
    }
    form.parse(req, function (error, fields, file) {
      for (let i = 0; i < file.fileupload.length; i++) {
        let filepath = file.fileupload[i].filepath;
        let newpath = baseDirectoryPath;
        newpath += file.fileupload[i].originalFilename;
        console.log(filepath);
        console.log(newpath);
        //Copy the uploaded file to a custom folder
        fs.rename(filepath, newpath, () => {
          console.log("====================================");
          console.log("Uploaded file: " + newpath);
          console.log("====================================");
        });
      }
      res.redirect("/wa/instance/" + req.params.instanceId);
    });
  } catch (error) {
    res.redirect("/wa/instance/" + req.params.instanceId);
  }
};

const removeFile = async (req, res, next) => {
  const baseDirectoryPath = `${__dirname}/../documents/${req.params.instanceId}/`;
  fs.unlinkSync(baseDirectoryPath + req.params.fileName);
  res.redirect("/wa/instance/" + req.params.instanceId);
};

const reviewFile = async (req, res, next) => {
  const baseDirectoryPath = `${__dirname}/../documents/${req.params.instanceId}/`;
  res.download(baseDirectoryPath + req.params.fileName);
};

module.exports = {
  sendText,
  customeBot,
  aibotToggle,
  langchainToggle,
  getInstanceDetails,
  newInstance,
  getInstanceMessages,
  getMessages,
  uploadFiles,
  removeFile,
  reviewFile,
};
