import React, { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import { UsuarioList } from '../../components/usuario';
import { checkAuth } from '../../utils/checkAuth';

export default function UsuarioPage() {
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
                Usuarios
            </Typography>
            <UsuarioList/>
        </>
    )
}
