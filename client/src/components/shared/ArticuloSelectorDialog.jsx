import React, { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import {
    DataGrid,
    GridToolbarColumnsButton,
    GridToolbarContainer,
    GridToolbarFilterButton,
    GridToolbarQuickFilter
} from '@mui/x-data-grid';
import { API } from "../../App";
import { esES } from "@mui/x-data-grid/locales";
import Box from "@mui/material/Box";
import IconButton from '@mui/material/IconButton';
import { Link } from "react-router-dom";
import AddIcon from '@mui/icons-material/Add';
import ChecklistIcon from '@mui/icons-material/Checklist';
import RefreshIcon from '@mui/icons-material/Refresh';
import fetchWithAuth from '../../utils/fetchWithAuth';


const SelectorToolbar = ({ show_btn_add, txt_btn_add, url_btn_add, showSelected, setShowSelected }) => {
    return (
        <GridToolbarContainer sx={{ borderBottom: 1, borderColor: 'divider', pb: .5 }}>
            <GridToolbarQuickFilter size={'small'} />
            <GridToolbarColumnsButton />
            <GridToolbarFilterButton />
            <Button
                startIcon={<ChecklistIcon />}
                size="small"
                onClick={() => {
                    setShowSelected(!showSelected);
                }}
            >
                {showSelected ? 'Ver Todos' : 'Ver Seleccionados'}
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            {show_btn_add && (
                <Button
                    startIcon={<AddIcon />}
                    component={Link}
                    to={url_btn_add}
                    target='_blank'
                    size="small"
                    variant="contained"
                    color="success"
                >
                    {txt_btn_add}
                </Button>
            )}
        </GridToolbarContainer>
    );
}


const ArticuloSelectorDialog = ({ open, onClose, selectedArticulo, setSelectedArticulo, renglones, setRenglones, allowCreate }) => {
    const [listArticulo, setListArticulo] = useState([]);
    const [showSelected, setShowSelected] = useState(false);
    const [loading, setLoading] = useState(false);

    const filteredArticulo = showSelected
        ? listArticulo.filter((item) => selectedArticulo.includes(item.id))
        : listArticulo;

    const fetchData = async () => {
        setLoading(true);
        const url = `${API}/articulos`;
        try {
            const res = await fetchWithAuth(url);
            const data = await res.json();
            if (!res.ok) {
                throw new Error(`${res.status} (${res.statusText})`);
            }
            setListArticulo(data['articulos']);
        } catch (error) {
            console.error(error);
            alert('Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    }

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
                <RefreshIcon />
            </IconButton>
            <DialogContent dividers>
                <div style={{ height: 400, width: '100%' }}>
                    <DataGrid
                        loading={loading}
                        columns={[
                            { field: 'stock_actual', headerName: 'Stock', flex: 0.5 },
                            { field: 'descripcion', headerName: 'Descripción', flex: 2 },
                            { field: 'codigo_principal', headerName: 'Código principal', flex: 1 },
                            { field: 'codigo_secundario', headerName: 'Código secundario', flex: 1 },
                            { field: 'codigo_terciario', headerName: 'Código terciario', flex: 0.75 },
                            { field: 'codigo_cuaternario', headerName: 'Código cuaternario', flex: 0.75 },
                            { field: 'codigo_adicional', headerName: 'Código adicional', flex: 0.75 },
                        ]}
                        rows={filteredArticulo.map((item) => {
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
                        })}
                        rowHeight={30}
                        pageSize={5}
                        rowsPerPageOptions={[5, 10, 20]}
                        checkboxSelection
                        disableRowSelectionOnClick
                        onRowSelectionModelChange={(newSelection) => {
                            if (listArticulo.length === 0) {
                                // Importante condicion para que no resetee los renglones
                                // mientras se carga la lista de articulos
                                return;
                            }
                            const rowSelectionArticulo = newSelection.map((row) => {
                                return listArticulo.find((item) => item.id === row);
                            });
                            const newRenglones = rowSelectionArticulo.map((row) => {
                                const exist = renglones.find((r) => r.articulo_id === row.id);
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
                            setRenglones(newRenglones);
                            setSelectedArticulo(newSelection);
                        }}
                        rowSelectionModel={selectedArticulo}
                        slots={{
                            toolbar: (props) => <SelectorToolbar
                                {...props}
                                show_btn_add={allowCreate}
                                txt_btn_add="Nuevo Artículo"
                                url_btn_add="/articulos/form"
                                showSelected={showSelected}
                                setShowSelected={setShowSelected}
                            />
                        }}
                        localeText={esES.components.MuiDataGrid.defaultProps.localeText}
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