const router = require("express").Router();
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const accounts = [];

router.put("/password", async (req, res) => {
	try {
		const email = req.body.email;
		const password = await bcrypt.hash(req.body.password, 10);
		
		// account confirm exists but check anyways
		let account = null;
		for (let i = 0; i < accounts.length; i++) {
			if (accounts[i].email === email) {
				// change password
				accounts[i].password = password;
				account = accounts[i];
			}
		}
		
		if (account == null) {
			return res.status(401).json({
				message: "Account somehow not found."
			});
		}
		
		return res.status(200).json({
			message: "Password resetted successfully."
		});
	} catch(err) {
		return res.status(500).send(err.message);
	}
});

router.post("/register", async (req, res) => {
	try {
		const password = await bcrypt.hash(req.body.password, 10);
		const email = req.body.email;
		
		// check if email already exists
		const duplicate = accounts.find(account => account.email === email);
		if (duplicate != null) {
			// 409 might not be the best option here
			return res.status(409).json({
				message: "Email already exists."
			})
		}
		
		// Create and add account
		// I assume displayname blank or not is handled at frontend
		const account = {
			email: email,
			displayname: req.body.displayname,
			password: password,
			isGoogle: false
		}
		// Need update DB also
		accounts.push(account)
		
		// Successful account creation
		return res.status(201).json({
			message: "Account registered."
		});
	} catch(err) {
		return res.status(500).send(err.message);
	}
});

router.get("/login", async (req, res) => {
	// depends, but may need to retrieve from db
	const account = accounts.find(account => account.email === req.body.email);
	if (account == null) {
		// email not found.
		return res.status(401).json({
			message: "email/password invalid or account not registered."
		});
	}
	try {
		if(await bcrypt.compare(req.body.password, account.password)) {
			// can change duration here to test expiry
			const accessToken = jwt.sign(account, process.env.ACCESS_SECRET, {expiresIn: '30 days' });
			return res.status(200).json({ 
				message: "Logged in successfully",
				token: accessToken
			});
		} else {
			// password does not match.
			return res.status(401).json({
				message: "email/password invalid or account not registered."
			});
		}
	} catch(err) {
		return res.status(500).send(err.message);
	}
});

router.get("/authtoken", (req, res) => {
	const token = req.body.token;
	if (token == null) {
		return res.status(401).json({
			message: "Account not authenticated."
		});
	}
	
	jwt.verify(token, process.env.ACCESS_SECRET, (err, account) => {
		if (err) {
			return res.status(401).json({
				message: "Account not authenticated."
			});
		}
		
		return res.status(200).json({
			message: "Account authenticated."
		});
	});
});

module.exports = router;