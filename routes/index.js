const express = require('express');
const router = express.Router();
const authantication = require("../middleware/auth");
const indexController = require("../controllers/index.controller");
const stripe = require('stripe')('sk_test_...');

/* GET Landing page. */
router.get('/', indexController.getLandingPage);
/* GET Login page. */
router.get('/login', indexController.getLoginPage);
/* GET Login page. */
router.get('/signup', indexController.getSignupPage);
/* GET Overview page. */
router.get('/overview', authantication, indexController.getOverviewPage);
/* GET Instances page. */
router.get('/instances', authantication, indexController.getUserInstances);
/* GET New Instance page. */
router.get('/new', authantication, (req, res, next) => res.render('newInstance', { title: 'New Instance', user: req.user }));

module.exports = router;

