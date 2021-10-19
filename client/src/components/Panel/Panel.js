import React from "react";
import { PanelWrapper } from "./Panel.styled";

function Panel({ children }) {
	return <PanelWrapper>{children}</PanelWrapper>;
}

export default Panel;
