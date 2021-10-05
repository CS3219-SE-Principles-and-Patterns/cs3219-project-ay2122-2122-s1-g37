module.exports = (io) => {
	io.on("connection", (socket) => {
		console.log(socket.id);

		// Upon client sending message.
		socket.on("send-message", (msg) => {
			console.log(`Message received: ${msg}`);
			socket.broadcast.emit("receive-message", msg);

			// if no room. Should not happen. Should prevent this from happening.
			// if (room === "") {
			// 	console.log("no room should not be able to send");
			// } else {
			// 	socket.to(room).emit("msg-to-client", msg);
			// }
		});

		// join the client to the room "number" received.
		// I cannot call callback? Idk.
		socket.on("join-room", (room, cb) => {
			socket.join(room);
		});
	});
};
