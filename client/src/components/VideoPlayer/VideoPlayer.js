import React, { useCallback, useEffect, useState } from "react";
import ReactPlayer from "react-player/youtube";

const initialState = {
	url: "https://www.youtube.com/watch?v=q5WbrPwidrY",
	playing: true,
	syncTime: 0,
	syncType: "seconds",
};

function VideoPlayer({ socket, roomId, url }) {
	const [videoUrl, setVideoUrl] = useState(initialState.url);

	// Initialize upon connecting
	const initialize = useCallback(() => {
		socket.emit("join-room", roomId, () => {
			console.log(`${socket.id} has joined the video room ${roomId}`);
		});
	}, [socket, roomId]);

	// Receiving and broadcasting URLs
	const receiveUrl = useCallback(
		(url) => {
			setVideoUrl(url);
		},
		[setVideoUrl]
	);
	useEffect(() => {
		if (socket && url) {
			// Self: Update state
			setVideoUrl(url);
			// Self: Broadcast new URL to all
			if (url !== initialState.url) {
				socket.emit("SEND_URL", roomId, url);
			}
			// Self: Update DB's URL
		}
	}, [socket, roomId, url]);

	// Receiving and broadcasting TIMING
	const receiveTiming = ({ timing }) => {
		console.log(`Sync at ${timing}`);
	};
	const timingCallback = ({ playedSeconds }) => {
		// Host: Broadcast timing every second
		socket.emit("SEND_TIMING", roomId, { timing: playedSeconds });
		// Host: Update DB's timing every 10 seconds
	};

	// Broadcast PLAY event to all other users
	const playCallback = () => {
		// Host: Broadcast PLAY event to all users
		// Host: Update status in DB (?)
	};

	// Broadcast PAUSE event to all other users
	const pauseCallback = () => {
		// Host: Broadcast PAUSE event to all users
		// Host: Update status in DB(?)
	};

	// Broadcast SEEK event to all other users
	const seekCallback = () => {
		console.log("VIDEO SEEKS");
		// To-do: Broadcast SEEK event to all other users. YouTube API does not provide SEEK directly
		// Save progress when PAUSE happens and compare progresses when PLAY happens
	};

	// Broadcast BUFFERING event to all other users
	const bufferCallback = () => {
		console.log("BUFFERING");
	};

	// Broadcast SPEED_CHANGE event to all other users
	const speedChangeCallback = () => {
		console.log("PLAYBACK SPEED CHANGE");
	};

	// Catch up a new user using latest known state
	const catchUp = () => {
		// Retrieve latest video state from DB
		// Update video player with it
	};

	// Reset socket event handlers when VideoPlayer re-renders
	useEffect(() => {
		if (socket) {
			socket.on("connect", initialize);
			socket.on("RECEIVE_URL", receiveUrl);
			socket.on("RECEIVE_TIMING", receiveTiming);
			return () => {
				socket.off("connect", initialize);
				socket.off("RECEIVE_URL", receiveUrl);
				socket.off("RECEIVE_TIMING", receiveTiming);
			};
		}
	}, [socket, initialize, receiveUrl]);

	return (
		<ReactPlayer
			className="react-player"
			width="100%"
			height="100%"
			url={videoUrl}
			playing={true}
			controls
			loop
			muted
			onPlay={playCallback}
			onPause={pauseCallback}
			onProgress={timingCallback}
		/>
	);
}

export default VideoPlayer;
