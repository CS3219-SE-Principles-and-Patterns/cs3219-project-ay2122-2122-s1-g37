import React from "react";
import Panel from "../Panel/Panel";
import { ButtonContainerWrapper, ButtonWrapper, TextFieldWrapper } from "./RegisterPanel.styled";

function RegisterPanel() {
	return (
		<Panel rowGap="1em">
			<TextFieldWrapper variant="filled" label="Display name" helperText="Enter your name" />
			<TextFieldWrapper
				variant="filled"
				label="Email address"
				helperText="Enter your email address"
			/>
			<TextFieldWrapper variant="filled" label="Password" helperText="Enter your password" />
			<TextFieldWrapper
				variant="filled"
				label="Re-enter password"
				helperText="Enter your password again"
			/>
			<ButtonContainerWrapper>
				<ButtonWrapper>Register</ButtonWrapper>
				<ButtonWrapper>Cancel</ButtonWrapper>
			</ButtonContainerWrapper>
		</Panel>
	);
}

export default RegisterPanel;
