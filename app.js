const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
require("./providers/firebase");

const indexRouter = require("./routes/index");
const authRouter = require("./routes/auth");
const waRouter = require("./routes/wa");
const paymentRouter = require("./routes/payment");
const langchainRouter = require("./routes/langchain");
const wechatRouter = require("./routes/wechat");
const widgetRouter = require("./routes/widget");
const metaRouter = require("./routes/meta");

const app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(function (req, res, next) {
  res.io = io;
  next();
});
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/wa", waRouter);
app.use("/payment", paymentRouter);
app.use("/langchain", langchainRouter);
app.use("/wechat", wechatRouter);
app.use("/widget", widgetRouter);
app.use("/meta", metaRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

global.sessions = {};
global.io = io;

const init = require("./init");
init();

module.exports = { app: app, server: server };
