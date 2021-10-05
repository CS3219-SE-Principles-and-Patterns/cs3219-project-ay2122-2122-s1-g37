module.exports = (io) => {
	io.on("connection", (socket) => {
		console.log(socket.id);

		// Upon client sending message.
		socket.on("send-message", (msg, roomId) => {
			console.log(`Message received: ${msg}`);
			// if no room. Should not happen. Should prevent this from happening.
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				socket.to(roomId).emit("receive-message", msg);
				console.log(`Message sent to room ${roomId}`);
			}
		});

		// join the client to the room "number" received.
		// I cannot call callback? Idk.
		socket.on("join-room", (roomId, callback) => {
			console.log(`${socket.id} has joined the room ${roomId}`);
			socket.join(roomId);
			callback();
		});
	});
};
