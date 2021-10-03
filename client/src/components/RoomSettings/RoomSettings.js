import React, { useState } from "react";
import { TextField, Typography } from "@mui/material";
import {
	RoomSettingsWrapper,
	ButtonWrapper,
	ContentWrapper,
	ModalWrapper,
} from "./RoomSettings.styled";
import RoomTable from "./RoomTable";

function RoomSettings({ capacity, users, saveCallback }) {
	const [open, setOpen] = useState(false);

	const openModel = () => {
		setOpen(true);
	};

	const closeModal = () => {
		setOpen(false);
	};

	const save = () => {
		saveCallback();
	};

	return (
		<RoomSettingsWrapper>
			<ButtonWrapper variant="contained" onClick={openModel}>
				Room settings
			</ButtonWrapper>
			<ModalWrapper open={open} onClose={closeModal}>
				<ContentWrapper>
					<Typography className="settings-title">Room settings</Typography>
					<div className="settings-capacity">
						<Typography>Max capacity (Up to 15):</Typography>
						<TextField type="number" placeholder={capacity} />
					</div>
					<div className="settings-table">
						<RoomTable users={users} />
					</div>
					<div className="settings-btns">
						<ButtonWrapper variant="contained" onClick={save}>
							Save
						</ButtonWrapper>
						<ButtonWrapper variant="contained" onClick={closeModal}>
							Cancel
						</ButtonWrapper>
					</div>
				</ContentWrapper>
			</ModalWrapper>
		</RoomSettingsWrapper>
	);
}

export default RoomSettings;
