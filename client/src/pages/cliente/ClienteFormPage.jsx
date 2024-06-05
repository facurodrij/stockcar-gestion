import React from 'react';
import {useParams} from 'react-router-dom';
import {ClienteForm} from '../../components/cliente';
import Typography from "@mui/material/Typography";

export default function ClienteFormPage() {
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
                {pk ? 'Editar' : 'Agregar'} Cliente
            </Typography>
            <ClienteForm pk={pk}/>
        </>
    );
};
