import styled from "styled-components";
import { styled as mStyled } from "@mui/material/styles";
import { Modal } from "@mui/material";

export const ModalWrapper = mStyled(Modal)`
    position: fixed;
    z-index: 1300;
    right: 0;
    bottom: 0;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const ContentWrapper = styled.div`
	width: 40%;
	height: 50%;
	padding: 15px;
	background: ${(props) => props.theme.darkGray};

	h4 {
		color: ${(props) => props.theme.orange};
	}

	h6 {
		color: ${(props) => props.theme.white};
	}
`;
