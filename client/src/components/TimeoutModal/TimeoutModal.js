import { Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { ContentWrapper, ModalWrapper } from "./TimeoutModal.styled";
import { useHistory } from "react-router";

const TIMEOUT_DURATION_SECONDS = 5;

function TimeoutModal({ isOpen, closeCallback }) {
	const [timerDisplay, setTimerDisplay] = useState(TIMEOUT_DURATION_SECONDS);
	const [timeoutTimer, setTimeoutTimer] = useState(null);
	const history = useHistory();

	const close = () => {
		if (timeoutTimer) {
			clearInterval(timeoutTimer);
		}
		closeCallback();
	};

	useEffect(() => {
		const startTimer = (duration) => {
			let timeLeft = duration;

			let timer = setInterval(() => {
				setTimerDisplay(timeLeft);
				timeLeft--;

				if (timeLeft < 0) {
					history.push("/");
					clearInterval(timer);
				}
			}, 1000);

			setTimeoutTimer(timer);
		};

		if (isOpen) {
			setTimerDisplay(TIMEOUT_DURATION_SECONDS);
			startTimer(TIMEOUT_DURATION_SECONDS);
		}
	}, [isOpen, history]);

	return (
		<ModalWrapper open={isOpen} onClose={close}>
			<ContentWrapper>
				<Typography variant="h4">Are you still there?</Typography>
				<Typography variant="h6">Click anywhere outside this prompt</Typography>
				<Typography variant="h6">{`Else, you will get kick in ${timerDisplay} seconds!`}</Typography>
			</ContentWrapper>
		</ModalWrapper>
	);
}

export default TimeoutModal;
