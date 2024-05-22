import Typography from "@mui/material/Typography";
import React from "react";
import TabPanel from "../../../components/TabPanel";


export default function InvoiceTabPanel({item, value, index}) {
    return (
        <TabPanel value={value} index={index}>
            <Typography variant={"h3"} component={"span"}>Tab</Typography>
        </TabPanel>
    );
}