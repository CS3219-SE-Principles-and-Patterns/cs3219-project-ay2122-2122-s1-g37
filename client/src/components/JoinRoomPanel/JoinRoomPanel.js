import { Button, TextField, Typography } from "@mui/material";
import React from "react";
import Panel from "../Panel/Panel";

function JoinRoomPanel() {
	return (
		<Panel>
			<Typography variant="h5">Jump in with your friends!</Typography>
			<TextField />
			<Button>Join</Button>
		</Panel>
	);
}

export default JoinRoomPanel;
