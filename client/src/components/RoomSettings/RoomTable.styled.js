import { styled as mstyled } from "@mui/material/styles";
import { TableContainer, Button } from "@mui/material";
import { theme } from "../../styles/theme";

export const TableContainerWrapper = mstyled(TableContainer)`
    max-height: 100%;
`;

export const KickButtonWrapper = mstyled(Button)({
	background: theme.orange,
	color: theme.darkGray,
	marginLeft: "15px",
});
