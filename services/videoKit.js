// Mapping a socket to the room it is in
const socketRoomMap = new Map();
// Mapping a room to all the sockets in the room
const roomSocketMap = new Map();
// Mapping a bufferer to a set of users that is ready to resume
const bufferReadysMap = new Map();
// Store rooms that are being held
const roomHoldSet = new Set();

module.exports = (io) => {
	const videoIO = io.of("/video");

	videoIO.on("connection", (socket) => {
		console.log(`${socket.id} connected to videoIO`);

		// 1. Join room via id
		socket.on("join-room", (roomId, callback) => {
			console.log(`${socket.id} has joined the video room ${roomId}`);
			socket.join(roomId);

			// Update mapping
			socketRoomMap.set(socket.id, roomId);
			if (roomSocketMap.has(roomId)) {
				roomSocketMap.set(roomId, [...roomSocketMap.get(roomId), socket.id]);
			} else {
				roomSocketMap.set(roomId, [socket.id]);
			}

			callback();
		});

		// 2. Cleanup after a user disconnects
		socket.on("disconnect", () => {
			if (socketRoomMap.has(socket.id) && roomSocketMap.has(socketRoomMap.get(socket.id))) {
				const roomId = socketRoomMap.get(socket.id);
				const newSockets = roomSocketMap.get(roomId).filter((id) => id != socket.id);
				roomSocketMap.set(roomId, newSockets);
			}
		});

		// 3. Broadcast URL to all other users
		socket.on("SEND_URL", (roomId, url) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				socket.to(roomId).emit("RECEIVE_URL", url);
				console.log(`${url} sent to room ${roomId}`);
			}
		});

		// 3. Broadcast timing to all other users
		socket.on("SEND_TIMING", (roomId, timing) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				socket.to(roomId).emit("RECEIVE_TIMING", timing);
				console.log(`${socket.id} sent a timing of ${timing.timing} to room ${roomId}`);
			}
		});

		// 4. Ask all other users to wait
		socket.on("REQUEST_HOLD", (roomId) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else if (roomHoldSet.has(roomId)) {
				console.log(`Room ${roomId} is still being held, ignoring this HOLD request...`);
			} else {
				roomHoldSet.add(roomId);
				socket.to(roomId).emit("HOLD", socket.id);
				console.log(`${socket.id} ask all other users to HOLD`);
			}
		});

		// 5. Ask all other users to prepare to resume at a given timing
		socket.on("REQUEST_RELEASE", (roomId, newTiming, numOfUsers) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else if (bufferReadysMap.has(socket.id)) {
				console.log(
					`${socket.id} is already waiting for release, ignoring this release request...`
				);
			} else {
				console.log(
					`${socket.id} requests for ${numOfUsers} unique readys at ${newTiming}`
				);

				if (!bufferReadysMap.has(socket.id)) {
					bufferReadysMap.set(socket.id, { readys: new Set(), target: numOfUsers });
				}
				socket.to(roomId).emit("PREPARE_RELEASE", newTiming);
			}
		});

		// 6. Tell the server that this user is ready to resume
		socket.on(
			"REQUEST_RELEASE_READY",
			(roomId, buffererId, numOfUsers, releaseSelfCallback) => {
				if (!bufferReadysMap.has(buffererId)) {
					if (roomHoldSet.has(roomId)) {
						console.log(
							`${socket.id}: Buffer entry for ${buffererId} not found but the buffering room exists, creating a buffer entry... (Total: 1)`
						);

						if (numOfUsers == 1) {
							console.log(
								`${buffererId} receive 1 total unique readys, releasing all users in ${roomId}`
							);
							console.log(`Removing ${roomId} from holdSet`);
							roomHoldSet.delete(roomId);
							socket.to(roomId).emit("RELEASE");
							releaseSelfCallback();
						} else {
							const readySet = new Set();
							readySet.add(socket.id);
							bufferReadysMap.set(buffererId, {
								readys: readySet,
								target: numOfUsers,
							});
						}
					} else {
						console.log(
							`Buffer entry for ${buffererId} not found and there is no room for it, ignoring this ready...`
						);
					}
				} else {
					const newEntry = bufferReadysMap.get(buffererId);
					newEntry.readys.add(socket.id);

					console.log(`${socket.id} sent a ready (Total: ${newEntry.readys.size})`);

					if (newEntry.readys.size >= newEntry.target) {
						console.log(
							`${buffererId} receive ${newEntry.readys.size} total unique readys, releasing all users in ${roomId}`
						);
						console.log(`Removing ${roomId} from holdSet`);

						bufferReadysMap.delete(buffererId);
						roomHoldSet.delete(roomId);
						socket.to(roomId).emit("RELEASE");
						releaseSelfCallback();
					} else {
						bufferReadysMap.set(buffererId, newEntry);
					}
				}
			}
		);

		// 7. Ask all other users to resume from holding
		socket.on("REQUEST_RELEASE_ALL", (roomId) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				console.log(`${socket.id} releasing all users in ${roomId}`);
				console.log(`Removing ${roomId} from holdSet`);
				roomHoldSet.delete(roomId);
				socket.to(roomId).emit("RELEASE");
			}
		});

		// 8. Ask all other users to resume playing
		socket.on("PLAY_ALL", (roomId) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				socket.to(roomId).emit("PLAY");
			}
		});

		// 9. Ask all other users to pause
		socket.on("PAUSE_ALL", (roomId) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				socket.to(roomId).emit("PAUSE");
			}
		});

		// 10. Ask all other users to change playback rate to a given value
		socket.on("PLAYBACK_RATE_CHANGE_ALL", (roomId, newRate) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				socket.to(roomId).emit("PLAYBACK_RATE_CHANGE", newRate);
			}
		});
	});
};
