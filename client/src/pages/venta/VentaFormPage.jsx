import React from 'react';
import {useParams} from 'react-router-dom';
import Typography from "@mui/material/Typography";
import {VentaForm} from "../../components/venta";

export default function VentaFormPage() {
    // Obtener el id de la URL, si es undefined es porque se está agregando un nuevo cliente
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
                {pk ? 'Editar' : 'Agregar'} Venta
            </Typography>
            <VentaForm pk={pk}/>
        </>
    );
};
