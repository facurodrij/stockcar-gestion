import Typography from "@mui/material/Typography";
import React from "react";
import TabPanel from "../../../components/shared/TabPanel";

export default function GeneralTabPanel({item, value, index}) {
    return (
        <TabPanel value={value} index={index}>
            <Typography variant={"h3"} component={"span"}>General</Typography>
        </TabPanel>
    );
}