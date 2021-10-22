import React from "react";
import { useHistory } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { Typography } from "@mui/material";
import { ButtonWrapper } from "./CreateRoomPanel.styled";
import Panel from "../Panel/Panel";

function CreateRoomPanel() {
	const history = useHistory();

	const create = () => {
		const PLACEHOLDER_USER_ID = 10;
		const roomId = uuidv4();

		const newRoom = {
			roomId,
			hostId: PLACEHOLDER_USER_ID, // To-do: replace with actual user's id, obtained from logging in
		};

		axios
			.post("/api/rooms/create", newRoom)
			.then((createRes) => {
				history.push(`/room/${newRoom.roomId}`);
			})
			.catch((createErr) => {
				console.log(createErr);
			});
	};

	return (
		<Panel>
			<Typography variant="h5">Host a room for your friends!</Typography>
			<ButtonWrapper variant="contained" onClick={create}>
				Create room
			</ButtonWrapper>
		</Panel>
	);
}

export default CreateRoomPanel;
