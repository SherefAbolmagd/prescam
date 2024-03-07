const verify = async (req, res, next) => {
  try {
    res.status(200).send(req.query.echostr);
  } catch (err) {
    next(err);
  }
};

const events = async (req, res, next) => {
  try {
    console.log(req);
    console.log(req.body);
    console.log(req.weixin);
    res.status(200).send("OK");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  verify,
  events
};
