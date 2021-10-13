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

const debounce = (func, duration) => {
	let timeout;

	return (...args) => {
		console.log(`Debounced with ${args[0]}`);

		const later = () => {
			clearTimeout(timeout);
			func(...args);
			console.log(`set to ${args[0]}`);
		};

		clearTimeout(timeout);
		timeout = setTimeout(later, duration);
	};
};

const throttleSetState = (setState, delay) => {
	let throttleTimeout = null;
	let storedState = null;

	const throttledSetState = (state) => {
		storedState = state;

		const shouldSetState = !throttleTimeout;
		console.log("Setting throttled isPlaying...");

		if (shouldSetState) {
			setState(state);
			console.log(state);

			storedState = null;

			throttleTimeout = setTimeout(() => {
				throttleTimeout = null;

				if (storedState) {
					throttleSetState(storedState);
				}
			}, delay);
		} else {
			console.log(`TIMEOUT yet to happen, ${storedState}`);
		}
	};

	return throttledSetState;
};

function VideoPlayer({ socket, roomId, users, user, url }) {
	const [videoUrl, setVideoUrl] = useState("");
	const [isPlaying, setIsPlaying] = useState(true);

	const [syncTime, setSyncTime] = useState(UNAVALIABLE);
	const [buffererId, setBuffererId] = useState(UNAVALIABLE);
	const [ignoreNextBuffer, setIgnoreNextBuffer] = useState(false);
	const [isInitialSync, setIsInitialSync] = useState(true);
	const [readyCount, setReadyCount] = useState(UNAVALIABLE);
	const [isReleased, setIsReleased] = useState(false);

	const [throttledSetPlaying] = useState(() => throttleSetState(setIsPlaying, 0));
	const [debouncedSetPlaying] = useState(() => debounce(setIsPlaying, 250));

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
		if (!isPlaying) {
			setIsPlaying(true);
		}
		// Host: Broadcast PLAY event to all users
		// Host: Update status in DB (?)
	};

	// Broadcast PAUSE event to all other users
	const pauseCallback = () => {
		console.log(`PAUSE, isPlaying: ${isPlaying} isReleased: ${isReleased}`);
		if (isPlaying) {
			setIsPlaying(false);
		}

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
		// throttledSetPlaying(false);
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
			setIsPlaying(true);
		}
	};

	// const release = useCallback((newTiming) => {
	// 	console.log(`RELEASE`);
	// 	setIgnoreNextBuffer(true);
	// 	if (newTiming) {
	// 		setSyncTime(newTiming);
	// 		playerRef.current.seekTo(newTiming, "seconds");
	// 	}
	// 	setIsPlaying(true);
	// 	setBuffererId(UNAVALIABLE);
	// }, []);
	const prepareRelease = useCallback(
		(newTiming) => {
			console.log("PREPARE FOR RELEASE");
			setSyncTime(newTiming);
			playerRef.current.seekTo(newTiming);
			debouncedSetPlaying(true);
			// throttledSetPlaying(true);
			// setIsPlaying(true);
		},
		[debouncedSetPlaying]
	);
	const release = useCallback(() => {
		console.log(`RELEASE`);
		setIgnoreNextBuffer(true);
		debouncedSetPlaying(true);
		// throttledSetPlaying(true);
		// setIsPlaying(true);
		// setIsReleased(true);
		setBuffererId(UNAVALIABLE);
	}, [debouncedSetPlaying]);
	const receiveReady = useCallback(() => {
		if (!socket) {
			return;
		}
		const newCount = readyCount - 1;
		if (newCount === 0) {
			console.log("RECEIVED ALL READYS, RELEASING ALL...");
			debouncedSetPlaying(true);
			// throttledSetPlaying(true);
			// setIsPlaying(true);
			socket.emit("REQUEST_RELEASE_ALL", roomId);
			setBuffererId(UNAVALIABLE);
			setReadyCount(UNAVALIABLE);
		} else {
			console.log(`Count: ${newCount}`);
			setReadyCount(newCount);
		}
	}, [readyCount, roomId, socket, debouncedSetPlaying]);
	const bufferEndCallback = () => {
		console.log(`BUFFER END`);
		if (buffererId === socket.id) {
			if (isInitialSync) {
				console.log(`[INITIAL] RELEASE ALL WITHOUT SYNC`);
				socket.emit("REQUEST_RELEASE_ALL", roomId);
				setIsInitialSync(false);
				setBuffererId(UNAVALIABLE);
			} else {
				if (users.length === 1) {
					console.log(`RELEASE ALL WITHOUT SYNC`);
					socket.emit("REQUEST_RELEASE_ALL", roomId);
					setSyncTime(playerRef.current.getCurrentTime());
					setIsInitialSync(false);
					setBuffererId(UNAVALIABLE);
				} else {
					console.log(
						`REQUESTING FOR RELEASE ALL WITH SYNC AT ${playerRef.current.getCurrentTime()}`
					);
					setReadyCount(users.length - 1);
					setSyncTime(playerRef.current.getCurrentTime());
					debouncedSetPlaying(false);
					socket.emit("REQUEST_RELEASE", roomId, playerRef.current.getCurrentTime());
				}
			}
		} else if (buffererId !== UNAVALIABLE && buffererId !== socket.id) {
			console.log("READY TO RELEASE");
			debouncedSetPlaying(false);
			// setIsPlaying(false);
			socket.emit("REQUEST_RELEASE_READY", buffererId);
			setBuffererId(UNAVALIABLE);
		} else {
			console.log("IGNORED");
		}
	};
	// useEffect(() => {
	// 	if (!isPlaying && isReleased) {
	// 		setIsPlaying(true);
	// 		setIsReleased(false);
	// 		console.log("Re-adjust isPlaying");
	// 	}
	// }, [isPlaying, isReleased]);

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
			socket.on("PREPARE_RELEASE", prepareRelease);
			socket.on("RELEASE_READY", receiveReady);
			socket.on("RELEASE", release);
			return () => {
				socket.off("connect", initialize);
				socket.off("RECEIVE_URL", receiveUrl);
				socket.off("RECEIVE_TIMING", receiveTiming);
				socket.off("HOLD", hold);
				socket.off("PREPARE_RELEASE", prepareRelease);
				socket.off("RELEASE_READY", receiveReady);
				socket.off("RELEASE", release);
			};
		}
	}, [
		socket,
		initialize,
		receiveUrl,
		receiveTiming,
		hold,
		release,
		prepareRelease,
		receiveReady,
	]);

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
			syncTime !== UNAVALIABLE &&
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
