import { io } from "socket.io-client";
import React, { useRef } from "react";
import { ButtonWrapper, ChatInputWrapper, TextFieldWrapper } from "./ChatInput.styled";

// I believe this should be changed to only connect when on the page. I not sure how yet. Or dunnid, idk.
const socket = io("http://localhost:3001");
// Temp chat room. Can be alphanumeric.
const tempRoom = 1;
let id;

function ChatInput({ onSubmit }) {
	const inputRef = useRef(null);

	const submitMsg = (e) => {
		e.preventDefault();
		onSubmit("You: " + inputRef.current.value);
		
		// send message to server.
		socket.emit("msg-to-server", id + ": " + inputRef.current.value, tempRoom);
		inputRef.current.value = "";
	};
	
	// Upon socket connection? Ps, I just start, dk how clean up yet.
	socket.on("connect", () => {
		id = socket.id;
		onSubmit(id + " connected to server");
		
		// this is to join a certain room, which should be done right after room creation.
		socket.emit("join-room", tempRoom, () => {
			console.log("callback?");
		});
	});
	
	// Upon receiving message from server.
	socket.on("msg-to-client", (msg) => {
		onSubmit(msg);
	});

	return (
		<form onSubmit={submitMsg}>
			<ChatInputWrapper>
				<TextFieldWrapper
					className="chatinput-textfield"
					inputRef={inputRef}
					placeholder="Chat here..."
					size="small"
				/>
				<ButtonWrapper className="chatinput-btn" variant="contained" onClick={submitMsg}>
					Submit
				</ButtonWrapper>
			</ChatInputWrapper>
		</form>
	);
}

export default ChatInput;
