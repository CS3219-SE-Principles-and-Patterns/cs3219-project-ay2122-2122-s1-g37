import React from 'react'
import { Link } from "react-router-dom"
import NavBarWrapper from "./NavBar.styled"

function NavBar() {
    return (
        <NavBarWrapper>
          <h1>PeerWatch</h1>
          <Link to="/">Home</Link>
          <Link to="/room">Room</Link>
        </NavBarWrapper>
    )
}

export default NavBar