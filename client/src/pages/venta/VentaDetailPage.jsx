import React from 'react';
import {useParams} from 'react-router-dom';
import Typography from "@mui/material/Typography";
import {VentaDetail} from "../../components/venta";

export default function VentaDetailPage() {
    const routeParams = useParams();
    const pk = routeParams.pk;

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
                Detalle de Venta
            </Typography>
            <VentaDetail pk={pk}/>
        </>
    );
};
