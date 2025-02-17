import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from "@mui/material";
import { Add, Checklist, Refresh } from '@mui/icons-material';
import {
    DataGrid,
    GridToolbarColumnsButton,
    GridToolbarContainer,
    GridToolbarQuickFilter
} from '@mui/x-data-grid';
import { esES } from "@mui/x-data-grid/locales";
import { API } from "../../App";
import fetchWithAuth from '../../utils/fetchWithAuth';
import { checkPermissions } from '../../utils/checkAuth';


const SelectorToolbar = ({ showSelected, setShowSelected }) => {
    const allowCreate = checkPermissions(['articulo.create']);

    return (
        <GridToolbarContainer sx={{ borderBottom: 1, borderColor: 'divider', pb: .5 }}>
            <GridToolbarQuickFilter size={'small'} />
            <GridToolbarColumnsButton />
            <Button
                startIcon={<Checklist />}
                size="small"
                onClick={() => {
                    setShowSelected(!showSelected);
                }}
            >
                {showSelected ? 'Ver Todos' : 'Ver Seleccionados'}
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            {allowCreate && (
                <Button
                    startIcon={<Add />}
                    component={Link}
                    to="/articulos/form"
                    target='_blank'
                    size="small"
                    variant="contained"
                    color="success"
                >
                    Nuevo Artículo
                </Button>
            )}
        </GridToolbarContainer>
    );
}


const ArticuloSelectorDialog = ({ open, onClose, selectedArticulo, setSelectedArticulo, items, setItems }) => {
    const [listArticulo, setListArticulo] = useState([]);
    const [showSelected, setShowSelected] = useState(false);
    const [loading, setLoading] = useState(false);

    const columns = [
        { field: 'stock_actual', headerName: 'Stock', flex: 0.5 },
        { field: 'descripcion', headerName: 'Descripción', flex: 2 },
        { field: 'codigo_principal', headerName: 'Código principal', flex: 1 },
        { field: 'codigo_secundario', headerName: 'Código secundario', flex: 1 },
        { field: 'codigo_terciario', headerName: 'Código terciario', flex: 0.75 },
        { field: 'codigo_cuaternario', headerName: 'Código cuaternario', flex: 0.75 },
        { field: 'codigo_adicional', headerName: 'Código adicional', flex: 0.75 },
    ];

    const filteredArticulo = showSelected
        ? listArticulo.filter((item) => selectedArticulo.includes(item.id))
        : listArticulo;

    const rows = filteredArticulo.map((item) => {
        return {
            id: item.id,
            stock_actual: item.stock_actual,
            descripcion: item.descripcion,
            codigo_principal: item.codigo_principal,
            codigo_secundario: item.codigo_secundario,
            codigo_terciario: item.codigo_terciario,
            codigo_cuaternario: item.codigo_cuaternario,
            codigo_adicional: item.codigo_adicional,
            linea_factura: item.linea_factura,
        }
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const url = `${API}/articulos/selector`;
            const res = await fetchWithAuth(url);
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data['error']);
            }
            setListArticulo(data);
        } catch (e) {
            console.error(e);
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth={true}
            maxWidth={'xl'}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">Seleccionar Artículos</DialogTitle>
            <IconButton
                aria-label="reload"
                onClick={() => fetchData()}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                }}
            >
                <Refresh />
            </IconButton>
            <DialogContent dividers>
                <div style={{ height: 400, width: '100%' }}>
                    <DataGrid
                        checkboxSelection
                        columns={columns}
                        disableRowSelectionOnClick
                        hideFooter
                        loading={loading}
                        localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                        onRowSelectionModelChange={(newSelection) => {
                            if (listArticulo.length === 0) {
                                // Importante condicion para que no resetee los items
                                // mientras se carga la lista de articulos
                                return;
                            }
                            const rowSelectionArticulo = newSelection.map((row) => {
                                return listArticulo.find((item) => item.id === row);
                            });
                            const newItems = rowSelectionArticulo.map((row) => {
                                const exist = items.find((r) => r.articulo_id === row.id);
                                return exist || {
                                    articulo_id: row.id,
                                    descripcion: row.linea_factura,
                                    codigo_principal: row.codigo_principal,
                                    cantidad: 1,
                                    precio_unidad: 0,
                                    alicuota_iva: row.alicuota_iva.porcentaje,
                                    subtotal_iva: 0,
                                    subtotal_gravado: 0,
                                    subtotal: 0,
                                };
                            });
                            setItems(newItems);
                            setSelectedArticulo(newSelection);
                        }}
                        rowHeight={30}
                        rowSelectionModel={selectedArticulo}
                        rows={rows}
                        slots={{
                            toolbar: (props) => <SelectorToolbar
                                {...props}
                                showSelected={showSelected}
                                setShowSelected={setShowSelected}
                            />
                        }}
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    color="primary"
                    onClick={onClose}
                >
                    Aceptar
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ArticuloSelectorDialog;