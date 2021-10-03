import React, { useState } from "react";
import Chatbox from "../../components/ChatBox/Chatbox";
import VideoLinker from "../../components/VideoLinker/VideoLinker";
import VideoPlayer from "../../components/VideoPlayer/VideoPlayer";
import Watchmates from "../../components/Watchmates/Watchmates";
import RoomPageWrapper from "./Room.styled";

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

function Room() {
	const [playerState, setPlayerState] = useState(initialPlayerState);
	const [users, setUsers] = useState(initialUsers);

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
			</div>
		</RoomPageWrapper>
	);
}

export default Room;
