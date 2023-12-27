const createError = require('http-errors');
require("dotenv").config();
require("./config/database").connect();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
// Import and Init FACE_API
const tf = require('@tensorflow/tfjs-node');
// console.log(`Initializing TensorFlow/JS version ${tf.version_core}`);
// const faceapi = require("face-api.js");
//const tf = require('@tensorflow/tfjs');
//require('@tensorflow/tfjs-node');
const faceapi = require('@vladmandic/face-api');
const { Canvas, Image } = require("canvas");
const fileUpload = require("express-fileupload");
const cors = require('cors');
faceapi.env.monkeyPatch({ Canvas, Image });
console.log(faceapi.tf.getBackend());


// Global Value
global.appRoot = path.resolve(__dirname);

Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromDisk(appRoot + "/library/models"),
    faceapi.nets.faceLandmark68Net.loadFromDisk(appRoot + "/library/models"),
    faceapi.nets.ssdMobilenetv1.loadFromDisk(appRoot + "/library/models"),
    faceapi.nets.tinyFaceDetector.loadFromDisk(appRoot + "/library/models"),
    faceapi.nets.faceExpressionNet.loadFromDisk(appRoot + "/library/models"),
    faceapi.nets.ageGenderNet.loadFromDisk(appRoot + "/library/models")
]).then((val) => {
    // console here gives an array of undefined
    console.log("Successfully loaded Models!")
}).catch((err) => {
    console.log(err)
});


var indexRouter = require('./routes/index');
var apiRouter = require('./routes/api');

var app = express();


app.use(
    fileUpload({
        useTempFiles: true,
        limits: { fileSize: 50 * 1024 * 1024 },
        abortOnLimit: true,
    })
);

app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;