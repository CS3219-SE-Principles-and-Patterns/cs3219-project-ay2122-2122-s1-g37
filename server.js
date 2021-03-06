const express = require("express");
const app = express();
const cors = require("cors");
const { instrument } = require("@socket.io/admin-ui");
const path = require("path");
const compression = require("compression");

const ping = require("./routes/api/ping");
const rooms = require("./routes/api/rooms");
const auth = require("./routes/api/auth");

const { Server } = require("socket.io");

app.use(express.json());
app.use(cors());
app.use(compression());
app.get("/api/ping", ping);
app.use("/api/rooms", rooms);
app.use("/api/auth", auth);

// Serve static assets if in production
if (process.env.NODE_ENV === "production") {
	app.use(express.static("client/build"));
	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
	});
}

const server = app.listen("8080", () => {
	console.log("Server started on port 8080...");
});

const io = new Server(server, {
	cors: {
		origin: [
			"http://localhost:3000",
			"https://admin.socket.io/",
			"http://13.250.235.202:3000/",
			"http://peerwatch.ap-southeast-1.elasticbeanstalk.com/",
		],
		credentials: false,
	},
});

const { adapter } = require("./services/redis");
io.adapter(adapter);

// Add events, middlewares and other addons to the socket
require("./services/roomKit")(io);
require("./services/videoKit")(io);

// pubClient.duplicate().set()

// Admin tool for socket.io
instrument(io, { auth: false, namespaceName: "/" });

module.exports = app;