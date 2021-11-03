const db = require("../services/db");
const { redisClient, client } = require("./redis");

const VIDEO_PREFIX_SOCKETROOM = "VIDEO_SOCKETROOM";
const VIDEO_PREFIX_ROOMSOCKETS = "VIDEO_ROOMSOCKETS";
const VIDEO_PREFIX_BUFFERREADYS = "VIDEO_BUFFERREADYS";
const VIDEO_PREFIX_ROOMHOLDERS = "VIDEO_ROOMHOLDERS";
const VIDEO_PREFIX_SOCKETUSER = "VIDEO_SOCKETUSER";

const MAX_DISCONNECTION_RETRIES = 3;

const disconnectUser = (socketId, userId, roomId, retries) => {
	if (retries <= 0) {
		console.log(`User ${userId} failed to disconnect after retrying, abort disonnection`);
		return;
	}

	const sql = "DELETE FROM users_in_rooms WHERE roomId = ? AND userId = ?";
	db.query(sql, [roomId, userId], (derr, dres) => {
		if (derr) {
			console.log(`User ${userId} failed to disconnect, attempting another disconnect...`);
			disconnectUser(socketId, userId, roomId, retries - 1);
			return;
		}

		redisClient
			.del(`${VIDEO_PREFIX_SOCKETUSER}_${socketId}`)
			.then((res) => {})
			.catch((err) => console.log(err));

		if (dres.affectedRows === 0) {
			console.log("Room or user does not exist");
		} else {
			console.log("User disconnected...");
		}
	});
};

const deleteRoom = (roomId) => {
	const sql = "DELETE FROM rooms WHERE roomId = ?";
	db.query(sql, [roomId], (derr, dres) => {
		if (derr) {
			console.log(`Failed to delete room ${roomId}`);
			console.log(derr.message);
			return;
		}
		if (dres.affectedRows == 0) {
			console.log(`Room ${roomId} does not exist`);
			return;
		}

		console.log(`Room ${roomId} has been deleted`);
	});
};

module.exports = (io) => {
	const videoIO = io.of("/video");

	videoIO.on("connection", (socket) => {
		console.log(`${socket.id} connected to videoIO`);

		socket.on("REQUEST_ROOM_STATUS", (roomId) => {
			redisClient
				.exists(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`)
				.then((exists) => videoIO.to(socket.id).emit("RECEIVE_ROOM_STATUS", exists === 1))
				.catch((err) => console.log(err));
		});

		// Pair up socket id with a user id
		socket.on("SUBSCRIBE_USER_TO_SOCKET", (userId) => {
			redisClient
				.exists(`${VIDEO_PREFIX_SOCKETUSER}_${socket.id}`)
				.then((existRes) => {
					if (existRes === 1) {
						console.log(`Subscription already exists: ${existRes}`);
					} else {
						redisClient
							.set(`${VIDEO_PREFIX_SOCKETUSER}_${socket.id}`, userId)
							.then((appendRes) => console.log("Subscription success"))
							.catch((appendErr) => console.log(appendErr));
					}
				})
				.catch((err) => console.log(err));
		});

		// 1. Join room via id
		socket.on("join-room", (roomId, callback) => {
			console.log(`${socket.id} has joined the video room ${roomId}`);
			socket.join(roomId);

			redisClient
				.set(`${VIDEO_PREFIX_SOCKETROOM}_${socket.id}`, roomId)
				.then((appendRes) =>
					redisClient.sadd(`${VIDEO_PREFIX_ROOMSOCKETS}_${roomId}`, socket.id)
				)
				.then((saddRes) => console.log("JOINED ROOM"))
				.catch((err) => console.log(err))
				.finally(() => callback());

			console.log("JOINED ROOM");
			callback();
		});

		// 2. Cleanup after a user disconnects
		const deleteSocketFromRoom = (roomId) => {
			redisClient
				.scard(`${VIDEO_PREFIX_ROOMSOCKETS}_${roomId}`)
				.then((size) => {
					console.log(`room size: ${size} (${typeof size})`);

					if (size === 1) {
						deleteRoom(roomId);
						console.log("Room deleted");
					}
					return redisClient.srem(`${VIDEO_PREFIX_ROOMSOCKETS}_${roomId}`, socket.id);
				})
				.then((remRes) => redisClient.del(`${VIDEO_PREFIX_SOCKETROOM}_${socket.id}`))
				.then((delRes) => console.log(`Removed user from room ${roomId}`))
				.catch((setErr) => console.log(setErr));
		};

		const passDownBufferer = (roomId, bufferEntry) => {
			console.log("Passing down the bufferer role...");
			console.log(`bufferEntry:`);
			console.log(bufferEntry);
			redisClient
				.smembers(`${VIDEO_PREFIX_ROOMSOCKETS}_${roomId}`)
				.then((sockets) => {
					const nextBufferer = sockets[0];
					console.log(`next bufferer: ${nextBufferer}`);

					if (!bufferEntry) {
						videoIO.to(roomId).emit("SET_BUFFERER", nextBufferer);
						return;
					}

					const newEntry = {
						roomId: bufferEntry.roomId,
						readys: bufferEntry.readys.filter((ready) => ready != nextBufferer),
						target: bufferEntry.target - 1,
					};
					console.log(`newEntry`);
					console.log(newEntry);

					redisClient
						.del(`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`)
						.then((delRes) => {
							console.log(
								`SET ${VIDEO_PREFIX_BUFFERREADYS}_${nextBufferer} => ${JSON.stringify(
									newEntry
								)}`
							);
							console.log(`set  buffer ready #3`);

							redisClient.set(
								`${VIDEO_PREFIX_BUFFERREADYS}_${nextBufferer}`,
								JSON.stringify(newEntry)
							);
						})
						.then((appendRed) => {
							console.log(`Set new bufferer: ${nextBufferer}`);
							videoIO.to(roomId).emit("SET_BUFFERER", nextBufferer);
						})
						.catch((err) => console.log(err));
				})
				.catch((err) => console.log(err));
		};

		const removeSelfFromBuffer = (roomId) => {
			redisClient
				.get(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`)
				.then((buffererId) => {
					redisClient
						.get(`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}`)
						.then((entryStr) => {
							const entry = JSON.parse(entryStr);
							const newEntry = {
								roomId: entry.roomId,
								readys: entry.ready.filter((read) => ready != socket.id),
								target: entry.target - 1,
							};
							if (newEntry.readys.length >= newEntry.target) {
								redisClient
									.del(`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}`)
									.then((delRes) =>
										redisClient.del(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`)
									)
									.then((delRes) =>
										console.log("Received all users, releasing all readys")
									)
									.catch((delErr) => console.log(delErr));
							} else {
								console.log(
									`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}'s entryStr: ${newEntry}`
								);
								console.log(`set  buffer ready #1`);

								redisClient
									.set(
										`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}`,
										JSON.stringify(newEntry)
									)
									.then((appendRes) => console.log("Update buffer entry"))
									.catch((appendErr) => console.log(appendErr));
							}
						})
						.catch((bufferErr) => console.log(bufferErr));
				})
				.catch((roomErr) => console.log(roomErr));
		};

		socket.on("disconnect", () => {
			console.log("LEFT ROOM");

			const getRoomId = redisClient.get(`${VIDEO_PREFIX_SOCKETROOM}_${socket.id}`);
			const getUserId = redisClient.get(`${VIDEO_PREFIX_SOCKETUSER}_${socket.id}`);

			Promise.all([getRoomId, getUserId])
				.then((res) => {
					const roomId = res[0];
					const userId = parseInt(res[1]);
					disconnectUser(socket.id, userId, roomId, MAX_DISCONNECTION_RETRIES);
					deleteSocketFromRoom(roomId);

					client
						.multi()
						.get(`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`, (err, str) =>
							console.log(`results: ${str}`)
						)
						.exec();

					let isBufferer = 0;
					let roomHasHolder = 0,
						socketIsHolder = 0;

					client
						.multi()
						.exists(
							`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`,
							(err, res) => (isBufferer = res)
						)
						.exists(
							`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`,
							(err, res) => (roomHasHolder = res)
						)
						.get(
							`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`,
							(err, res) => (socketIsHolder = res === socket.id)
						)
						.exec((err) => {
							if (err) {
								console.log("ERROR HAPPENED");
								return;
							}

							console.log(`isBufferer: ${isBufferer} (${typeof isBufferer})`);
							console.log(
								`roomHasHolder: ${roomHasHolder} (${typeof roomHasHolder})`
							);
							console.log(
								`socketIsHolder: ${socketIsHolder} (${typeof socketIsHolder})`
							);

							if (isBufferer || (roomHasHolder && socketIsHolder)) {
								console.log("CASE #1");
								let entryStr;

								client
									.multi()
									.get(
										`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`,
										(err, res) => (entryStr = res)
									)
									.exec((err) => {
										if (err) {
											console.log(err);
											return;
										}
										console.log(`entryStr: ${entryStr}`);
										passDownBufferer(roomId, JSON.parse(entryStr));
									});
							} else {
								console.log("CASE #2");
								removeSelfFromBuffer(roomId);
							}
						});

					// redisClient
					// 	.exists(`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`)
					// 	.then((exists) => {
					// 		console.log(`is Bufferer? ${exists} (${typeof exists})`);

					// 		if (exists === 1) {
					// 			redisClient
					// 				.get(`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`)
					// 				.then((entryStr) => {
					// 					console.log(`entryStr found: ${entryStr}`);
					// 					if (entryStr) {
					// 						console.log(
					// 							`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}'s entryStr: ${entryStr}`
					// 						);
					// 						passDownBufferer(roomId, JSON.parse(entryStr));
					// 					}
					// 				})
					// 				.catch((bufferErr) => removeSelfFromBuffer(roomId));
					// 		}
					// 	})
					// 	.catch((existErr) => console.log(existErr));
				})
				.catch((err) => console.log(err));
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
			console.log(`${socket.id} requesting HOLD on all other users`);

			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
				return;
			}

			let isRoomHeld = 0;
			client
				.multi()
				.exists(
					`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`,
					(err, value) => (isRoomHeld = value)
				)
				.exec((existErr) => {
					if (existErr) {
						console.log("Error checking if room is held");
						return;
					}

					if (isRoomHeld === 1) {
						console.log(`Room ${roomId} held, ignoring HOLD from ${socket.id}...`);
					} else {
						client
							.multi()
							.set(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`, socket.id)
							.exec((setErr) => {
								if (setErr) {
									console.log("Error when setting bufferer");
									return;
								}

								console.log(`${socket.id} ask all other users to HOLD`);
								socket.to(roomId).emit("HOLD", socket.id);
							});
					}
				});
		});

		// 5. Ask all other users to prepare to resume at a given timing
		const releaseBufferer = (buffererId, roomId) => {
			console.log(`release bufferer`);
			redisClient
				.del(`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`)
				.then((delRes) => redisClient.del(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`))
				.then((delRes) => videoIO.to(socket.id).emit("RELEASE"))
				.catch((delErr) => console.log(delErr));
		};
		const addEmptyBufferEntry = (buffererId, roomId, numOfUsers) => {
			console.log(`add empty buffer entry`);
			const newEntry = {
				roomId,
				readys: [],
				target: numOfUsers,
			};
			console.log(
				`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}'s entryStr: ${JSON.stringify(newEntry)}`
			);
			console.log(`set  buffer ready #4`);

			redisClient
				.set(`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}`, JSON.stringify(newEntry))
				.then((res) => redisClient.get(`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}`))
				.then((res) => console.log(`result from get in then: ${res}`))
				// .then((appendRes) => console.log(appendRes))
				.catch((appendErr) => console.log(appendErr));
		};
		socket.on("REQUEST_RELEASE", (roomId, newTiming) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
				return;
			}

			redisClient.exists(`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`).then((exists) => {
				if (exists === 1) {
					console.log(
						`${socket.id} is already waiting for release, ignoring this release request...`
					);
				} else {
					redisClient
						.scard(`${VIDEO_PREFIX_ROOMSOCKETS}_${roomId}`)
						.then((numOfSockets) => {
							const numOfUsers = numOfSockets - 1;

							if (numOfUsers <= 0) {
								releaseBufferer(socket.id, roomId);
							}

							console.log(
								`${socket.id} requests for ${numOfUsers} unique readys at ${newTiming}`
							);

							redisClient
								.exists(`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`)
								.then((entryExists) => {
									if (entryExists === 0) {
										addEmptyBufferEntry(socket.id, roomId, numOfUsers);
									}

									console.log(`Ask room ${roomId} to prepare release`);
									socket.to(roomId).emit("PREPARE_RELEASE", newTiming);
								});
						});
				}
			});
		});

		// 6. Tell the server that this user is ready to resume
		socket.on("REQUEST_RELEASE_READY", async (roomId, buffererId, releaseSelfCallback) => {
			let isEntryFound = 0;
			client
				.multi()
				.exists(`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}`, (existErr, existRes) => {
					console.log(`existRes for REQUEST_RELEASE_READY:`);
					console.log(existRes);
					console.log(typeof existRes);
					isEntryFound = existRes;
				})
				.exec((err) => {
					if (err) {
						console.log("Error when checking if bufferEntry exists");
						console.log(err);
						return;
					}

					if (isEntryFound === 1) {
						let entry, newEntry;

						client
							.multi()
							.get(`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}`, (err, entryStr) => {
								entry = JSON.parse(entryStr);
								newEntry = { ...entry, readys: [...entry.readys, socket.id] };
							})
							.exec((getErr, getRes) => {
								if (getErr) {
									console.log(getErr);
									return;
								}

								if (newEntry.readys.length >= newEntry.target) {
									client
										.multi()
										.del(`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}`)
										.del(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`)
										.exec((delErr, delRes) => {
											if (!delErr) {
												console.log(
													"Already reach target, asking all to release"
												);
												socket.to(roomId).emit("RELEASE");
											} else {
												console.log(
													"Reached target but encounter error too"
												);
												console.log(delErr);
											}
											releaseSelfCallback();
										});
								} else {
									console.log(`set  buffer ready #2`);
									client
										.multi()
										.set(
											`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}`,
											JSON.stringify(newEntry)
										)
										.exec((setErr, setRes) => {
											if (setErr) {
												console.log("error when setting new entry");
												console.log(setErr);
												return;
											}
											console.log(
												`Updating entry, ${newEntry.readys.length}/${newEntry.target}`
											);
										});
								}
							});
					} else {
						console.log("no buffer entry found, creating one...");

						let isRoomHeld = 0;

						// TEST THIS ATOMICITY

						client
							.multi()
							.exists(
								`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`,
								(existErr, existRes) => (isRoomHeld = existRes)
							)
							.exec((execErr) => {
								if (execErr) {
									console.log("Error when checking if room is held");
									console.log(execErr);
									return;
								}

								if (isRoomHeld === 1) {
									let numOfUsers = 0;
									client
										.multi()
										.scard(
											`${VIDEO_PREFIX_ROOMSOCKETS}_${roomId}`,
											(scardErr, numOfSockets) =>
												(numOfUsers = numOfSockets - 1)
										)
										.exec((scardErr) => {
											if (scardErr) {
												console.log("Error when checking num of sockets");
												console.log(scardErr);
												return;
											}

											if (numOfUsers === 1) {
												client
													.del(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`)
													.exec((delErr) => {
														if (delErr) {
															console.log(
																"Error when deleting bufferer"
															);
															console.log(delErr);
															return;
														}

														console.log(
															"Only 1 user, releasing rightaway"
														);
														videoIO.to(roomId).emit("RELEASE");
													});
											} else {
												const newEntry = {
													roomId,
													readys: [socket.id],
													target: numOfUsers,
												};
												client
													.set(
														`${VIDEO_PREFIX_BUFFERREADYS}`,
														JSON.stringify(newEntry)
													)
													.exec((setErr) => {
														if (setErr) {
															console.log(
																"ERROR WHEN SETTING BUFFERREADY"
															);
														} else {
															console.log(
																"SUCCESS WHEN SETTING BUFFERREADY"
															);
														}
													});
											}
										});
								}
							});

						// redisClient
						// 	.exists(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`)
						// 	.then((exists) => {
						// 		if (exists === 1) {
						// 			console.log("bufferer found");
						// 			redisClient
						// 				.scard(`${VIDEO_PREFIX_ROOMSOCKETS}_${roomId}`)
						// 				.then((numOfSockets) => {
						// 					const numOfUsers = numOfSockets - 1;
						// 					console.log(
						// 						`number of users to ready up:${numOfUsers}`
						// 					);
						// 					if (numOfUsers === 1) {
						// 						redisClient
						// 							.del(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`)
						// 							.then((delRes) => {
						// 								console.log(
						// 									"Only 1 user, releasing rightaway"
						// 								);
						// 								videoIO.to(roomId).emit("RELEASE");
						// 							})
						// 							.catch((delErr) => console.log(delErr));
						// 					}
						// 				})
						// 				.catch((scardErr) => console.log(scardErr));
						// 		}
						// 	})
						// 	.catch((existsErr) => console.log(existsErr));
					}
				});
		});

		// 7. Ask all other users to resume from holding
		socket.on("REQUEST_RELEASE_ALL", (roomId) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
				return;
			}

			const deleteBufferReady = redisClient.del(`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`);
			const deleteRoomHolders = redisClient.del(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`);

			Promise.all([deleteBufferReady, deleteRoomHolders])
				.then((res) => {
					console.log(`${socket.id} releasing all users in ${roomId} by RELEASE_ALL`);
					socket.to(roomId).emit("RELEASE");
				})
				.catch((err) => console.log(err));
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

		// Ask the room's host for the playback setting
		socket.on("REQUEST_SETTINGS", (roomId) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				socket.to(roomId).emit("QUERY_SETTINGS", socket.id);
			}
		});

		// PM a reciepient with a playback setting
		socket.on("REPLY_SETTINGS", (roomId, recipientId, settings) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				socket.to(roomId).emit("RECEIVE_SETTINGS", recipientId, settings);
			}
		});
	});
};
