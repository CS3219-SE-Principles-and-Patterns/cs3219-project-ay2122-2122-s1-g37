import React, { useState, useEffect, useCallback } from "react";
import { ListItem, Typography } from "@mui/material";
import { ListWrapper, WatchmatesWrapper } from "./Watchmates.styled";

function Watchmates({ socket, roomId }) {
	const [users, setUsers] = useState([]);
	
	const updateUserList = useCallback((newUserList) => {
		setUsers(newUserList);
	});
	
	useEffect(() => {
		if (socket) {
			socket.on("update-user-list", updateUserList);
			return () => {
				socket.off("update-user-list", updateUserList);
			};
		}
	}, [socket, updateUserList]);
	
	return (
		<WatchmatesWrapper className="watchmates">
			<Typography align="center">{`Watchmates (${users.length})`}</Typography>
			<ListWrapper>
				{users.map((user) => {
					return (
						<ListItem key={user.id}>{`${user.name} ${
							user.isHost ? "(Host)" : ""
						}`}</ListItem>
					);
				})}
			</ListWrapper>
		</WatchmatesWrapper>
	);
}

export default Watchmates;
