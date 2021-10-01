import React from "react";
import { Switch, Route, BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { theme } from "./styles/theme";
import Grid from "@mui/material/Grid";

import Landing from "./pages/Landing/Landing";
import Room from "./pages/Room";
import NavBar from "./components/NavBar/NavBar";
import GridWrapper from "./pages/Landing/Landing.styled";

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <GridWrapper container direction="column  ">
          <Grid item xs="auto"> 
            <NavBar />
          </Grid>
          <Grid item xs="auto"> 
            <Switch>
              <Route path="/room">
                <Room />
              </Route>
              <Route path="/"> 
                <Landing />
              </Route>
            </Switch>
          </Grid>
        </GridWrapper>
      </ThemeProvider>
    </Router>
  );
}

export default App;