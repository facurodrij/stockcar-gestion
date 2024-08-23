import React, {useEffect} from 'react';
import Typography from '@mui/material/Typography';
import {ArticuloList} from "../../components/articulo";
import {checkAuth, checkRoles} from '../../utils/checkAuth';

export default function ArticuloPage() {
    useEffect(() => {
        checkAuth();
        checkRoles(['admin', 'vendedor']);
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
                Artículos
            </Typography>
            <ArticuloList/>
        </>
    )
}