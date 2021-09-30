import React from "react";
import { Switch, Route, BrowserRouter as Router } from "react-router-dom";

import Landing from "./pages/Landing";
import Room from "./pages/Room";
import NavBar from "./components/NavBar/NavBar";

import './App.css';
import { ThemeProvider } from "styled-components";
import { theme } from "./styles/theme";

function App() {
  return (
    <div>
      <Router>
        <ThemeProvider theme={theme}> 
          <NavBar />
          <Switch>
            <Route path="/room">
              <Room />
            </Route>
            <Route path="/"> 
              <Landing />
            </Route>
          </Switch>
        </ThemeProvider>
      </Router>
    </div>
  );
}

export default App;