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
const UNAVALIABLE = -1;
const THRESHOLD_SYNC = 1;
const DELAY_DEBOUNCED_PLAYING = 250;

const timeout = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};
const debounce = (func, duration) => {
	let timeout;
	return (...args) => {
		console.log(`debounce playing with ${args[0]}`);

		const later = () => {
			clearTimeout(timeout);
			func(...args);
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

	const [buffererId, setBuffererId] = useState(UNAVALIABLE);
	const [isInitialSync, setIsInitialSync] = useState(true);
	const [playbackRate, setPlaybackRate] = useState(1);

	const [debouncedSetPlaying] = useState(() => debounce(setIsPlaying, DELAY_DEBOUNCED_PLAYING));

	const playerRef = useRef(null);

	// Synchronize to the given timing
	const syncTo = useCallback(
		(timing) => {
			// console.log(`isPlaying: ${isPlaying} / buffererId: ${buffererId} / timing: ${timing}`);
			// console.log(
			// 	`playerRef: ${playerRef} / playerRef.curr: ${
			// 		playerRef.current
			// 	} / playerRef.curr.currentTime: ${playerRef.current.getCurrentTime()}`
			// );
			if (
				socket &&
				isPlaying &&
				playerRef.current &&
				buffererId === UNAVALIABLE &&
				timing !== UNAVALIABLE &&
				Math.abs(playerRef.current.getCurrentTime() - timing) > THRESHOLD_SYNC
			) {
				console.log(
					`isPlaying: ${isPlaying} / buffererId: ${buffererId} / curr: ${playerRef.current.getCurrentTime()} / syncAt: ${timing} / timing diff: ${Math.abs(
						playerRef.current.getCurrentTime() - timing
					)}`
				);
				console.log(`${socket.id} is behind, syncing to ${timing}`);
				playerRef.current.seekTo(timing, "seconds");
			}
		},
		[isPlaying, buffererId, socket]
	);

	// Initialize player with an URL
	const initialize = useCallback(async () => {
		socket.emit("join-room", roomId, async () => {
			console.log(`${socket.id} has joined the video room`);

			// To-do: Fetch room info from DB
			const [roomInfo] = await Promise.all([placeholderRoomInfo, timeout(1000)]);

			if (roomInfo.url.length > 0) {
				setVideoUrl(roomInfo.url);
				console.log(`${socket.id} found URL for the room ${roomId}, loading it to player`);
			} else {
				setVideoUrl(fallbackURL);
				console.log(
					`${socket.id} cannot found URL for the room ${roomId}, using fallback...`
				);
			}
		});
	}, [socket, roomId]);

	// Synchronize URL when a new URL is entered
	const receiveUrl = useCallback(
		(url) => {
			setIsInitialSync(true);
			setVideoUrl(url);
		},
		[setVideoUrl]
	);
	useEffect(() => {
		if (socket && url) {
			// Self: Update state
			setIsInitialSync(true);
			setVideoUrl(url);

			// Self: Broadcast new URL to all
			if (url !== fallbackURL) {
				socket.emit("SEND_URL", roomId, url);
			}

			// Self: To-do - Update DB's URL
		}
	}, [socket, roomId, url]);

	// Synchronize timing of the users
	const receiveTiming = useCallback(
		({ timing }) => {
			if (!user.isHost) {
				// console.log(`Receive timing of ${timing}`);
				syncTo(timing);
			}
		},
		[user.isHost, syncTo]
	);
	const timingCallback = ({ playedSeconds }) => {
		// Host: Broadcast timing every second
		if (user.isHost && isPlaying && buffererId === UNAVALIABLE) {
			// console.log(`Sent timing of ${playedSeconds}`);
			socket.emit("SEND_TIMING", roomId, { timing: playedSeconds });
			syncTo(playedSeconds);
		}
	};

	// Broadcast PLAY to all other users
	const play = useCallback(() => {
		setIsPlaying(true);
	}, []);
	const playCallback = () => {
		console.log("PLAYS");
		if (!isPlaying) {
			console.log("PLAY ALL");
			// Host: Broadcast PLAY event to all users
			socket.emit("PLAY_ALL", roomId);

			// Host: Update status in DB (?)

			setIsPlaying(true);
		}
	};

	// Broadcast PAUSE to all other users
	const pause = useCallback(() => {
		setIsPlaying(false);
	}, []);
	const pauseCallback = () => {
		console.log(`PAUSE, isPlaying: ${isPlaying}`);
		if (isPlaying && buffererId === UNAVALIABLE) {
			console.log("PAUSE ALL");
			// Host: Broadcast PAUSE event to all users
			socket.emit("PAUSE_ALL", roomId);

			// Host: Update status in DB(?)

			setIsPlaying(false);
		}
	};

	// Synchronize the playback rate between users
	const playbackRateChange = useCallback((newRate) => {
		setPlaybackRate(newRate);
	}, []);
	const rateChangeCallback = (rateObj) => {
		console.log(`PLAYBACK SPEED CHANGE TO ${rateObj.data}`);
		setPlaybackRate(rateObj.data);
		socket.emit("PLAYBACK_RATE_CHANGE_ALL", roomId, rateObj.data);
	};

	// Synchronize the playback settings between users
	const querySettings = useCallback(
		(recipientId) => {
			if (user.isHost) {
				const settings = {
					isPlaying,
					playbackRate,
				};

				console.log(
					`Host ${socket.id} provides a setting of isPlaying: ${settings.isPlaying}, playbackRate: ${settings.playbackRate}`
				);
				socket.emit("REPLY_SETTINGS", roomId, recipientId, settings);
			}
		},
		[isPlaying, playbackRate, roomId, socket, user.isHost]
	);
	const receiveSettings = useCallback(
		(recipientId, settings) => {
			if (socket.id === recipientId) {
				console.log(
					`Receive new settings: isPlaying: ${settings.isPlaying}, playbackRate: ${settings.playbackRate}`
				);
				setPlaybackRate(settings.playbackRate);
				setIsPlaying(settings.isPlaying);
			}
		},
		[socket]
	);
	const synchroniseSettings = () => {
		if (!user.isHost) {
			console.log(`${socket.id} request for settings...`);
			socket.emit("REQUEST_SETTINGS", roomId);
		}
	};

	// Callback when the player completed initial loading and ready to go
	const readyCallback = (player) => {
		console.log("READY");

		// Attach callback for change in playback rate
		player.getInternalPlayer().addEventListener("onPlaybackRateChange", rateChangeCallback);

		synchroniseSettings();
		bufferStartCallback();
	};

	// Initialize a HOLD when a user buffers
	const hold = useCallback((sourceId) => {
		console.log(`HOLD`);
		setIsPlaying(false);
		setBuffererId(sourceId);
	}, []);
	const bufferStartCallback = () => {
		console.log(`BUFFER START`);
		if (buffererId === UNAVALIABLE) {
			console.log("REQUESTING FOR HOLD");
			setBuffererId(socket.id);
			socket.emit("REQUEST_HOLD", roomId, socket.id);
			setIsPlaying(true);
		} else {
			console.log("IGNORED");
		}
	};

	// When buffering completes, sync-up with other users via handshaking
	const prepareRelease = useCallback(
		(newTiming) => {
			console.log("PREPARE FOR RELEASE");
			// setSyncTime(newTiming);
			playerRef.current.seekTo(newTiming);
			debouncedSetPlaying(true);
		},
		[debouncedSetPlaying]
	);
	const release = useCallback(() => {
		console.log(`RELEASE`);
		debouncedSetPlaying(true);
		setBuffererId(UNAVALIABLE);
	}, [debouncedSetPlaying]);
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
					// setSyncTime(playerRef.current.getCurrentTime());
					setIsInitialSync(false);
					setBuffererId(UNAVALIABLE);
				} else {
					console.log(
						`REQUESTING FOR RELEASE ALL WITH SYNC AT ${playerRef.current.getCurrentTime()}`
					);
					// setSyncTime(playerRef.current.getCurrentTime());
					debouncedSetPlaying(false);
					socket.emit(
						"REQUEST_RELEASE",
						roomId,
						playerRef.current.getCurrentTime(),
						users.length - 1
					);
				}
			}
		} else if (buffererId !== UNAVALIABLE && buffererId !== socket.id) {
			console.log("READY TO RELEASE");
			debouncedSetPlaying(false);
			socket.emit("REQUEST_RELEASE_READY", roomId, buffererId, users.length - 1, release);
			setBuffererId(UNAVALIABLE);
		} else {
			console.log("IGNORED");
		}
	};

	// Apply event handlers when the player re-renders
	useEffect(() => {
		if (socket) {
			socket.on("connect", initialize);
			socket.on("RECEIVE_URL", receiveUrl);
			socket.on("RECEIVE_TIMING", receiveTiming);
			socket.on("HOLD", hold);
			socket.on("PREPARE_RELEASE", prepareRelease);
			socket.on("RELEASE", release);
			socket.on("PLAY", play);
			socket.on("PAUSE", pause);
			socket.on("PLAYBACK_RATE_CHANGE", playbackRateChange);
			socket.on("QUERY_SETTINGS", querySettings);
			socket.on("RECEIVE_SETTINGS", receiveSettings);
			return () => {
				socket.off("connect", initialize);
				socket.off("RECEIVE_URL", receiveUrl);
				socket.off("RECEIVE_TIMING", receiveTiming);
				socket.off("HOLD", hold);
				socket.off("PREPARE_RELEASE", prepareRelease);
				socket.off("RELEASE", release);
				socket.off("PLAY", play);
				socket.off("PAUSE", pause);
				socket.off("PLAYBACK_RATE_CHANGE", playbackRateChange);
				socket.off("QUERY_SETTINGS", querySettings);
				socket.off("RECEIVE_SETTINGS", receiveSettings);
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
		playbackRateChange,
		play,
		pause,
		receiveSettings,
		querySettings,
	]);

	return (
		<ReactPlayer
			className="react-player"
			ref={playerRef}
			width="100%"
			height="100%"
			url={videoUrl}
			playing={isPlaying}
			playbackRate={playbackRate}
			controls
			loop
			muted
			config={{
				youtube: {
					playerVars: {
						disablekb: buffererId === UNAVALIABLE ? 0 : 1,
						modestbranding: 1,
						rel: 0,
						start: 1,
					},
				},
			}}
			onPlay={playCallback}
			onPause={pauseCallback}
			onProgress={timingCallback}
			onReady={readyCallback}
			onBuffer={bufferStartCallback}
			onBufferEnd={bufferEndCallback}
			style={{ pointerEvents: buffererId === UNAVALIABLE ? "auto" : "none" }}
		/>
	);
}

export default VideoPlayer;
