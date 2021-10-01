import styled from "styled-components";

const ChatboxWrapper = styled.div`
    width: 30%;
    height: 50%;
    background: ${(props) => props.theme.darkGray};
    padding: 10px;

    display: flex;
    flex-direction: column;

    .chatbox-content {
        height: 90%;
        // flex-grow: 1;
    }

    .chatbox-input {
        height: 10%;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
`;

export default ChatboxWrapper;