import React, { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import {ComercioList} from "../../components/comercio";
import { checkAuth, checkRoles } from '../../utils/checkAuth';


export default function ComercioPage() {
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
                Comercios
            </Typography>
            <ComercioList/>
        </>
    )
}
