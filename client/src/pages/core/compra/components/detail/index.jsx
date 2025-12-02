import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
import { Block, Edit, Print, KeyboardArrowDown, Delete, Add } from '@mui/icons-material';
import { useConfirm } from 'material-ui-confirm';
import PageTitle from '../../../../../common/components/PageTitle';
import checkPermissions from '../../../../../config/auth/checkPermissions';
import { API } from '../../../../../App';
import SnackbarAlert from '../../../../../common/components/SnackbarAlert';
import fetchWithAuth from '../../../../../config/auth/fetchWithAuth';
import { useLoading } from '../../../../../common/contexts/LoadingContext';
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
                startIcon={<Print />}
                endIcon={<KeyboardArrowDown />}
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


export default function CompraDetail({ permissions }) {
    const pk = useParams().pk;
    const [compra, setCompra] = useState({});
    const [items, setItems] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        autoHideDuration: 4000,
        onClose: () => handleCloseSnackbar(false)
    });
    const confirm = useConfirm();
    const { withLoading } = useLoading();
    const navigate = useNavigate();

    const handleCloseSnackbar = (redirect, url = '/compras') => {
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
            const url = `${API}/compras/${pk}`;
            const res = await fetchWithAuth(url);
            const data = await res.json();
            if (!res.ok) {
                throw new Error(`Error al obtener la compra: ${data['error']}`);
            }
            return data;
        }
        const loadData = async () => {
            try {
                const data = await fetchData();
                setCompra(data['compra']);
                setItems(data['compra']['items']);
            }
            catch (error) {
                setSnackbar({
                    message: error.message,
                    severity: 'error',
                    autoHideDuration: 6000,
                    onClose: () => handleCloseSnackbar(true)
                });
                setOpenSnackbar(true);
            }
        }

        withLoading(loadData);
    }, [pk, withLoading]);

    const handlePrint = (size = 'A4') => {
        withLoading(async () => {
            const printUrl = `${API}/compras/${pk}`;
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
                    message: 'Error al imprimir la compra',
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
            description: '¿Está seguro que desea anular la compra? Los artículos comprados se descontarán nuevamente del stock.',
            cancellationText: 'Cancelar',
            confirmationText: 'Anular',

        })
            .then(() => {
                withLoading(async () => {
                    const url = `${API}/compras/${pk}`;
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
                                onClose: () => handleCloseSnackbar(true, `/compras/${data['compra_id']}`)
                            });
                            setOpenSnackbar(true);
                        })
                        .catch((error) => {
                            setSnackbar({
                                message: `Error al anular la compra: ${error.message}`,
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

    const handleDelete = async () => {
        confirm({
            title: 'Confirmar acción',
            description: '¿Está seguro que desea eliminar la orden de compra?',
            cancellationText: 'Cancelar',
            confirmationText: 'Confirmar'
        })
            .then(() => {
                withLoading(async () => {
                    const url = `${API}/compras-orden/${pk}/delete`;
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
                                message: `Error al eliminar la orden de compra: ${error.message}`,
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

    const handleNewPurchaseWithItems = () => {
        navigate(`/compras/form?itemsByCompraId=${pk}`);
    };

    return (
        <>
            <PageTitle heading="Detalle de Compra" />
            {compra.estado === 'anulado' && (
                <Alert severity="warning">Esta compra actualmente se encuentra anulada</Alert>
            )}
            {compra.estado === 'orden' && (
                <Alert severity="info">
                    Esta compra actualmente se encuentra en estado de orden.
                    Para facturarla, debe ir a Editar en Compras y guardarla.
                </Alert>
            )}
            <Paper elevation={3} component="div" sx={{ mt: 2, padding: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" component="div" gutterBottom>
                        Compra: {compra.id}
                    </Typography>

                    <Box>
                        {
                            (compra.estado === 'facturado' || compra.estado === 'ticket')
                            && compra.tipo_comprobante
                            && compra.tipo_comprobante['es_anulable']
                            && (
                                <Button
                                    startIcon={<Block />}
                                    variant="contained"
                                    color="error"
                                    onClick={handleAnular}
                                >
                                    Anular
                                </Button>
                            )}
                        <Button
                            startIcon={<Edit />}
                            variant="contained"
                            color="primary"
                            component={Link}
                            to={`/compras/form/${pk}`}
                            sx={{ ml: 2 }}
                        >
                            Editar
                        </Button>
                        {compra.estado !== 'orden' && (
                            <PaperSizeButton handlePrint={handlePrint} />
                        )}
                        {compra.estado === 'orden' && (
                            <Button
                                startIcon={<Delete />}
                                variant="contained"
                                color="error"
                                onClick={handleDelete}
                                sx={{ ml: 2 }}
                            >
                                Eliminar
                            </Button>
                        )}
                    </Box>
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={10}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="h6" gutterBottom>
                                                Items
                                            </Typography>
                                            <Button
                                                startIcon={<Add />}
                                                variant="contained"
                                                color="success"
                                                onClick={handleNewPurchaseWithItems}
                                            >
                                                Nueva Compra manteniendo Items
                                            </Button>
                                        </Box>
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
                                                    {items.map((item, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell>{item.codigo_principal}</TableCell>
                                                            <TableCell>{item.descripcion}</TableCell>
                                                            <TableCell align='right'>{item.cantidad}</TableCell>
                                                            <TableCell align='right'>{item.precio_unidad
                                                                ? Number(item.precio_unidad).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
                                                                : 'N/A'}
                                                            </TableCell>
                                                            <TableCell align='right'>{item.subtotal
                                                                ? Number(item.subtotal).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
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
                                                <ListItemText primary="Gravado" secondary={compra.gravado
                                                    ? Number(compra.gravado).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
                                                    : 'N/A'}
                                                />
                                            </ListItem>
                                            <ListItem>
                                                <ListItemText primary="IVA" secondary={compra.total_iva
                                                    ? Number(compra.total_iva).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
                                                    : 'N/A'}
                                                />
                                            </ListItem>
                                            <ListItem>
                                                <ListItemText primary="Total" secondary={compra.total
                                                    ? Number(compra.total).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
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
                                        compra.tipo_comprobante && compra.tipo_comprobante['descripcion']
                                            ? compra.tipo_comprobante['descripcion']
                                            : 'No disponible'
                                    }
                                </Typography>
                                <List sx={{ width: '100%' }}>
                                    <ListItem>
                                        <ListItemText primary="Fecha y hora" secondary={dayjs(compra.fecha_hora).format('DD/MM/YYYY HH:mm:ss')} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Nro. de comprobante" secondary={compra.nro_comprobante} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Punto de venta" secondary={compra.punto_venta && compra.punto_venta['numero'] ? compra.punto_venta['numero'] : 'No disponible'} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Número" secondary={compra.numero} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Estado" secondary={compra.estado} />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" component="div">
                                    Proveedor: {
                                        compra.proveedor && compra.proveedor['razon_social']
                                            ? compra.proveedor['razon_social']
                                            : 'No disponible'
                                    }
                                </Typography>
                                <List sx={{ width: '100%' }}>
                                    <ListItem>
                                        <ListItemText
                                            primary={compra.proveedor && compra.proveedor['tipo_documento'] ? compra.proveedor['tipo_documento']['descripcion'] : 'No disponible'}
                                            secondary={compra.proveedor && compra.proveedor['nro_documento'] ? compra.proveedor['nro_documento'] : 'No disponible'}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Tipo de responsable"
                                            secondary={compra.proveedor && compra.proveedor['tipo_responsable'] ? compra.proveedor['tipo_responsable']['descripcion'] : 'No disponible'}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Domicilio"
                                            secondary={compra.proveedor && compra.proveedor['direccion'] ? compra.proveedor['direccion'] : 'No disponible'}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Localidad"
                                            secondary={compra.proveedor && compra.proveedor['localidad'] ? compra.proveedor['localidad'] : 'No disponible'}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Provincia"
                                            secondary={compra.proveedor && compra.proveedor['provincia'] ? compra.proveedor['provincia']['nombre'] : 'No disponible'}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Código postal"
                                            secondary={compra.proveedor && compra.proveedor['codigo_postal'] ? compra.proveedor['codigo_postal'] : 'No disponible'}
                                        />
                                    </ListItem>
                                </List>
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
                                            secondary={dayjs(compra.created_at).format('DD/MM/YYYY HH:mm:ss')} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Fecha y hora de actualización"
                                            secondary={dayjs(compra.updated_at).format('DD/MM/YYYY HH:mm:ss')} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Usuario de creación"
                                            secondary={compra.created_by_user && compra.created_by_user.username} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Usuario de actualización"
                                            secondary={compra.updated_by_user && compra.updated_by_user.username} />
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
