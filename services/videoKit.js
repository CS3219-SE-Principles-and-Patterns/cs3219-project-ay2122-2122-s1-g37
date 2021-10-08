module.exports = (io) => {
	const videoIO = io.of("/video");

	videoIO.on("connection", (socket) => {
		console.log(`${socket.id} connected to videoIO`);

		// 1. Send link to all
		socket.on("send-url", (url, roomId) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				socket.to(roomId).emit("receive-url", url);
				console.log(`URL sent to room ${roomId}`);
			}
		});

		// 2. Host send timing to other users
	});
};
