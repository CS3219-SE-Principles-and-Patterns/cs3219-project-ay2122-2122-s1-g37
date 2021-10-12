import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player/youtube";

const placeholderRoomInfo = {
	id: 1,
	hostId: 1,
	capacity: 15,
	url: "",
	elapsedTime: 0,
};
const fallbackURL = "https://www.youtube.com/watch?v=Ski_KEgOUP4";
const timeout = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

const UNAVALIABLE = -1;
const SYNC_THRESHOLD = 1;

function VideoPlayer({ socket, roomId, user, url }) {
	const [videoUrl, setVideoUrl] = useState("");
	const [isPlaying, setIsPlaying] = useState(true);

	const [syncTime, setSyncTime] = useState(UNAVALIABLE);
	const [buffererId, setBuffererId] = useState(UNAVALIABLE);
	const [ignoreNextBuffer, setIgnoreNextBuffer] = useState(false);
	const [isInitialSync, setIsInitialSync] = useState(true);

	const playerRef = useRef(null);

	// Initialize upon connecting
	const initialize = useCallback(async () => {
		socket.emit("join-room", roomId, async () => {
			console.log(`${socket.id} has joined the video room`);

			// To-do: Fetch room info from DB
			const [roomInfo] = await Promise.all([placeholderRoomInfo, timeout(1000)]);

			if (roomInfo.url.length > 0) {
				// Load up URL from the room info
				setVideoUrl(roomInfo.url);
				console.log(`${socket.id} found URL for the room ${roomId}, loading it to player`);
			} else {
				// Load up placeholder video if DB has no URL
				setVideoUrl(fallbackURL);
				console.log(
					`${socket.id} cannot found URL for the room ${roomId}, using fallback...`
				);
			}

			// setIsDesync(true);
			// console.log("Initial sync up");
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
			if (url !== fallbackURL) {
				socket.emit("SEND_URL", roomId, url);
			}
			// Self: To-do - Update DB's URL
		}
	}, [socket, roomId, url]);

	// Receiving and broadcasting TIMING
	const receiveTiming = useCallback(
		({ timing }) => {
			if (!user.isHost) {
				// console.log(`Receive timing of ${timing}`);
				setSyncTime(timing);
			}
		},
		[user.isHost]
	);
	const timingCallback = ({ playedSeconds }) => {
		// Host: Broadcast timing every second
		if (user.isHost && isPlaying && buffererId === UNAVALIABLE) {
			// console.log(`Sending timing of ${playedSeconds}`);
			socket.emit("SEND_TIMING", roomId, { timing: playedSeconds });
			setSyncTime(playedSeconds);
		}
		// Host: Update DB's timing every 10 seconds
	};

	// Broadcast PLAY event to all other users
	const playCallback = () => {
		console.log("PLAYS");
		setIsPlaying(true);
		// Host: Broadcast PLAY event to all users
		// Host: Update status in DB (?)
	};

	// Broadcast PAUSE event to all other users
	const pauseCallback = () => {
		console.log("PAUSE");
		setIsPlaying(false);
		// Host: Broadcast PAUSE event to all users
		// Host: Update status in DB(?)
	};

	// Broadcast SEEK event to all other users
	const seekCallback = () => {
		console.log("VIDEO SEEKS");
		// To-do: Broadcast SEEK event to all other users. YouTube API does not provide SEEK directly
		// Save progress when PAUSE happens and compare progresses when PLAY happens
	};

	const readyCallback = () => {
		console.log("READY");
		bufferStartCallback();
	};

	// Broadcast BUFFERING event to all other users
	const hold = useCallback((sourceId) => {
		console.log(`HOLD`);
		setIsPlaying(false);
		setBuffererId(sourceId);
	}, []);
	const bufferStartCallback = () => {
		console.log(`BUFFER START`);
		if (ignoreNextBuffer) {
			console.log("IGNORED");
			setIgnoreNextBuffer(false);
		} else if (buffererId === UNAVALIABLE) {
			console.log("REQUESTING FOR HOLD");
			setBuffererId(socket.id);
			socket.emit("REQUEST_HOLD", roomId, socket.id);
		}
	};

	const release = useCallback((newTiming) => {
		console.log(`RELEASE`);
		setIgnoreNextBuffer(true);
		if (newTiming) {
			setSyncTime(newTiming);
			playerRef.current.seekTo(newTiming, "seconds");
		}
		setIsPlaying(true);
		setBuffererId(UNAVALIABLE);
	}, []);
	const bufferEndCallback = () => {
		console.log(`BUFFER END`);
		if (buffererId === socket.id) {
			if (isInitialSync) {
				console.log(`REQUESTING FOR RELEASE WITHOUT SYNC`);
				socket.emit("REQUEST_RELEASE", roomId);
				setIsInitialSync(false);
			} else {
				console.log(
					`REQUESTING FOR RELEASE, SYNC AT ${playerRef.current.getCurrentTime()}`
				);
				setSyncTime(playerRef.current.getCurrentTime());
				socket.emit("REQUEST_RELEASE", roomId, playerRef.current.getCurrentTime());
			}
			setBuffererId(UNAVALIABLE);
		} else {
			console.log("IGNORED");
		}
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
			socket.on("HOLD", hold);
			socket.on("RELEASE", release);
			return () => {
				socket.off("connect", initialize);
				socket.off("RECEIVE_URL", receiveUrl);
				socket.off("RECEIVE_TIMING", receiveTiming);
				socket.off("HOLD", hold);
				socket.off("RELEASE", release);
			};
		}
	}, [socket, initialize, receiveUrl, receiveTiming, hold, release]);

	// Sync to latest timing if the player ever goes desync
	useEffect(() => {
		// if (socket && isDesync && syncTime !== UNAVALIABLE) {
		// console.log(`${socket.id} is behind, syncing to ${syncTime}`);
		// playerRef.current.seekTo(syncTime, "seconds");
		// setIsDesync(false);
		// }

		// IS PLAYING IS ACTIVE EVEN THO PLAYER PAUSED
		if (
			isPlaying &&
			buffererId === UNAVALIABLE &&
			Math.abs(playerRef.current.getCurrentTime() - syncTime) > SYNC_THRESHOLD
		) {
			console.log(
				`isPlaying: ${isPlaying} / buffererId: ${buffererId} / timing diff: ${Math.abs(
					playerRef.current.getCurrentTime() - syncTime
				)}`
			);
			console.log(`${socket.id} is behind, syncing to ${syncTime}`);
			playerRef.current.seekTo(syncTime, "seconds");
		}
	}, [socket, syncTime, isPlaying, buffererId]);

	return (
		<ReactPlayer
			className="react-player"
			ref={playerRef}
			width="100%"
			height="100%"
			url={videoUrl}
			playing={isPlaying}
			controls
			loop
			muted
			onPlay={playCallback}
			onPause={pauseCallback}
			onProgress={timingCallback}
			onReady={readyCallback}
			onBuffer={bufferStartCallback}
			onBufferEnd={bufferEndCallback}
		/>
	);
}

export default VideoPlayer;
