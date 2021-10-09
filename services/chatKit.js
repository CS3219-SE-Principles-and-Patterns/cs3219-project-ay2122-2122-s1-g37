const retrieveUserLists = () => {
	//some way to retrieve current user list from DB?
}

let userLists = new Map();

const retrieveRoomUserList = (roomId) => {
	if (userLists.has(roomId)) {
		return userLists.get(roomId);
	} else {
		return [];
	}
}

module.exports = (io) => {
	const chatIO = io.of("/chat");
	
	chatIO.on("connection", (socket) => {
		// Might have better way of doing this
		let userRoomId;
		console.log(`${socket.id} connected to chatIO`);

		// Upon client sending message.
		socket.on("send-message", (msg, roomId) => {
			console.log(`Message received: ${msg}`);
			// If no room. Should not happen. Should prevent this from happening.
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				socket.to(roomId).emit("receive-message", msg);
				console.log(`Message sent to room ${roomId}`);
			}
		});

		// join the client to the room "number" received.
		socket.on("join-room", (roomId, callback) => {
			console.log(`${socket.id} has joined the room ${roomId}`);
			// idk a better way to do this.
			userRoomId = roomId;
			socket.join(roomId);
			
			// retrieve the user list and add this client inside
			
			let userList = retrieveRoomUserList(roomId);
			userList.push({ id: userList.length + 1, name: `${socket.id}`, isHost: false });
			userLists.set(roomId, userList);
			socket.to(roomId).emit("update-user-list", userList);
			socket.emit("update-user-list", userList);
			
			callback();
		});
		
		socket.on('disconnect', function(){
			socket.to(userRoomId).emit("receive-message", `${socket.id} has left the chat`);
			
			let userList = retrieveRoomUserList(userRoomId);
			// might have better way. Find or idk man.
			for (var i = 0; i < userList.length; i++) {
				if (userList[i].name == `${socket.id}`) {
					userList.splice(i, 1);
				}
			}
			userLists.set(userRoomId, userList);
			socket.to(userRoomId).emit("update-user-list", userList);
		});
	});
};
