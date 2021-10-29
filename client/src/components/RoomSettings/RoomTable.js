import { Checkbox, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import React, { useEffect, useContext } from "react";
import { TableContainerWrapper, KickButtonWrapper } from "./RoomTable.styled";
import UserContext from "../../components/Context/UserContext";

function RoomTable({ settings, kickCallback }) {
	const { userInfo } = useContext(UserContext);

	useEffect(() => {
		console.log("Settings received by table:");
		console.log(settings);
	}, [settings]);

	return (
		<TableContainerWrapper>
			<Table stickyHeader>
				<TableHead>
					<TableCell>Username</TableCell>
					<TableCell>Chat</TableCell>
					<TableCell>Video</TableCell>
					<TableCell>Actions</TableCell>
				</TableHead>
				<TableBody>
					{settings.users.map((user) => (
						<TableRow key={user.userId}>
							<TableCell>{user.displayName}</TableCell>
							<TableCell>
								<Checkbox
									className="table-checkbox"
									defaultChecked={user.canChat}
								/>
							</TableCell>
							<TableCell>
								<Checkbox
									className="table-checkbox"
									defaultChecked={user.canVideo}
								/>
							</TableCell>
							<TableCell>
								<KickButtonWrapper
									variant="contained"
									disabled={user.userId === userInfo.userId}
									onClick={() => kickCallback(user.userId)}
								>
									Kick
								</KickButtonWrapper>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainerWrapper>
	);
}

export default RoomTable;
