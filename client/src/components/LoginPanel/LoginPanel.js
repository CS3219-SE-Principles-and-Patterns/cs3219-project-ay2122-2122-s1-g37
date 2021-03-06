import { Typography } from "@mui/material";
import React, { useContext, useRef, useState } from "react";
import axios from "axios";
import Panel from "../Panel/Panel";
import {
	ButtonContainerWrapper,
	ButtonWrapper,
	FormWrapper,
	RecoveryButtonWrapper,
	TextFieldWrapper,
} from "./LoginPanel.styled";
import UserContext from "../Context/UserContext";

function LoginPanel({ successCallback, toRegisterCallback, toRecoveryCallback }) {
	const emailRef = useRef(null);
	const passRef = useRef(null);
	const [generalFlag, setGeneralFlag] = useState(false);
	const [generalError, setGeneralError] = useState("");
	const { setUserInfo } = useContext(UserContext);

	const login = (e) => {
		e.preventDefault();

		setGeneralFlag(false);

		axios
			.post("/api/auth/login", {
				email: emailRef.current.value,
				password: passRef.current.value,
			})
			.then((res) => {
				// Add to context
				const newUserInfo = {
					userId: res.data.userId,
					displayName: res.data.displayName,
					email: res.data.email,
					token: res.data.token,
					isLoaded: true,
				};
				setUserInfo(newUserInfo);

				// Add token to browser
				localStorage.setItem("token", res.data.token);

				successCallback();
			})
			.catch((err) => {
				if (err.response) {
					setGeneralFlag(true);
					setGeneralError(err.response.data.message);
				}
			});
	};

	return (
		<Panel rowGap="1em">
			<FormWrapper onSubmit={login}>
				{generalFlag && <p style={{ color: "red" }}> {generalError} </p>}

				<TextFieldWrapper
					id="textfield-login-email"
					required
					inputRef={emailRef}
					variant="filled"
					label="Email address"
				/>
				<TextFieldWrapper
					id="textfield-login-pass"
					required
					inputRef={passRef}
					variant="filled"
					label="Password"
					type="password"
				/>
				<ButtonContainerWrapper>
					<ButtonWrapper type="submit">Login</ButtonWrapper>
					<ButtonWrapper onClick={toRegisterCallback}>Register</ButtonWrapper>
				</ButtonContainerWrapper>
				<Typography variant="body1">
					Forget your password?
					<RecoveryButtonWrapper onClick={toRecoveryCallback}>
						Click here
					</RecoveryButtonWrapper>
				</Typography>
			</FormWrapper>
		</Panel>
	);
}

export default LoginPanel;
