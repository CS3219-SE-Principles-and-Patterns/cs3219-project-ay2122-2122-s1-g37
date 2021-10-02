import React from "react";
import Chatbox from "../../components/ChatBox/Chatbox";
import VideoPlayer from "../../components/VideoPlayer/VideoPlayer";
import RoomPageWrapper from "./Room.styled";

function Room() {
	// SOCKET.IO related stuff will be handled here

	return (
		<RoomPageWrapper>
			<div className="room-player">
				<div className="room-res-wrapper">
					<VideoPlayer />
				</div>
			</div>
			<div className="room-sidebar">
				<Chatbox />
			</div>
		</RoomPageWrapper>
	);
}

export default Room;
