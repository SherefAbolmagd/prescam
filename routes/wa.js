const express = require("express");
const router = express.Router();
const waController = require("../controllers/wa.controller");
const authantication = require("../middleware/auth");

router.get("/instance/:id", authantication, waController.getInstanceDetails);

router.get("/instance/:id/messages", authantication, waController.getInstanceMessages);

router.post("/new", authantication, waController.newInstance);

router.post("/customBot", authantication, waController.customeBot);

router.post("/aibot", authantication, waController.aibotToggle);

router.post("/langchain", authantication, waController.langchainToggle);

router.get("/sendText/:instanceId/:to/:message", authantication, waController.sendText);

router.get("/conversation/:instanceId/:contact", authantication, waController.getMessages);

router.post("/upload/:instanceId", authantication, waController.uploadFiles);

router.get("/documents/review/:instanceId/:fileName", authantication, waController.reviewFile);

router.get("/documents/remove/:instanceId/:fileName", authantication, waController.removeFile);

module.exports = router;
