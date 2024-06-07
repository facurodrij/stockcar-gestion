import Typography from "@mui/material/Typography";
import React from "react";
import VerticalTabPanel from "../../../components/shared/VerticalTabPanel";


export default function InvoiceTabPanel({item, value, index}) {
    return (
        <VerticalTabPanel value={value} index={index}>
            <Typography variant={"h3"} component={"span"}>Tab</Typography>
        </VerticalTabPanel>
    );
}