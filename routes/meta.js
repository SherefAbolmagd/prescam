const express = require("express");
const router = express.Router();
const metaController = require("../controllers/meta.controller");

router.post("/webhook", metaController.postWebhook);

router.get("/webhook", metaController.getWebhook);

module.exports = router;
