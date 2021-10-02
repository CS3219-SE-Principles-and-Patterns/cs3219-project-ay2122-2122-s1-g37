import React, { useState } from "react";
import Chatbox from "../../components/ChatBox/Chatbox";
import VideoLinker from "../../components/VideoLinker/VideoLinker";
import VideoPlayer from "../../components/VideoPlayer/VideoPlayer";
import RoomPageWrapper from "./Room.styled";

const initialState = {
	url: "https://www.youtube.com/watch?v=YHXB1xp-xXc",
	playing: true,
	syncTime: 0,
	syncType: "seconds",
};

function Room() {
	const [playerState, setPlayerState] = useState(initialState);

	// SOCKET.IO related stuff will be handled here

	const playCallback = () => {
		console.log("VIDEO PLAYS");
	};

	const pauseCallback = () => {
		console.log("VIDEO PAUSES");
	};

	const linkCallback = (url) => {
		setPlayerState({ ...playerState, url });
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
				<Chatbox />
			</div>
		</RoomPageWrapper>
	);
}

export default Room;
