const express = require("express");
const router = express.Router();
const widgetController = require("../controllers/widget.controller");

router.get("/", widgetController.getInstanceWidget);

module.exports = router;
