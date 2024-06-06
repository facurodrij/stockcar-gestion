import React, {useState} from 'react';
import Typography from '@mui/material/Typography';
import {GridActionsCellItem, GridColDef, GridRowParams} from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import dayjs from "dayjs";
import GeneralTabPanel from "./detail/GeneralTabPanel";
import InvoiceTabPanel from "./detail/InvoiceTabPanel";
import ClienteList from "../../components/cliente/ClienteList";


export default function ClientePage() {
    return (
        <>
            <Typography
                variant="h4"
                sx={{
                    mt: 2,
                    mb: 2,
                    fontFamily: 'roboto',
                    color: 'inherit'
                }}
            >
                Clientes
            </Typography>
            <ClienteList/>
        </>
    )
}
