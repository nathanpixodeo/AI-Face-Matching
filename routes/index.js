var express = require('express');
const fs = require("fs");
const path = require("path");
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('index', { title: 'Express' });
});

// GET IMAGES FOR VIEWERS
router.get('/gallery', (req, res, next) => {
	const { view } = req.query
	// Checking if the path exists
	var pathName = appRoot + view;
	fs.exists(pathName, function (exists) {
		if (!exists) {
			res.writeHead(404, {
				"Content-Type": "text/plain"
			});
			res.end("404 Not Found");
			return;
		}

		// Extracting file extension
		var ext = path.extname(pathName);

		// Setting default Content-Type
		var contentType = "text/plain";

		// Checking if the extension of
		// image is '.png'
		if (ext === ".png") {
			contentType = "image/png";
		}

		// Setting the headers
		res.writeHead(200, {
			"Content-Type": contentType
		});

		// Reading the file
		fs.readFile(pathName,
			function (err, content) {
				// Serving the image
				res.end(content);
			});
	});
});

module.exports = router;
