import styled from "styled-components";

const NavBarWrapper = styled.nav`
    display: flex;
    flex-direction: row;
    background: ${(props) => props.theme.darkGray};

    h1 {
        color: ${(props) => props.theme.white}
    }
`;

export default NavBarWrapper;