import React from "react";
import Chatbox from "../../components/ChatBox/Chatbox";
import VideoPlayer from "../../components/VideoPlayer/VideoPlayer";
import RoomPageWrapper from "./Room.styled";

function Room() {
	// SOCKET.IO related stuff will be handled here

	return (
		<RoomPageWrapper>
			<VideoPlayer />
			<Chatbox />
		</RoomPageWrapper>
	);
}

export default Room;
