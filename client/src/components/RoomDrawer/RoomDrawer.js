import React from "react";
import { ButtonWrapper } from "../ChatBox/ChatInput.styled";
import RoomSettings from "../RoomSettings/RoomSettings";
import { RoomDrawerWrapper } from "./RoomDrawer.styled";

function RoomDrawer({ roomId, isHost, capacity, settings, saveCallback }) {
	const copy = (content) => {
		const element = document.createElement("textarea");
		element.value = content;
		document.body.appendChild(element);
		element.select();
		document.execCommand("copy");
		document.body.removeChild(element);
	};

	const copyCode = () => {
		copy(roomId);
	};

	const copyLink = () => {
		copy(window.location.href);
	};

	return (
		<RoomDrawerWrapper isHost={isHost}>
			<ButtonWrapper onClick={copyCode}>Share via code</ButtonWrapper>
			<ButtonWrapper onClick={copyLink}>Share via link</ButtonWrapper>
			{isHost && (
				<RoomSettings
					roomId={roomId}
					capacity={capacity}
					settings={settings}
					saveCallback={saveCallback}
				/>
			)}
		</RoomDrawerWrapper>
	);
}

export default RoomDrawer;
