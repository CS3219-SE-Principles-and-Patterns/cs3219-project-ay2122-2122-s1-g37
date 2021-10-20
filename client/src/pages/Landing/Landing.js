import React, { useState, useEffect } from "react";
import LandingPageWrapper from "./Landing.styled";
import CreateRoomPanel from "../../components/CreateRoomPanel/CreateRoomPanel";
import JoinRoomPanel from "../../components/JoinRoomPanel/JoinRoomPanel";
import LogoutButton from "../../components/LogoutButton/LogoutButton";
import RegisterPanel from "../../components/RegisterPanel/RegisterPanel";
import LoginPanel from "../../components/LoginPanel/LoginPanel";
import axios from "axios";

const PANEL_TYPE_REGISTER = "register";
const PANEL_TYPE_LOGIN = "login";
const PANEL_TYPE_RECOVERY = "recovery";

function Landing() {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [accPanelType, setAccPanelType] = useState(PANEL_TYPE_LOGIN);
	
	const logOut = () => {
		setIsLoggedIn(false);
		localStorage.removeItem("token");
	};

	const toRegister = () => {
		setAccPanelType(PANEL_TYPE_REGISTER);
	};

	const toLogin = () => {
		setAccPanelType(PANEL_TYPE_LOGIN);
	};

	const authAPI = "http://localhost:5000/api/auth/authtoken";

	useEffect(() => {
		const userToken = localStorage.getItem("token");
		if (userToken == null) {
			setIsLoggedIn(false);
		} else {
			const config = {headers: {Authorization: `Bearer ${userToken}`}};
			axios.post(authAPI, {}, config)
				.then((res) => {
					console.log(res.data);
					setIsLoggedIn(true);
				})
				.catch((err) => {
					setIsLoggedIn(false);
					if (err.response) {
						console.log(err.response.data);
					}
				})
		}
	}, []);

	return (
		<LandingPageWrapper elevation={0}>
			{isLoggedIn && (
				<>
					<div className="landing-room-center">
						{isLoggedIn && (
							<>
								<CreateRoomPanel />
								<JoinRoomPanel />
							</>
						)}
					</div>
					<div className="landing-room-bottom">
						{isLoggedIn && <LogoutButton clickCallback={logOut} />}
					</div>
				</>
			)}
			{!isLoggedIn && (
				<div className="landing-account-center">
					{accPanelType === PANEL_TYPE_REGISTER && (
						<RegisterPanel 
							successCallback={() => {setIsLoggedIn(true); toLogin();}}
							cancelCallback={toLogin} 
						/>
					)}
					{accPanelType === PANEL_TYPE_LOGIN && (
						<LoginPanel
							successCallback={() => setIsLoggedIn(true)}
							toRegisterCallback={toRegister}
						/>
					)}
				</div>
			)}
		</LandingPageWrapper>
	);
}

export default Landing;
