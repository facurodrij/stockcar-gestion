import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    Card,
    CardContent,
    Grid,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    List,
    ListItem,
    ListItemText,
    IconButton,
} from "@mui/material";
import Edit from '@mui/icons-material/Edit';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import SnackbarAlert from '../../../../../common/components/SnackbarAlert';
import fetchWithAuth from '../../../../../config/auth/fetchWithAuth';
import { useLoading } from '../../../../../common/contexts/LoadingContext';
import { API } from '../../../../../App';
import checkPermissions from '../../../../../config/auth/checkPermissions';
import PageTitle from '../../../../../common/components/PageTitle';


export default function MovimientoStockDetail({ permissions }) {
    const pk = useParams().pk
    const [movimiento, setMovimiento] = useState({});
    const [renglones, setRenglones] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        autoHideDuration: 4000,
        onClose: () => handleCloseSnackbar(false)
    });
    const { withLoading } = useLoading();

    const handleCloseSnackbar = (redirect, url = '/movimientos-stock') => {
        setOpenSnackbar(false);
        if (redirect) {
            window.location.href = url;
        }
    }

    useEffect(() => {
        checkPermissions(permissions);
    }, [permissions]);

    useEffect(() => {
        const fetchData = async () => {
            const url = `${API}/movimientos-stock/${pk}`;
            const res = await fetchWithAuth(url);
            if (!res.ok) {
                throw new Error('Error al obtener el movimiento de stock');
            }
            return await res.json();
        }
        const loadData = async () => {
            try {
                const data = await fetchData();
                setMovimiento(data['movimiento']);
                setRenglones(data['renglones']);
            }
            catch (error) {
                setSnackbar({
                    message: 'Error al obtener el movimiento de stock',
                    severity: 'error',
                    onClose: () => handleCloseSnackbar(true)
                });
                setOpenSnackbar(true);
            }
        }

        withLoading(loadData);
    }, [pk, withLoading]);

    return (
        <>
            <PageTitle heading="Detalle Movimiento de Stock" />
            <Paper elevation={3} component="div" sx={{ mt: 2, padding: 2 }}>
                <Typography variant="h5" component="div" gutterBottom>
                    Movimiento: {movimiento.id}
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" component="div" gutterBottom>
                                    Datos principales
                                </Typography>
                                <List>
                                    <ListItem>
                                        <ListItemText primary="Fecha y hora" secondary={dayjs(movimiento.fecha_hora).format('DD/MM/YYYY HH:mm:ss')} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Tipo de movimiento" secondary={movimiento.tipo_movimiento} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Origen" secondary={movimiento.origen} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Observacion" secondary={movimiento.observacion} />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" component="div" gutterBottom>
                                    Reglones de Artículos
                                </Typography>
                                <TableContainer component={Paper} sx={{ mt: 3 }}>
                                    <Table size='small'>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Código de artículo</TableCell>
                                                <TableCell>Cantidad</TableCell>
                                                <TableCell>Stock posterior</TableCell>
                                                <TableCell>Acciones</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {renglones.map((renglon, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{renglon.codigo_principal}</TableCell>
                                                    <TableCell>{renglon.cantidad}</TableCell>
                                                    <TableCell>{renglon.stock_posterior}</TableCell>
                                                    <TableCell>
                                                        <IconButton
                                                            component={Link}
                                                            to={`/articulos/form/${renglon.articulo_id}`}
                                                            target='_blank'
                                                            aria-label="editar artículo"
                                                        >
                                                            <Edit />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" component="div" gutterBottom>
                                    Datos de auditoría
                                </Typography>
                                <List>
                                    <ListItem>
                                        <ListItemText primary="Fecha y hora de creación" secondary={dayjs(movimiento.created_at).format('DD/MM/YYYY HH:mm:ss')} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Fecha y hora de actualización" secondary={dayjs(movimiento.updated_at).format('DD/MM/YYYY HH:mm:ss')} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Usuario de creación" secondary={movimiento.created_by && movimiento.created_by.username} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Usuario de actualización" secondary={movimiento.updated_by && movimiento.updated_by.username} />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Paper>
            <SnackbarAlert
                open={openSnackbar}
                autoHideDuration={snackbar.autoHideDuration}
                onClose={snackbar.onClose}
                severity={snackbar.severity}
                message={snackbar.message}
            />
        </>
    );
}