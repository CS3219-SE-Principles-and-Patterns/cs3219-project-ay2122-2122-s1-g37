import { Button, Typography } from "@mui/material";
import React from "react";
import Panel from "../Panel/Panel";

function CreateRoomPanel() {
	return (
		<Panel>
			<Typography variant="h5">Host a room for your friends!</Typography>
			<Button>Create room</Button>
		</Panel>
	);
}

export default CreateRoomPanel;
