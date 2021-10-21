import { Button, Typography } from "@mui/material";
import React, { useRef } from "react";
import Panel from "../Panel/Panel";
import {
	ButtonContainerWrapper,
	ButtonWrapper,
	FormWrapper,
	RecoveryButtonWrapper,
	TextFieldWrapper,
} from "./LoginPanel.styled";

function LoginPanel({ successCallback, toRegisterCallback, toRecoveryCallback }) {
	const emailRef = useRef(null);
	const passRef = useRef(null);

	const login = (e) => {
		e.preventDefault();

		console.log(
			`login with email: ${emailRef.current.value}, password: ${passRef.current.value}`
		);

		successCallback();
	};

	return (
		<Panel rowGap="1em">
			<FormWrapper onSubmit={login}>
				<TextFieldWrapper
					required
					inputRef={emailRef}
					variant="filled"
					label="Email address"
					helperText="Enter your email address"
				/>
				<TextFieldWrapper
					required
					inputRef={passRef}
					variant="filled"
					label="Password"
					type="password"
					helperText="Enter your password"
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
