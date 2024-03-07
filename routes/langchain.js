const express = require('express');
const router = express.Router();
const Langchain = require('../services/langchain');
const LangchainController = require('../controllers/langchain.controller');
const authantication = require("../middleware/auth");

/* Post Login. */
router.get('/pdf', async (req, res) => {
    const doc = await Langchain.readPDF();
    res.send(doc);
});

/* Post Login. */
// router.get('/query/:query', async (req, res) => {
//     const doc = await Langchain.embedQuery(req.params.query);
//     res.send(doc);
// });

/* Post ingest. */
router.get('/ingest/:instanceId', authantication, LangchainController.ingest);

/* Post Query. */
router.get('/query/:query', LangchainController.query);

/* Post Query. */
router.get('/apichain', LangchainController.apiChain);

module.exports = router;