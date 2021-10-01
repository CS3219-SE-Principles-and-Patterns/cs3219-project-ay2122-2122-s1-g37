import styled from "styled-components";

const AppWrapper = styled.div`
    height: 100%;

    display: flex;
    flex-direction: column;

    .app-navbar {
        flex-grow: 0;
    }

    .app-content {
        flex-grow: 1;
    }
`;

export default AppWrapper;