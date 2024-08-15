import React, { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import {VentaList} from "../../components/venta";
import { checkAuth } from '../../utils/checkAuth';

function VentaPage() {
    useEffect(() => {
        checkAuth(); // Check if user is logged in
        // TODO checkRoles(['admin', 'user']); // Check if user has roles
    }, []);

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

export default VentaPage;