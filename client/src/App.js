import React from "react";
import { Switch, Route, BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { theme } from "./styles/theme";

import Landing from "./pages/Landing/Landing";
import Room from "./pages/Room/Room";
import NavBar from "./components/NavBar/NavBar";
import AppWrapper from "./App.styled";

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <AppWrapper>
          <div className="app-navbar"> 
            <NavBar />
          </div>
          <div className="app-content"> 
            <Switch>
              <Route path="/room">
                <Room />
              </Route>
              <Route path="/"> 
                <Landing />
              </Route>
            </Switch>
          </div>
        </AppWrapper>
      </ThemeProvider>
    </Router>
  );
}

export default App;