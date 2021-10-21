import React, { useRef, useState, useContext, useEffect } from "react";
import axios from "axios";
import Panel from "../Panel/Panel";
import { ButtonContainerWrapper, ButtonWrapper, TextFieldWrapper } from "./RegisterPanel.styled";
import { useUser } from "../Context/UserContext"

const credentialsErrCode = 422;
const emailExistsErrCode = 409;
const passwordAgainError = "Please enter the same password.";

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
	const { userInfo, setUserInfo } = useUser();

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
			axios.post("http://localhost:5000/api/auth/register", {displayname: nameRef.current.value, email: emailRef.current.value, password: passRef.current.value})
				.then((res) => {
					console.log("registered");
					
					// Add to context
					const newUserInfo = {
						userId: res.data.userId,
						displayname: res.data.displayname,
						email: res.data.email,
						token: res.data.token
					}
					setUserInfo(newUserInfo);
					console.log("added user to context");
					
					// Add token to browser
					localStorage.setItem("token", res.data.token);
					successCallback();
				})
				.catch((err) => {
					if (err.response) {
						if (err.response.status == credentialsErrCode) {
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
									setPasswordError(errData[i].msg);
								}
							}
						} else if (err.response.status == emailExistsErrCode){
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
	
	return (
		<Panel rowGap="1em">
			{generalFlag && <p style={{ color: 'red' }}>Error when registering for account. Please ask the PeerWatch team for assistance.</p>}
			<TextFieldWrapper
					required
					error={displayNameFlag}
					inputRef={nameRef}
					variant="filled"
					label="Display name"
					helperText={displayNameFlag ? displayNameError : ""}
			/>
			<TextFieldWrapper
					required
					error={emailFlag}
					inputRef={emailRef}
					variant="filled"
					label="Email address"
					helperText={emailFlag ? emailError : ""}
			/>
			<TextFieldWrapper
					required
					error={passwordFlag}
					inputRef={passRef}
					variant="filled"
					label="Password"
					type="password"
					helperText={passwordFlag ? passwordError : ""}
			/>
			<TextFieldWrapper
				required
				error={passwordAgainFlag}
				inputRef={passAgainRef}
				variant="filled"
				label="Re-enter password"
				type="password"
				helperText={passwordAgainFlag ? passwordAgainError : ""}
			/>
			<ButtonContainerWrapper>
				<ButtonWrapper onClick={register}>Register</ButtonWrapper>
				<ButtonWrapper onClick={cancelCallback}>Cancel</ButtonWrapper>
			</ButtonContainerWrapper>
		</Panel>
	);
}

export default RegisterPanel;
