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
    Menu,
    MenuItem,
    Card,
    CardContent,
    Alert
} from "@mui/material";
import { Link } from "react-router-dom";
import SnackbarAlert from "../shared/SnackbarAlert";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import fetchWithAuth from '../../utils/fetchWithAuth';
import { useConfirm } from 'material-ui-confirm';
import { useLoading } from '../../utils/loadingContext';
import dayjs from 'dayjs';



const PaperSizeButton = ({ handlePrint }) => {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (size) => {
        setAnchorEl(null);
        if (size) {
            handlePrint(size);
        }
    };

    return (
        <>
            <Button
                variant="contained"
                color="primary"
                sx={{ ml: 2 }}
                onClick={handleClick}
                endIcon={<KeyboardArrowDownIcon />}
            >
                Imprimir
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => handleClose(null)}
            >
                <MenuItem onClick={() => handleClose('A4')}>A4</MenuItem>
                <MenuItem onClick={() => handleClose('Ticket')}>Ticket</MenuItem>
            </Menu>
        </>
    );
};


export default function VentaDetail({ pk }) {
    const [venta, setVenta] = useState({});
    const [renglones, setRenglones] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        autoHideDuration: 4000,
        onClose: () => handleCloseSnackbar(false)
    });
    const confirm = useConfirm();
    const { withLoading } = useLoading();

    const handleCloseSnackbar = (redirect, url = '/ventas') => {
        setOpenSnackbar(false);
        if (redirect) {
            window.location.href = url;
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            const url = `${API}/ventas/${pk}`;
            const res = await fetchWithAuth(url);
            if (!res.ok) {
                throw new Error('Error al obtener la venta');
            }
            return await res.json();
        }
        const loadData = async () => {
            try {
                const data = await fetchData();
                setVenta(data['venta']);
                setRenglones(data['renglones']);
            }
            catch (error) {
                setSnackbar({
                    message: 'Error al obtener la venta',
                    severity: 'error',
                    onClose: () => handleCloseSnackbar(true)
                });
                setOpenSnackbar(true);
            }
        }

        withLoading(loadData);
    }, [pk, withLoading]);

    const handlePrint = (size = 'A4') => {
        withLoading(async () => {
            const printUrl = `${API}/ventas/${pk}`;
            try {
                const response = await fetchWithAuth(printUrl, 'POST', { action: 'print', size });
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const printWindow = window.open(url, '_blank');

                printWindow.onload = () => {
                    printWindow.print();
                };
            } catch {
                setSnackbar({
                    message: 'Error al imprimir la venta',
                    severity: 'error',
                    onClose: () => handleCloseSnackbar(false)
                });
                setOpenSnackbar(true);
            }
        });
    };

    const handleAnular = async () => {
        confirm({
            title: 'Confirmar acción',
            description: '¿Está seguro que desea anular la venta? Los artículos vendidos se sumarán nuevamente al stock.',
            cancellationText: 'Cancelar',
            confirmationText: 'Anular',

        })
            .then(() => {
                withLoading(async () => {
                    const url = `${API}/ventas/${pk}`;
                    fetchWithAuth(url, 'POST', { action: 'anular' })
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
                                onClose: () => handleCloseSnackbar(true, `/ventas/${data['venta_id']}`)
                            });
                            setOpenSnackbar(true);
                        })
                        .catch((error) => {
                            setSnackbar({
                                message: `Error al anular la venta: ${error.message}`,
                                severity: 'error',
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
            {venta.estado === 'Anulado' && (
                <Alert severity="warning">Esta venta actualmente se encuentra anulada</Alert>
            )}
            {venta.estado === 'Orden' && (
                <Alert severity="info">
                    Esta venta actualmente se encuentra en estado de orden.
                    Para facturarla, debe ir a Editar en Ventas y guardarla.
                </Alert>
            )}
            <Paper elevation={3} component="div" sx={{ mt: 2, padding: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" component="div" gutterBottom>
                        Venta: {venta.id}
                    </Typography>

                    <Box>
                        {
                            (venta.estado === 'Facturado' || venta.estado === 'Ticket')
                            && venta.tipo_comprobante
                            && venta.tipo_comprobante['es_anulable']
                            && (
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={handleAnular}
                                >
                                    Anular
                                </Button>
                            )}
                        <Button
                            variant="contained"
                            color="primary"
                            component={Link}
                            to={`/ventas/form/${pk}`}
                            sx={{ ml: 2 }}
                        >
                            Editar
                        </Button>
                        {venta.estado !== 'Orden' && (
                            <PaperSizeButton handlePrint={handlePrint} />
                        )}
                    </Box>
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={10}>
                                        <Typography variant="h6" gutterBottom>
                                            Renglones de Venta
                                        </Typography>
                                        <TableContainer component={Paper} sx={{ mt: 3 }}>
                                            <Table size='small'>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Código de artículo</TableCell>
                                                        <TableCell>Descripción</TableCell>
                                                        <TableCell align='right'>Cantidad</TableCell>
                                                        <TableCell align='right'>Precio unitario</TableCell>
                                                        <TableCell align='right'>Subtotal</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {renglones.map((renglon, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell>{renglon.codigo_principal}</TableCell>
                                                            <TableCell>{renglon.descripcion}</TableCell>
                                                            <TableCell align='right'>{renglon.cantidad}</TableCell>
                                                            <TableCell align='right'>{renglon.precio_unidad
                                                                ? Number(renglon.precio_unidad).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
                                                                : 'N/A'}
                                                            </TableCell>
                                                            <TableCell align='right'>{renglon.subtotal
                                                                ? Number(renglon.subtotal).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
                                                                : 'N/A'}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        <Typography variant="h6" gutterBottom>
                                            Totales
                                        </Typography>
                                        <List sx={{ width: '100%' }}>
                                            <ListItem>
                                                <ListItemText primary="Gravado" secondary={venta.gravado
                                                    ? Number(venta.gravado).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
                                                    : 'N/A'}
                                                />
                                            </ListItem>
                                            <ListItem>
                                                <ListItemText primary="IVA" secondary={venta.total_iva
                                                    ? Number(venta.total_iva).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
                                                    : 'N/A'}
                                                />
                                            </ListItem>
                                            <ListItem>
                                                <ListItemText primary="Otros tributos" secondary={venta.total_tributos
                                                    ? Number(venta.total_tributos).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
                                                    : 'N/A'}
                                                />
                                            </ListItem>
                                            <ListItem>
                                                <ListItemText primary="Total" secondary={venta.total
                                                    ? Number(venta.total).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
                                                    : 'N/A'}
                                                />
                                            </ListItem>
                                        </List>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" component="div">
                                    Comprobante: {
                                        venta.tipo_comprobante && venta.tipo_comprobante['descripcion']
                                            ? venta.tipo_comprobante['descripcion']
                                            : 'No disponible'
                                    }
                                </Typography>
                                <List sx={{ width: '100%' }}>
                                    <ListItem>
                                        <ListItemText primary="Fecha y hora" secondary={dayjs(venta.fecha_hora).format('DD/MM/YYYY HH:mm:ss')} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Nro. de comprobante" secondary={venta.nro_comprobante} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Punto de venta" secondary={venta.punto_venta && venta.punto_venta['numero'] ? venta.punto_venta['numero'] : 'No disponible'} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Número" secondary={venta.numero} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="CAE"
                                            secondary={venta.cae ? venta.cae : 'No disponible'}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Vencimiento de CAE"

                                            secondary={venta.vencimiento_cae ? dayjs(venta.vencimiento_cae).format('DD/MM/YYYY') : 'No disponible'}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Estado" secondary={venta.estado} />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" component="div">
                                    Cliente: {
                                        venta.cliente && venta.cliente['razon_social']
                                            ? venta.cliente['razon_social']
                                            : 'No disponible'
                                    }
                                </Typography>
                                <List sx={{ width: '100%' }}>
                                    <ListItem>
                                        <ListItemText
                                            primary={venta.cliente && venta.cliente['tipo_documento'] ? venta.cliente['tipo_documento']['descripcion'] : 'No disponible'}
                                            secondary={venta.cliente && venta.cliente['nro_documento'] ? venta.cliente['nro_documento'] : 'No disponible'}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Tipo de responsable"
                                            secondary={venta.cliente && venta.cliente['tipo_responsable'] ? venta.cliente['tipo_responsable']['descripcion'] : 'No disponible'}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Domicilio"
                                            secondary={venta.cliente && venta.cliente['direccion'] ? venta.cliente['direccion'] : 'No disponible'}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Localidad"
                                            secondary={venta.cliente && venta.cliente['localidad'] ? venta.cliente['localidad'] : 'No disponible'}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Provincia"
                                            secondary={venta.cliente && venta.cliente['provincia'] ? venta.cliente['provincia']['nombre'] : 'No disponible'}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Código postal"
                                            secondary={venta.cliente && venta.cliente['codigo_postal'] ? venta.cliente['codigo_postal'] : 'No disponible'}
                                        />
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
    )
}