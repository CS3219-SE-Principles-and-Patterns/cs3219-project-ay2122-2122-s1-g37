import React, { useState, useEffect, useCallback, useContext } from "react";
import { useParams } from "react-router";
import Chatbox from "../../components/ChatBox/Chatbox";
import VideoLinker from "../../components/VideoLinker/VideoLinker";
import VideoPlayer from "../../components/VideoPlayer/VideoPlayer";
import Watchmates from "../../components/Watchmates/Watchmates";
import RoomPageWrapper from "./Room.styled";
import { io } from "socket.io-client";
import URL from "../../util/url";
import { CircularProgress, Typography } from "@mui/material";
import axios from "axios";
import UserContext from "../../components/Context/UserContext";
import { useHistory } from "react-router";
import RoomDrawer from "../../components/RoomDrawer/RoomDrawer";

const initialSettings = {
	users: [
		{ id: 1, name: "User1", canChat: true, canVideo: true },
		{ id: 2, name: "User2", canChat: false, canVideo: true },
		{ id: 3, name: "User3", canChat: false, canVideo: true },
		{ id: 4, name: "User4", canChat: false, canVideo: true },
		{ id: 5, name: "User5", canChat: false, canVideo: true },
		{ id: 6, name: "User6", canChat: false, canVideo: true },
		{ id: 7, name: "User7", canChat: false, canVideo: true },
		{ id: 8, name: "User8", canChat: false, canVideo: true },
	],
};

const blankUser = {
	id: "",
	name: "",
	isHost: false,
};

function Room() {
	const { id } = useParams();
	const [user, setUser] = useState(blankUser);
	const [users, setUsers] = useState([]);
	const [settings, setSettings] = useState(initialSettings);
	const [isWaiting, setIsWaiting] = useState(true);
	const [isLinkerDisabled, setIsLinkerDisabled] = useState(false);
	const [isChatDisabled, setIsChatDisabled] = useState(false);
	const [chatSocket, setChatSocket] = useState(null);
	const [videoSocket, setVideoSocket] = useState(null);
	const [roomInfo, setRoomInfo] = useState({});

	const history = useHistory();
	const { userInfo } = useContext(UserContext);

	const linkCallback = (url) => {
		setRoomInfo({ ...roomInfo, url });
	};

	const receiveSettings = useCallback(
		(newCapacity, newSettings) => {
			setRoomInfo({ ...roomInfo, newCapacity });
			setSettings(newSettings);
		},
		[roomInfo]
	);
	const saveCallback = (newCapacity, newSettings) => {
		setRoomInfo({ ...roomInfo, capacity: newCapacity });
		setSettings(newSettings);
		chatSocket.emit("SEND_ROOM_SETTINGS", id, newCapacity, newSettings);
	};

	const receiveKick = useCallback(
		(userId) => {
			if (userId === user.userId) {
				history.push("/");
				console.log("GOT KICKED");
			}
		},
		[user, history]
	);
	const kickCallback = (userId) => {
		console.log(`Kick user ${userId}`);
		chatSocket.emit("SEND_KICK", id, userId);
	};

	// Join room, retrieve room's info and connect to its sockets
	useEffect(() => {
		let newChatSocket = null;
		let newVideoSocket = null;
		const serverUrl =
			process.env.NODE_ENV && process.env.NODE_ENV === "production"
				? URL.DEPLOYED_SERVER_URL
				: URL.LOCAL_SERVER_URL;

		const getUsers = axios.get(`/api/rooms/${id}/users`);
		const getCapacityCount = axios.get(`/api/rooms/${id}/count`);

		Promise.all([getUsers, getCapacityCount])
			.then((res) => {
				const userIds = res[0].data.map((entry) => entry.userId);
				const { capacity, count } = res[1].data;

				if (userIds.includes(userInfo.userId)) {
					history.push(`/room/${id}/alreadyin`);
				} else if (count && capacity && count >= capacity) {
					history.push(`/room/${id}/full`);
				} else {
					axios
						.post("/api/rooms/join", { userId: userInfo.userId, roomId: id })
						.then((joinRes) => {
							// Retrieve room info
							axios.get(`/api/rooms/${id}`).then((roomRes) => {
								let newRoomInfo = roomRes.data.room;
								if (!newRoomInfo.url || newRoomInfo.url.length === 0) {
									newRoomInfo.url = URL.FALLBACK_VIDEO;
								}
								setRoomInfo(roomRes.data.room);
							});

							// Setup sockets
							newChatSocket = io(serverUrl + "/chat");
							newVideoSocket = io(serverUrl + "/video", {
								query: { userId: userInfo.userId },
							});
							setChatSocket(newChatSocket);
							setVideoSocket(newVideoSocket);

							// TEMPORARY PLACEHOLDER
							// To-do: Replace with fetching settings
							setSettings({
								users: joinRes.data.map((user) => {
									return {
										...user,
										displayName: user.userId,
										canChat: true,
										canVideo: true,
									};
								}),
							});
						})
						.catch((err) => {
							history.push("/room_notfound");
							console.log(err);
						});
				}
			})
			.catch((err) => {
				history.push("/room_notfound");
				console.log(err);
			});

		return () => {
			if (newChatSocket && newVideoSocket) {
				newChatSocket.disconnect();
				newVideoSocket.disconnect();
			}
		};
	}, [id, userInfo, history]);

	useEffect(() => {
		if (videoSocket && userInfo) {
			videoSocket.emit("SUBSCRIBE_USER_TO_SOCKET", userInfo.userId);
		}
	}, [videoSocket, userInfo]);

	const updateUserList = useCallback(
		(userList, hostId) => {
			axios.get(`/api/rooms/${id}/users`).then((res) => {
				const newUsers = res.data.filter((user) => userList.includes(user.userId));
				for (let i = 0; i < newUsers.length; i++) {
					newUsers[i] = { ...newUsers[i], isHost: newUsers[i].userId === hostId };
					if (newUsers[i].userId === userInfo.userId) {
						const currUser = newUsers.splice(i, 1)[0];
						newUsers.unshift(currUser);
						setUser(currUser);
					}
				}
				setUsers(newUsers);

				// TEMPORARY PLACEHOLDER
				// To-do: Replace with fetching settings
				setSettings({
					users: newUsers.map((user) => {
						return {
							...user,
							displayName: user.userId,
							canChat: true,
							canVideo: true,
						};
					}),
				});
			});
		},
		[setUsers, userInfo, id]
	);

	useEffect(() => {
		if (chatSocket) {
			chatSocket.on("update-user-list", updateUserList);
			chatSocket.on("RECEIVE_ROOM_SETTINGS", receiveSettings);
			chatSocket.on("RECEIVE_KICK", receiveKick);
			return () => {
				chatSocket.off("update-user-list", updateUserList);
				chatSocket.off("RECEIVE_ROOM_SETTINGS", receiveSettings);
				chatSocket.off("RECEIVE_KICK", receiveKick);
			};
		}
	}, [chatSocket, updateUserList, receiveSettings, receiveKick]);

	// Enable/disable chatbox and linker based on settings
	useEffect(() => {
		if (settings && settings.users) {
			const userSettings = settings.users.filter(
				(user) => user.userId === userInfo.userId
			)[0];
			if (userSettings) {
				setIsChatDisabled(!userSettings.canChat);
				setIsLinkerDisabled(!userSettings.canVideo);
			}
		}
	}, [settings, userInfo]);

	return (
		<RoomPageWrapper>
			<div className="room-player">
				{isWaiting && (
					<div className="room-join-fallback">
						<CircularProgress color="warning" />
						<Typography align="center" variant="h6">
							Joining...
						</Typography>
					</div>
				)}
				<div className="room-res-wrapper">
					<VideoPlayer
						users={users}
						user={user}
						socket={videoSocket}
						roomId={id}
						isWaiting={isWaiting}
						setIsWaiting={setIsWaiting}
						roomInfo={roomInfo}
						setRoomInfo={setRoomInfo}
					/>
				</div>
			</div>
			<div className="room-sidebar">
				<VideoLinker isDisabled={isLinkerDisabled} linkCallback={linkCallback} />
				<Watchmates users={users} />
				<Chatbox socket={chatSocket} roomId={id} isDisabled={isChatDisabled} />
				<RoomDrawer
					roomId={id}
					isHost={user.isHost}
					capacity={roomInfo.capacity}
					settings={settings}
					kickCallback={kickCallback}
					saveCallback={saveCallback}
				/>
			</div>
		</RoomPageWrapper>
	);
}

export default Room;
