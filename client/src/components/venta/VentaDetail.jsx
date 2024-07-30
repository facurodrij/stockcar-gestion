import React, { useEffect, useState } from 'react';
import { API } from "../../App";
import SnackbarAlert from "../shared/SnackbarAlert";

export default function VentaDetail({ pk }) {
    const [venta, setVenta] = useState({});
    const [loading, setLoading] = useState(true);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        onClose: () => handleCloseSnackbar(false)
    });

    const handleCloseSnackbar = (redirect) => {
        setOpenSnackbar(false);
        if (redirect) {
            window.location.href = '/ventas';
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            const url = `${API}/ventas/${pk}`;
            const res = await fetch(url);
            if (!res.ok) {
                console.error(res);
                throw new Error('Error al obtener la venta:', res);
            }
            return await res.json();
        }
        const loadData = async () => {
            try {
                const data = await fetchData();
                setVenta(data);
            }
            catch (error) {
                setSnackbar({
                    message: 'Error al obtener la venta',
                    severity: 'error',
                    onClose: () => handleCloseSnackbar(true)
                });
                setOpenSnackbar(true);
            }
            finally {
                setLoading(false);
            }
        }

        loadData();
    }, [pk]);

    return (
        <>
            <SnackbarAlert
                open={openSnackbar}
                autoHideDuration={4000}
                onClose={snackbar.onClose}
                severity={snackbar.severity}
                message={snackbar.message}
            />
        </>
    )
}