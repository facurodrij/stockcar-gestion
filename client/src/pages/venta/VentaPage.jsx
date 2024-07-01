import React from 'react'
import Typography from '@mui/material/Typography';
import {VentaList} from "../../components/venta";


export default function VentaPage() {
    return (
        <>
            <Typography
                variant="h4"
                sx={{
                    mt: 2,
                    fontFamily: 'roboto',
                    color: 'inherit'
                }}
            >
                Ventas
            </Typography>
            <VentaList/>
        </>
    )
}