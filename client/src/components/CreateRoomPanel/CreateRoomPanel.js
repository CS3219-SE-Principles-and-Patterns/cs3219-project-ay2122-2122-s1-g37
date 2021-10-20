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
		const newRoom = {
			roomId: uuidv4(),
			hostId: 5, // To-do: replace with actual user's id, obtained from logging in
			capacity: 15, // Leaving blank does not work when there's supposed to be a default value
		};
		console.log(`Creating a room with an id of ${newRoom.roomId}`);

		// Create a room entry in DB
		axios
			.post("/api/rooms/create", newRoom)
			.then((res) => {
				history.push(`/room/${newRoom.roomId}`);
			})
			.catch((err) => {
				console.log(err);
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
