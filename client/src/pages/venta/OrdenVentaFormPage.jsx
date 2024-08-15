import React, {useEffect} from 'react';
import {useParams} from 'react-router-dom';
import Typography from "@mui/material/Typography";
import {OrdenVentaForm} from "../../components/venta";
import {checkAuth} from '../../utils/checkAuth';

export default function OrdenVentaFormPage() {
    const routeParams = useParams();
    const pk = routeParams.pk;
    
    useEffect(() => {
        checkAuth();
    }, []);

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
                {pk ? 'Editar' : 'Agregar'} Orden de Venta
            </Typography>
            <OrdenVentaForm pk={pk}/>
        </>
    );
};
