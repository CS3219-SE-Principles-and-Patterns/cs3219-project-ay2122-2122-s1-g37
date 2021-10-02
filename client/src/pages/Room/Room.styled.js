import styled from "styled-components";

const RoomPageWrapper = styled.div`
    height: 100%;
    background: ${(props) => props.theme.lightGray};

    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;

    h3 {
        color: ${(props) => props.theme.white};
    }
`;

export default RoomPageWrapper;