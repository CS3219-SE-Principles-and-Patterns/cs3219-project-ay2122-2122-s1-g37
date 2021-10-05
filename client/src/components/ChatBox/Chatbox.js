import React, { useState, useEffect, useCallback } from "react";
import socket from "../../services/socket";
import ChatboxWrapper from "./Chatbox.styled";
import ChatContent from "./ChatContent";
import ChatInput from "./ChatInput";

function Chatbox() {
	const [messages, setMessages] = useState([]);

	const receiveMessage = useCallback(
		(msg) => {
			const newMessages = messages.slice();
			newMessages.push({
				id: messages.length > 0 ? messages[messages.length - 1].id + 1 : 0,
				msg,
			});
			setMessages(newMessages);
		},
		[messages]
	);

	const sendMessage = useCallback(
		(msg) => {
			const taggedMsg = `${socket.id}: ${msg}`;
			receiveMessage(taggedMsg);
			socket.emit("send-message", taggedMsg);
		},
		[receiveMessage]
	);

	const joinMessage = useCallback(() => {
		const msg = `${socket.id} has joined the chat`;
		receiveMessage(msg);
		socket.emit("send-message", msg);
	}, [sendMessage]);

	// Reset socket event handlers when Chatbox re-render
	useEffect(() => {
		socket.on("connect", joinMessage);
		socket.on("receive-message", receiveMessage);
		return () => {
			socket.off("connect", joinMessage);
			socket.off("receive-message", receiveMessage);
		};
	}, [joinMessage, receiveMessage]);

	return (
		<ChatboxWrapper className="chatbox">
			<div className="chatbox-content">
				<ChatContent messages={messages} />
			</div>
			<div className="chatbox-input">
				<ChatInput onSubmit={sendMessage} />
			</div>
		</ChatboxWrapper>
	);
}

export default Chatbox;
