import React from "react";
import LandingPageWrapper from "./Landing.styled";
import CreateRoomPanel from "../../components/CreateRoomPanel/CreateRoomPanel";
import JoinRoomPanel from "../../components/JoinRoomPanel/JoinRoomPanel";
import LogoutButton from "../../components/LogoutButton/LogoutButton";

function Landing() {
	return (
		<LandingPageWrapper elevation={0}>
			<div className="landing-center">
				<CreateRoomPanel />
				<JoinRoomPanel />
			</div>
			<div className="landing-bottom">
				<LogoutButton />
			</div>
		</LandingPageWrapper>
	);
}

export default Landing;
