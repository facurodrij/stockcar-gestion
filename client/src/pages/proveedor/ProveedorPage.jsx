import React, { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import {ProveedorList} from "../../components/proveedor";
import { checkAuth, checkPermissions } from '../../utils/checkAuth';


export default function ProveedorPage() {
    useEffect(() => {
        checkAuth();
        if (!checkPermissions(['proveedor.view_all'])) {
            window.location.href = '/unauthorized';
        }
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
                Proveedores
            </Typography>
            <ProveedorList/>
        </>
    )
}
