import styled from "styled-components";

export const RoomPageWrapper = styled.div`
	background: ${(props) => props.theme.lightGray};
	min-height: 100%;

	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
`;

export const RoomContainerWrapper = styled.div`
	width: 98%;

	display: grid;
	grid-template-rows: none;
	grid-template-columns: 1fr auto;
	grid-row-gap: 0em;
	grid-column-gap: 1em;
	align-items: center;
	justify-content: space-evenly;

	.room-player {
		.room-res-wrapper {
			position: relative;
			${(props) => (!props.isWaiting ? "padding-top: 56.25%;" : "")}
			.react-player {
				position: absolute;
				top: 0;
				left: 0;
			}
		}
		.room-join-fallback {
			height: 100%;
			width: 100%;

			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
		}
	}

	.room-sidebar {
		height: 100%;

		display: ${(props) => (props.isWaiting ? "none" : "grid")};
		grid-template-rows: auto 4fr 8fr auto;
		grid-row-gap: 1em;
	}

	@media (max-width: 1000px) {
		display: block;
	}
`;
