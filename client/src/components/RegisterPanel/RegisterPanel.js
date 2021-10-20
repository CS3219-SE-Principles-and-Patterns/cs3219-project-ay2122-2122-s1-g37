import React, { useRef, useState } from "react";
import axios from "axios";
import Panel from "../Panel/Panel";
import { ButtonContainerWrapper, ButtonWrapper, TextFieldWrapper } from "./RegisterPanel.styled";

function RegisterPanel({ successCallback, cancelCallback }) {
	const nameRef = useRef(null);
	const emailRef = useRef(null);
	const passRef = useRef(null);
	const passAgainRef = useRef(null);
	const [generalFlag, setGeneralFlag] = useState(false);
	const [displayNameFlag, setDisplayNameFlag] = useState(false);
	const [displayNameError, setDisplayNameError] = useState("");
	const [emailFlag, setEmailFlag] = useState(false);
	const [emailError, setEmailError] = useState("");
	const [passwordFlag, setPasswordFlag] = useState(false);
	const [passwordError, setPasswordError] = useState("");
	const [passwordAgainFlag, setPasswordAgainFlag] = useState(false);
	
	const registerAPI = "http://localhost:5000/api/auth/register";

	const resetErrors = () => {
		setGeneralFlag(false);
		setDisplayNameFlag(false);
		setEmailFlag(false);
		setPasswordFlag(false);
		setPasswordAgainFlag(false);
	}

	const register = () => {
		console.log(
			`Register with name: ${nameRef.current.value}, email: ${emailRef.current.value}, password: ${passRef.current.value}, passwordAgain: ${passAgainRef.current.value}`
		);
		
		resetErrors();
		if (passRef.current.value === passAgainRef.current.value) {
			axios.post(registerAPI, {displayname: nameRef.current.value, email: emailRef.current.value, password: passRef.current.value})
				.then((res) => {
					console.log("registered");
					// Need add user to list here
					// Wait for marcus also
					console.log(res.data);
					localStorage.setItem("token", res.data.token);
					successCallback();
				})
				.catch((err) => {
					if (err.response) {
						if (err.response.status == 422) {
							const errData = err.response.data.errors;
							console.log(errData);
							let passErrMsgSet = false;
							for (let i = 0; i < errData.length; i++) {
								if (errData[i].param === "displayname") {
									setDisplayNameFlag(true);
									setDisplayNameError(errData[i].msg);
								} else if (errData[i].param === "email") {
									setEmailFlag(true);
									setEmailError(errData[i].msg);
								} else if (!passErrMsgSet){
									// take only first password error message
									passErrMsgSet = true;
									setPasswordFlag(true);
									console.log("setting msg: " + errData[i].msg);
									setPasswordError(errData[i].msg);
								}
							}
						} else if (err.response.status == 409){
							setEmailFlag(true);
							setEmailError(err.response.data.message);
						} else {
							setGeneralFlag(true);
						}
					}
				})
		} else {
			console.log("password not the same");
			setPasswordAgainFlag(true);
		}
	};
	
	let displayNameBox;
	if (displayNameFlag) {
		displayNameBox = 
			<TextFieldWrapper
					error
					inputRef={nameRef}
					variant="filled"
					label="Display name"
					helperText={displayNameError}
			/>;
	} else {
		displayNameBox = 
			<TextFieldWrapper
				required
				inputRef={nameRef}
				variant="filled"
				label="Display name"
			/>
	}
	
	let emailBox;
	if (emailFlag) {
		emailBox = 
			<TextFieldWrapper
					error
					inputRef={emailRef}
					variant="filled"
					label="Email address"
					helperText={emailError}
			/>
	} else {
		emailBox =
			<TextFieldWrapper
					required
					inputRef={emailRef}
					variant="filled"
					label="Email address"
			/>
	}
	
	let passwordBox;
	if (passwordFlag) {
		passwordBox = 
			<TextFieldWrapper
					error
					inputRef={passRef}
					variant="filled"
					label="Password"
					type="password"
					helperText={passwordError}
			/>
	} else {
		passwordBox = 
			<TextFieldWrapper
					required
					inputRef={passRef}
					variant="filled"
					label="Password"
					type="password"
			/>
	}
	
	let passwordAgainBox;
	if (passwordAgainFlag) {
		passwordAgainBox = 
			<TextFieldWrapper
				error
				inputRef={passAgainRef}
				variant="filled"
				label="Re-enter password"
				type="password"
				helperText="Please enter the same password."
			/>
	} else {
		passwordAgainBox = 
			<TextFieldWrapper
				required
				inputRef={passAgainRef}
				variant="filled"
				label="Re-enter password"
				type="password"
			/>
	}
	
	return (
		<Panel rowGap="1em">
			{generalFlag && <p style={{ color: 'red' }}>Error when registering for account. Please ask the PeerWatch team for assistance.</p>}
			{displayNameBox}
			{emailBox}
			{passwordBox}
			{passwordAgainBox}
			<ButtonContainerWrapper>
				<ButtonWrapper onClick={register}>Register</ButtonWrapper>
				<ButtonWrapper onClick={cancelCallback}>Cancel</ButtonWrapper>
			</ButtonContainerWrapper>
		</Panel>
	);
}

export default RegisterPanel;
