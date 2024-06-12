import Typography from "@mui/material/Typography";
import React from "react";
import VerticalTabPanel from "../../shared/VerticalTabPanel";

export default function GeneralTabPanel({item, value, index}) {
    return (
        <VerticalTabPanel value={value} index={index}>
            <Typography variant={"h3"} component={"span"}>General</Typography>
        </VerticalTabPanel>
    );
}