import { Typography } from "@mui/material";
import React, { useRef } from "react";
import { useHistory } from "react-router";
import Panel from "../Panel/Panel";
import { ButtonWrapper, TextFieldWrapper } from "./JoinRoomPanel.styled";
import { validate as uuidValidate } from "uuid";

function JoinRoomPanel() {
	const inputRef = useRef(null);
	const history = useHistory();

	const join = async () => {
		const id = inputRef.current.value;
		if (!uuidValidate(id)) {
			console.log(`Invalid room id format... (Given id: ${id})`);
		} else {
			console.log(`Joining a room with an id of ${id}`);

			// To-do: Add user to the room in DB

			history.push(`/room/${id}`);
		}
	};

	return (
		<Panel>
			<Typography variant="h5">Jump in with your friends!</Typography>
			<TextFieldWrapper placeholder="Enter room code here..." inputRef={inputRef} />
			<ButtonWrapper variant="contained" onClick={join}>
				Join
			</ButtonWrapper>
		</Panel>
	);
}

export default JoinRoomPanel;
