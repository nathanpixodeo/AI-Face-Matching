var express = require('express');
var router = express.Router();
const auth = require("../middleware/auth");
const faceControllers = require("../controllers/faceControls")
const areaControllers = require("../controllers/areaControls")
const User = require("../models/user");
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

// INDEX API
router.get('/', (req, res, next) => {
	res.send('respond with a resource');
});

router.post('/face-matching', auth, (req, res, next) => {
	const { type, mode, in_1, in_2 } = req.body;
	res.json(req.body);
});

router.post("/welcome", auth, (req, res) => {
	//res.status(200).send("Welcome 🙌 ");
});

// AUTHORIZATION PROCESSING
router.post("/auth/register", async (req, res) => {
	try {
		const { first_name, last_name, email, password, phone, phone_prefix, birthday } = req.body;

		if (!(email && password && first_name && last_name)) {
			res.status(400).send("All input is required");
		}

		const oldUser = await User.findOne({ email });
		if (oldUser) {
			return res.status(409).send("User Already Exist. Please Login");
		}
		encryptedPassword = await bcrypt.hash(password, 10);
		const user = await User.create({
			first_name,
			last_name,
			email: email.toLowerCase(),
			password: encryptedPassword,
			phone,
			phone_prefix,
			birthday
		});
		const token = jwt.sign(
			{ user_id: user._id, email },
			process.env.TOKEN_KEY,
			{
				expiresIn: "2h",
			}
		);
		user.token = token;
		res.status(201).json(user);
	} catch (err) {
		console.log(err);
	}
});

router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!(email && password)) {
			res.status(400).send("All input is required");
		}
		const user = await User.findOne({ email });
		if (user && (await bcrypt.compare(password, user.password))) {
			const token = jwt.sign(
				{ user_id: user._id, email },
				process.env.TOKEN_KEY,
				{
					expiresIn: "2h",
				}
			);
			user.token = token;
			res.status(200).json(user);
		}
		res.status(400).send("Invalid Credentials");
	} catch (err) {
		console.log(err);
	}
});


// FACE PROCESS
router.post("/post-face", faceControllers.importFaceDataToDataStore);
router.post("/check-face", faceControllers.faceMatchingInDataStore);

// AREA DATASTORE
router.post("/area/create", areaControllers.createAreaDataStore);



module.exports = router;
