import styled from "styled-components";

const RoomPageWrapper = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-around;

	background: ${(props) => props.theme.lightGray};
	height: 100%;

	// To-do: Fix aspect ratio maintaining. Currently slightly off vertically, stretches over page background on lower heights
	.room-player {
		height: 80%;
		width: 72.5%;
		.room-res-wrapper {
			position: relative;
			padding-top: 56.25%;
			.react-player {
				position: absolute;
				top: 0;
				left: 0;
			}
		}
	}
	// To-do: Fix chatbox overflowing the flex container
	.room-sidebar {
		height: 80%;
		width: 22.5%;

		display: flex;
		flex-direction: column;
		justify-content: space-around;

		.chatbox {
			height: 75%;
		}
	}
`;

export default RoomPageWrapper;
