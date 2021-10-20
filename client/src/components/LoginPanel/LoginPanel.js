import { Typography } from "@mui/material";
import React, { useRef, useState } from "react";
import axios from "axios";
import Panel from "../Panel/Panel";
import { ButtonContainerWrapper, ButtonWrapper, TextFieldWrapper } from "./LoginPanel.styled";

function LoginPanel({ successCallback, toRegisterCallback }) {
	const emailRef = useRef(null);
	const passRef = useRef(null);
	const [generalFlag, setGeneralFlag] = useState(false);
	const [generalMsg, setGeneralMsg] = useState("");
	
	const loginAPI = "http://localhost:5000/api/auth/login";
	
	const login = () => {
		console.log(
			`login with email: ${emailRef.current.value}, password: ${passRef.current.value}`
		);
		
		setGeneralFlag(false);
		
		axios.post(loginAPI, {email: emailRef.current.value, password: passRef.current.value})
			.then((res) => {
				console.log("logged in");
				// wait for change in return values
				console.log(res.data);
				localStorage.setItem("token", res.data.token);
				successCallback();
			})
			.catch((err) => {
				if (err.response) {
					setGeneralFlag(true);
					setGeneralMsg(err.response.data.message);
				}
				
			})
	};

	const linkElement = <a href="">Click here</a>;

	return (
		<Panel rowGap="1em">
			{generalFlag && <p style={{ color: 'red' }}> {generalMsg} </p>}
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
				<ButtonWrapper onClick={login}>Login</ButtonWrapper>
				<ButtonWrapper onClick={toRegisterCallback}>Register</ButtonWrapper>
			</ButtonContainerWrapper>
			<Typography variant="body1">Forget your password? {linkElement}</Typography>
		</Panel>
	);
}

export default LoginPanel;
