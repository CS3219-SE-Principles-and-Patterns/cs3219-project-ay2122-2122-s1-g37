import { Button } from "@mui/material";
import React, { useState } from "react";
import ReactPlayer from "react-player/youtube";

const initialState = {
	url: "https://www.youtube.com/watch?v=YHXB1xp-xXc",
	playing: true,
	loop: true,
	controls: true,
	playbackRate: 1,
	syncTime: 0,
	syncType: "fraction",
	muted: true,
};

function VideoPlayer() {
	const [state, setstate] = useState(initialState);

	const togglePlay = () => {
		setstate({ ...state, playing: !state.playing });
	};

	const toggleControls = () => {
		setstate({ ...state, controls: !state.controls });
	};

	const playCallback = () => {
		console.log("VIDEO PLAYS");
	};

	const pauseCallback = () => {
		console.log("VIDEO PAUSES");
	};

	return (
		<ReactPlayer
			className="react-player"
			url={state.url}
			playing={state.playing}
			playbackRate={state.playbackRate}
			loop={state.loop}
			controls={state.controls}
			muted={state.muted}
			onPlay={playCallback}
			onPause={pauseCallback}
			width="100%"
			height="100%"
		/>
	);
}

export default VideoPlayer;
