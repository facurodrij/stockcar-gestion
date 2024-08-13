import React from 'react';
import {useParams} from 'react-router-dom';
import Typography from "@mui/material/Typography";
import {ComercioForm} from '../../components/comercio';

export default function ComercioFormPage() {
    // Obtener el id de la URL, si es undefined es porque se está agregando un nuevo comercio
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
                {pk ? 'Editar' : 'Agregar'} Comercio
            </Typography>
            <ComercioForm pk={pk}/>
        </>
    );
};
