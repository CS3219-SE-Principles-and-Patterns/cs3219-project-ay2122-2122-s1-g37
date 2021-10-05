import React, { useState } from "react";
import Chatbox from "../../components/ChatBox/Chatbox";
import RoomSettings from "../../components/RoomSettings/RoomSettings";
import VideoLinker from "../../components/VideoLinker/VideoLinker";
import VideoPlayer from "../../components/VideoPlayer/VideoPlayer";
import Watchmates from "../../components/Watchmates/Watchmates";
import RoomPageWrapper from "./Room.styled";
import { io } from "socket.io-client";

const initialPlayerState = {
	url: "https://www.youtube.com/watch?v=YHXB1xp-xXc",
	playing: true,
	syncTime: 0,
	syncType: "seconds",
};

const initialUsers = [
	{ id: 1, name: "User1", isHost: true },
	{ id: 2, name: "User2", isHost: false },
	{ id: 3, name: "User3", isHost: false },
	{ id: 4, name: "User4", isHost: false },
	{ id: 5, name: "User5", isHost: false },
	{ id: 6, name: "User6", isHost: false },
	{ id: 7, name: "User7", isHost: false },
	{ id: 8, name: "User8", isHost: false },
];

const initialSettings = {
	capacity: 15,
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

// I believe this should be changed to only connect when on the page. I not sure how yet. Or dunnid, idk.
const socket = io("http://localhost:5000");

// Upon socket connection? Ps, I just start, dk how clean up yet.
socket.on("connect", () => {
	console.log(socket.id);
	// id = socket.id;
	// onSubmit(id + " connected to server");
	// this is to join a certain room, which should be done right after room creation.
	// socket.emit("join-room", tempRoom, () => {
	// 	console.log("callback?");
	// });
});

// Upon receiving message from server.
socket.on("msg-to-client", (msg) => {
	// onSubmit(msg);
});

function Room() {
	const [playerState, setPlayerState] = useState(initialPlayerState);
	const [users, setUsers] = useState(initialUsers);
	const [settings, setSettings] = useState(initialSettings);

	// SOCKET.IO related stuff will be handled here

	const playCallback = () => {
		console.log("VIDEO PLAYS");
		// Broadcast PLAY event to all other users
	};

	const pauseCallback = () => {
		console.log("VIDEO PAUSES");
		// Broadcast PAUSE event to all other users
	};

	// To-do: Handling SEEK event. YouTube API does not provide SEEK directly
	// Save progress when PAUSE happens and compare progresses when PLAY happens

	const linkCallback = (url) => {
		setPlayerState({ ...playerState, url });
		// Broadcast new link to all other users
	};

	const saveCallback = () => {
		console.log("SETTINGS SAVED");
		// Broadcast settings to all other users;
	};

	return (
		<RoomPageWrapper>
			<div className="room-player">
				<div className="room-res-wrapper">
					<VideoPlayer
						{...playerState}
						playCallback={playCallback}
						pauseCallback={pauseCallback}
					/>
				</div>
			</div>
			<div className="room-sidebar">
				<VideoLinker linkCallback={linkCallback} />
				<Watchmates users={users} />
				<Chatbox />
				<RoomSettings
					capacity={settings.capacity}
					users={settings.users}
					saveCallback={saveCallback}
				/>
			</div>
		</RoomPageWrapper>
	);
}

export default Room;
