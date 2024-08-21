import React, { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import { UsuarioList } from '../../components/usuario';
import { checkAuth, checkRoles } from '../../utils/checkAuth';

export default function UsuarioPage() {
    useEffect(() => {
        checkAuth();
        checkRoles(['admin']);
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
