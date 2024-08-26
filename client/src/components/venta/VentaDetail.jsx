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
    MenuItem
} from "@mui/material";
import { Link } from "react-router-dom";
import SnackbarAlert from "../shared/SnackbarAlert";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import fetchWithAuth from '../../utils/fetchWithAuth';



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
            finally {
                setLoading(false);
            }
        }
        loadData();
    }, [pk]);

    const handlePrint = (size = 'A4') => {
        const url = `${API}/ventas/${pk}`;
        fetchWithAuth(url, 'POST', { size: size })
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            })
            .catch(() => {
                setSnackbar({
                    message: 'Error al imprimir la venta',
                    severity: 'error',
                    onClose: () => handleCloseSnackbar(false)
                });
                setOpenSnackbar(true);
            });
    }

    return (
        <>
            <Paper elevation={3} component="div" sx={{ mt: 2, padding: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" component="div" gutterBottom>
                        Venta: {venta.id}
                    </Typography>
                    <Box>
                        <Button
                            variant="contained"
                            color="primary"
                            component={Link}
                            to={`/ventas/form/${pk}`}
                        >
                            Editar
                        </Button>
                        <PaperSizeButton handlePrint={handlePrint} />
                    </Box>
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Paper elevation={1} component="div" sx={{ mt: 2, paddingTop: 2 }}>
                            <Typography sx={{ ml: 2 }} variant="h6" component="div">
                                Comprobante: {
                                    venta.tipo_comprobante && venta.tipo_comprobante['descripcion']
                                        ? venta.tipo_comprobante['descripcion']
                                        : 'Descripción no disponible'
                                }
                            </Typography>
                            <List sx={{ width: '100%' }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <ListItem>
                                            <ListItemText primary="Fecha" secondary={venta.fecha_hora} />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText primary="Punto de venta" secondary={venta.punto_venta && venta.punto_venta['numero'] ? venta.punto_venta['numero'] : 'Punto de venta no disponible'} />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText primary="Número" secondary={venta.numero} />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText primary="Estado" secondary={venta.estado} />
                                        </ListItem>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <ListItem>
                                            <ListItemText primary="Nro. de comprobante" secondary={venta.nro_comprobante} />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText primary="CAE" secondary={venta.cae} />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText primary="Vencimiento de CAE" secondary={venta.vencimiento_cae} />
                                        </ListItem>
                                    </Grid>
                                </Grid>
                            </List>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={1} component="div" sx={{ mt: 2, paddingTop: 2 }}>
                            <Typography sx={{ ml: 2 }} variant="h6" component="div">
                                Cliente: {
                                    venta.cliente && venta.cliente['razon_social']
                                        ? venta.cliente['razon_social']
                                        : 'Nombre no disponible'
                                }
                            </Typography>
                            <List sx={{ width: '100%' }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <ListItem>
                                            <ListItemText
                                                primary={venta.cliente && venta.cliente['tipo_documento'] ? venta.cliente['tipo_documento']['descripcion'] : 'Tipo de documento no disponible'}
                                                secondary={venta.cliente && venta.cliente['nro_documento'] ? venta.cliente['nro_documento'] : 'Nro. de documento no disponible'}
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText
                                                primary="Tipo de responsable"
                                                secondary={venta.cliente && venta.cliente['tipo_responsable'] ? venta.cliente['tipo_responsable']['descripcion'] : 'Condición de IVA no disponible'}
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText
                                                primary="Domicilio"
                                                secondary={venta.cliente && venta.cliente['direccion'] ? venta.cliente['direccion'] : 'Domicilio no disponible'}
                                            />
                                        </ListItem>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <ListItem>
                                            <ListItemText
                                                primary="Localidad"
                                                secondary={venta.cliente && venta.cliente['localidad'] ? venta.cliente['localidad'] : 'Localidad no disponible'}
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText
                                                primary="Provincia"
                                                secondary={venta.cliente && venta.cliente['provincia'] ? venta.cliente['provincia']['nombre'] : 'Provincia no disponible'}
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText
                                                primary="Código postal"
                                                secondary={venta.cliente && venta.cliente['codigo_postal'] ? venta.cliente['codigo_postal'] : 'Código postal no disponible'}
                                            />
                                        </ListItem>
                                    </Grid>
                                </Grid>
                            </List>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={10}>
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Renglones de Venta</Typography>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Descripción</TableCell>
                                        <TableCell>Cantidad</TableCell>
                                        <TableCell>Precio unitario</TableCell>
                                        <TableCell>Subtotal</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {renglones.map((renglon, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{renglon.descripcion}</TableCell>
                                            <TableCell>{renglon.cantidad}</TableCell>
                                            <TableCell>{renglon.precio_unidad}</TableCell>
                                            <TableCell>{renglon.subtotal}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Totales</Typography>
                        <List sx={{ width: '100%' }}>
                            <ListItem>
                                <ListItemText primary="Subtotal" secondary={venta.subtotal} />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="IVA" secondary={venta.iva} />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Total" secondary={venta.total} />
                            </ListItem>
                        </List>
                    </Grid>
                </Grid>
            </Paper>
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