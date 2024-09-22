import React, { useEffect, useState } from 'react';
import { API } from "../../App";
import {
    Box,
    Button,
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
    Card,
    CardContent,
    IconButton
} from "@mui/material";
import { Delete, Edit, Visibility } from '@mui/icons-material';
import { Link } from "react-router-dom";
import SnackbarAlert from "../shared/SnackbarAlert";
import fetchWithAuth from '../../utils/fetchWithAuth';
import { useLoading } from '../../utils/loadingContext';
import dayjs from 'dayjs';
import { useConfirm } from 'material-ui-confirm';


export default function ArticuloDetail({ pk }) {
    const [articulo, setArticulo] = useState({});
    const [movimientos, setMovimientos] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        autoHideDuration: 4000,
        onClose: () => handleCloseSnackbar(false)
    });
    const { withLoading } = useLoading();
    const confirm = useConfirm();

    const handleCloseSnackbar = (redirect, url = '/articulos') => {
        setOpenSnackbar(false);
        if (redirect) {
            window.location.href = url;
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            const url = `${API}/articulos/${pk}`;
            const res = await fetchWithAuth(url);
            const data = await res.json();
            if (!res.ok) {
                throw new Error(`Error al obtener el artículo: ${data['error']}`
                );
            }
            return data;
        }
        const loadData = async () => {
            try {
                const data = await fetchData();
                setArticulo(data['articulo']);
                setMovimientos(data['movimientos']);
            } catch (error) {
                setOpenSnackbar(true);
                setSnackbar({
                    message: error.message,
                    severity: 'error',
                    autoHideDuration: 6000,
                    onClose: () => handleCloseSnackbar(true)
                });
            }
        }

        withLoading(loadData);
    }, [pk, withLoading]);

    const handleDelete = async () => {
        confirm({
            title: 'Confirmar acción',
            description: '¿Está seguro que desea eliminar el artículo?',
            cancellationText: 'Cancelar',
            confirmationText: 'Confirmar'

        })
            .then(() => {
                withLoading(async () => {
                    const url = `${API}/articulos/${pk}/delete`;
                    fetchWithAuth(url, 'DELETE')
                        .then(response => {
                            if (!response.ok) {
                                return response.json().then(data => {
                                    throw new Error(data['error']);
                                });
                            }
                            return response.json();
                        })
                        .then(data => {
                            setSnackbar({
                                message: data['message'],
                                severity: 'success',
                                autoHideDuration: 4000,
                                onClose: () => handleCloseSnackbar(true)
                            });
                            setOpenSnackbar(true);
                        })
                        .catch((error) => {
                            setSnackbar({
                                message: `Error al eliminar el artículo: ${error.message}`,
                                severity: 'error',
                                autoHideDuration: 6000,
                                onClose: () => handleCloseSnackbar(false)
                            });
                            setOpenSnackbar(true);
                        });
                });
            })
            .catch((error) => {
                setSnackbar({
                    message: 'Acción cancelada',
                    severity: 'info',
                    autoHideDuration: 4000,
                    onClose: () => handleCloseSnackbar(false)
                });
                setOpenSnackbar(true);
            });
    }

    return (
        <>
            <Paper elevation={3} component="div" sx={{ mt: 2, padding: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" component="div" gutterBottom>
                        Artículo: {articulo.id}
                    </Typography>
                    <Box>
                        <Button
                            startIcon={<Edit />}
                            variant="contained"
                            color="primary"
                            component={Link}
                            to={`/articulos/form/${pk}`}
                            sx={{ ml: 2 }}
                        >
                            Editar
                        </Button>
                        <Button
                            startIcon={<Delete />}
                            variant="contained"
                            color="error"
                            onClick={handleDelete}
                            sx={{ ml: 2 }}
                        >
                            Eliminar
                        </Button>
                    </Box>
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" component="div" gutterBottom>
                                    Datos principales
                                </Typography>
                                <List>
                                    <ListItem>
                                        <ListItemText primary="Descripción" secondary={articulo.descripcion} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Línea de factura" secondary={articulo.linea_factura} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Stock actual" secondary={articulo.stock_actual} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Stock mínimo" secondary={articulo.stock_minimo} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Stock máximo" secondary={articulo.stock_maximo} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Observacion" secondary={articulo.observacion} />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" component="div" gutterBottom>
                                    Códigos
                                </Typography>
                                <List>
                                    <ListItem>
                                        <ListItemText primary="Código principal" secondary={articulo.codigo_principal} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Código secundario" secondary={articulo.codigo_secundario} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Código terciario" secondary={articulo.codigo_terciario} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Código cuaternario" secondary={articulo.codigo_cuaternario} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Código adicional" secondary={articulo.codigo_adicional} />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" component="div" gutterBottom>
                                    Datos facturación
                                </Typography>
                                <List>
                                    <ListItem>
                                        <ListItemText primary="Tipo de artículo" secondary={articulo.tipo_articulo && articulo.tipo_articulo.nombre} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Tipo de unidad" secondary={articulo.tipo_unidad && articulo.tipo_unidad.nombre} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Alícuota IVA" secondary={articulo.alicuota_iva && articulo.alicuota_iva.porcentaje + " %"} />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" component="div" gutterBottom>
                                    Últimos movimientos de stock asociados
                                </Typography>
                                <TableContainer component={Paper} sx={{ mt: 3 }}>
                                    <Table size='small'>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Fecha y hora</TableCell>
                                                <TableCell>Tipo de movimiento</TableCell>
                                                <TableCell>Origen</TableCell>
                                                <TableCell>Acciones</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {movimientos.map((movimiento, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{dayjs(movimiento.fecha_hora).format('DD/MM/YYYY HH:mm:ss')}</TableCell>
                                                    <TableCell>{movimiento.tipo_movimiento}</TableCell>
                                                    <TableCell>{movimiento.origen}</TableCell>
                                                    <TableCell>
                                                        <IconButton
                                                            component={Link}
                                                            to={`/movimientos-stock/${movimiento.id}`}
                                                            target='_blank'
                                                            aria-label="ver movimiento"
                                                        >
                                                            <Visibility />
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
                                        <ListItemText primary="Fecha y hora de creación"
                                            secondary={dayjs(articulo.created_at).format('DD/MM/YYYY HH:mm:ss')} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Fecha y hora de actualización"
                                            secondary={dayjs(articulo.updated_at).format('DD/MM/YYYY HH:mm:ss')} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Usuario de creación"
                                            secondary={articulo.created_by && articulo.created_by.username} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Usuario de actualización"
                                            secondary={articulo.updated_by && articulo.updated_by.username} />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Paper>
            <SnackbarAlert
                open={openSnackbar}
                onClose={snackbar.onClose}
                severity={snackbar.severity}
                message={snackbar.message}
                autoHideDuration={snackbar.autoHideDuration}
            />
        </>
    )
}