import React, { useCallback, useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField } from "@mui/material";
import { Add, Checklist, Refresh } from '@mui/icons-material';
import {
    DataGrid,
    GridToolbarColumnsButton,
    GridToolbarContainer,
} from '@mui/x-data-grid';
import { esES } from "@mui/x-data-grid/locales";
import { API } from "../../App";
import fetchWithAuth from '../../config/auth/fetchWithAuth';
import checkPermissions from '../../config/auth/checkPermissions';


const SelectorToolbar = ({ onSearch, showSelected, setShowSelected }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const allowCreate = checkPermissions(['articulo.create'], false);

    const handleSearch = (event) => {
        if (event.key === 'Enter' || event.type === 'blur') {
            if (searchQuery.length >= 3) {
                onSearch(searchQuery);
            }
        }
    };

    return (
        <GridToolbarContainer sx={{ borderBottom: 1, borderColor: 'divider', pb: .5 }}>
            <TextField
                label="Buscar artículo..."
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                onBlur={handleSearch}
                sx={{ width: 350 }}
            />
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
    const [articuloCache, setArticuloCache] = useState({});
    const [lastSearchQuery, setLastSearchQuery] = useState('');
    const [showSelected, setShowSelected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const columns = [
        { field: 'stock_actual', headerName: 'Stock', flex: 0.5 },
        { field: 'descripcion', headerName: 'Descripción', flex: 2 },
        { field: 'codigo_principal', headerName: 'Código principal', flex: 1 },
        { field: 'codigo_secundario', headerName: 'Código secundario', flex: 1 },
        { field: 'codigo_terciario', headerName: 'Código terciario', flex: 0.75 },
        { field: 'codigo_cuaternario', headerName: 'Código cuaternario', flex: 0.75 },
        { field: 'codigo_adicional', headerName: 'Código adicional', flex: 0.75 },
    ];

    const selectedArticuloRows = selectedArticulo.map((id) => {
        const exist = items.find((item) => item.articulo_id === id);
        return articuloCache[id] || (exist && {
            id: exist.articulo_id,
            stock_actual: exist.stock_actual,
            descripcion: exist.descripcion,
            codigo_principal: exist.codigo_principal,
            codigo_secundario: exist.codigo_secundario,
            codigo_terciario: exist.codigo_terciario,
            codigo_cuaternario: exist.codigo_cuaternario,
            codigo_adicional: exist.codigo_adicional,
            linea_factura: exist.descripcion,
        });
    }).filter(Boolean);

    const filteredArticulo = showSelected ? selectedArticuloRows : listArticulo;

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

    const fetchData = useCallback(async (query) => {
        const search = query.trim();
        if (!open || search.length < 3) {
            setListArticulo([]);
            setHasSearched(false);
            setLastSearchQuery(search);
            return;
        }

        setLastSearchQuery(search);
        setHasSearched(true);
        setLoading(true);
        try {
            const url = `${API}/articulos/selector?query=${encodeURIComponent(search)}&limit=50`;
            const res = await fetchWithAuth(url);
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data['error']);
            }
            const articulos = data['articulos'] || data;
            setListArticulo(articulos);
            setArticuloCache((prev) => {
                const next = { ...prev };
                articulos.forEach((articulo) => {
                    next[articulo.id] = articulo;
                });
                return next;
            });
        } catch (e) {
            console.error(e);
            alert(e.message);
        } finally {
            setLoading(false);
        }
    }, [open]);

    useEffect(() => {
        setArticuloCache((prev) => {
            const nextCache = { ...prev };
            items.forEach((item) => {
                if (!nextCache[item.articulo_id]) {
                    nextCache[item.articulo_id] = {
                        id: item.articulo_id,
                        stock_actual: item.stock_actual,
                        descripcion: item.descripcion,
                        codigo_principal: item.codigo_principal,
                        codigo_secundario: item.codigo_secundario,
                        codigo_terciario: item.codigo_terciario,
                        codigo_cuaternario: item.codigo_cuaternario,
                        codigo_adicional: item.codigo_adicional,
                        linea_factura: item.descripcion,
                    };
                }
            });
            return nextCache;
        });
    }, [items]);

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
                onClick={() => fetchData(lastSearchQuery)}
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
                        keepNonExistentRowsSelected
                        loading={loading}
                        onRowSelectionModelChange={(newSelection) => {
                            const visibleIds = rows.map((row) => row.id);
                            const hiddenSelection = selectedArticulo.filter((id) => !visibleIds.includes(id));
                            const nextSelection = [...new Set([...hiddenSelection, ...newSelection])];
                            const nextSelectionArticulo = nextSelection.map((id) => {
                                const exist = items.find((item) => item.articulo_id === id);
                                return articuloCache[id] || (exist && {
                                    id: exist.articulo_id,
                                    descripcion: exist.descripcion,
                                    codigo_principal: exist.codigo_principal,
                                    linea_factura: exist.descripcion,
                                });
                            });
                            const newItems = nextSelectionArticulo.map((row) => {
                                if (!row) {
                                    return null;
                                }
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
                            }).filter(Boolean);
                            setItems(newItems);
                            setSelectedArticulo(nextSelection);
                        }}
                        rowHeight={30}
                        rowSelectionModel={selectedArticulo}
                        rows={rows}
                        slots={{
                            toolbar: (props) => <SelectorToolbar
                                {...props}
                                onSearch={fetchData}
                                showSelected={showSelected}
                                setShowSelected={setShowSelected}
                            />
                        }}
                        localeText={{
                            ...esES.components.MuiDataGrid.defaultProps.localeText,
                            noRowsLabel: lastSearchQuery.trim().length < 3
                                ? 'Buscá al menos 3 caracteres para ver artículos'
                                : hasSearched
                                    ? 'No se encontraron artículos'
                                    : 'Buscá al menos 3 caracteres para ver artículos',
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
