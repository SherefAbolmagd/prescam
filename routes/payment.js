const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const authantication = require("../middleware/auth");

router.get("/new", authantication, paymentController.newPayment);

module.exports = router;
