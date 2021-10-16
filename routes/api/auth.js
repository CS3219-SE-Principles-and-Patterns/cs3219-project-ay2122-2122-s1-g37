const router = require("express").Router();
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
require("dotenv").config();

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const accounts = [];

const resets = new Map();

router.post("/recover", async (req, res) => {
	const account = accounts.find(account => account.email === req.body.email);
	if (account == null) {
		// email not found.
		console.log("email not found");
		
		return res.status(401).json({
			message: "Account not registered."
		});
	}
	
	const email = account.email;
	// map some random id to email
	const randomID = crypto.randomBytes(16).toString('hex');
	resets.set(randomID, email);
	console.log(`random ID mapped to email: ${randomID}`);
	
	const password = account.password;
	const resetToken = jwt.sign({email: email}, password, { expiresIn: '15m' });
	console.log(`signed reset token: ${resetToken}`);
	
	const link = "localhost:3000/resetapi/" + randomID + "/" + resetToken;
	console.log(`link: ${link}`);
	
	//send email
	
	// To remove after adding email capability
	return res.status(200).json({
		message: "for testing",
		ID: randomID,
		token: resetToken
	})
});

router.put("/reset/:_id/:_token", async (req, res) => {
	try {
		// change the errors when want to test what went wrong
		const randomID = req.params._id;
		if (randomID == null) {
			// no random id
			console.log("randomID not given");
			
			return res.status(400).json({
				message: "Invalid link."
			});
		}
		
		var email = resets.get(randomID);
		if (typeof email == undefined) {
			// somehow email not mapped or invalid
			console.log("email somehow not mapped");
			
			return res.status(400).json({
				message: "Invalid link."
			});
		}
		
		const resetToken = req.params._token;
		if (resetToken == null) {
			// no token
			console.log("resetToken not given")
			
			return res.status(400).json({
				message: "Invalid link."
			});
		}
		
		// get password from accounts list
		let oldPassword = null;
		let idx = -1;
		for (let i = 0; i < accounts.length; i++) {
			if (accounts[i].email === email) {
				oldPassword = accounts[i].password
				idx = i;
			}
		}
		
		if (oldPassword == null) {
			console.log("Account somehow not found");
			
			return res.status(401).json({
				message: "Account somehow not found."
			});
		}
		
		// check if token invalid or expired.
		jwt.verify(resetToken, oldPassword, (err, account) => {
			if (err) {
				// token expired or invalid
				console.log("token invalid or expired");
				
				return res.status(400).json({
					message: "Invalid link."
				});
			}
		});
		
		const newPassword = await bcrypt.hash(req.body.password, 10);
		// set new password
		accounts[idx].password = newPassword;
		
		// delete map since able to reset
		resets.delete(randomID);
		
		console.log("Password resetted");
		return res.status(200).json({
			message: "Password resetted successfully."
		});
	} catch(err) {
		return res.status(500).send(err.message);
	}
});

router.post("/register", async (req, res) => {
	try {
		// maybe will change to better errors later to include what is missing
		if (req.body.displayname == null) {
			console.log("no displayname provided");
			
			// 400 might not be the best option here
			return res.status(400).json({
				message: "Please enter your desired displayname."
			});
		}
		
		if (req.body.email == null) {
			console.log("no email provided");
			
			// 400 might not be the best option here
			return res.status(400).json({
				message: "Please enter your desired email."
			});
		}
		
		if (req.body.password == null) {
			console.log("no password provided");
			
			// 400 might not be the best option here
			return res.status(400).json({
				message: "Please enter your desired password."
			});
		}
		
		const password = await bcrypt.hash(req.body.password, 10);
		const email = req.body.email;
		
		// check if email already exists
		const duplicate = accounts.find(account => account.email === email);
		if (duplicate != null) {
			console.log("email already exists");
			
			// 409 might not be the best option here
			return res.status(409).json({
				message: "Email already exists."
			})
		}
		
		// Create and add account
		const account = {
			email: email,
			displayname: req.body.displayname,
			password: password,
			isGoogle: false
		}
		// Need update DB also
		accounts.push(account)
		
		const accessToken = jwt.sign(account, process.env.ACCESS_SECRET, { expiresIn: '30 days' });
		
		console.log("Account created");
		// Successful account creation
		return res.status(201).json({
			message: "Account registered.",
			token: accessToken,
			displayname: account.displayname
		});
	} catch(err) {
		return res.status(500).send(err.message);
	}
});

router.get("/login", async (req, res) => {
	// depends, but may need to retrieve from db
	const account = accounts.find(account => account.email === req.body.email);
	if (account == null) {
		console.log("email not found");
		
		// email not found.
		return res.status(401).json({
			message: "Account not registered."
		});
	}
	try {
		if(await bcrypt.compare(req.body.password, account.password)) {
			// can change duration here to test expiry
			const accessToken = jwt.sign(account, process.env.ACCESS_SECRET, { expiresIn: '30 days' });
			
			console.log("logged in");
			return res.status(200).json({
				message: "Logged in successfully",
				token: accessToken,
				displayname: account.displayname
			});
		} else {
			console.log("password dont match");
			
			// password does not match.
			return res.status(401).json({
				message: "Account not registered."
			});
		}
	} catch(err) {
		return res.status(500).send(err.message);
	}
});

router.get("/authtoken", (req, res) => {
	const token = req.body.token;
	if (token == null) {
		console.log("no token provided");
		
		return res.status(401).json({
			message: "Account not authenticated."
		});
	}
	
	jwt.verify(token, process.env.ACCESS_SECRET, (err, account) => {
		if (err) {
			console.log("token invalid or expired");
			
			return res.status(401).json({
				message: "Account not authenticated."
			});
		}
		
		console.log("account authenticated");
		return res.status(200).json({
			message: "Account authenticated."
		});
	});
});

module.exports = router;