import styled from "styled-components";
import {styled as mStyled} from "@mui/material/styles";
import { List } from "@mui/material";

export const ChatContentWrapper = styled.div`
    background: ${(props) => props.theme.darkGray};
    height: 100%;
    li {
        color: ${(props) => props.theme.white};
    }
`;

export const ListWrapper = mStyled(List)({
    overflow: "auto",
    maxHeight: "100%",
    padding: "0px",
});