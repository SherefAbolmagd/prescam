require("dotenv").config();
const path = require('path');

const getInstanceWidget = async (req, res, next) => {
  res.sendFile(path.join(__dirname, '../public/widget.html'));
};

module.exports = {
  getInstanceWidget
};
