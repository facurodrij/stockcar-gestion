import React, {useEffect, useState} from 'react';
import {Button, Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material";
import {
    DataGrid,
    GridToolbarColumnsButton,
    GridToolbarContainer, GridToolbarDensitySelector, GridToolbarExport,
    GridToolbarFilterButton,
    GridToolbarQuickFilter
} from '@mui/x-data-grid';
import {API} from "../../App";
import {esES} from "@mui/x-data-grid/locales";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import {Link} from "react-router-dom";


const ArticuloSelectorDialog = ({open, onClose, selectedArticulo, setSelectedArticulo, renglones, setRenglones}) => {
    const [listArticulo, setListArticulo] = useState([]);
    const [showSelected, setShowSelected] = useState(false);

    const filteredArticulo = showSelected
        ? listArticulo.filter((item) => selectedArticulo.includes(item.id))
        : listArticulo;

    const CustomToolbar = () => {
        return (
            <GridToolbarContainer>
                <GridToolbarQuickFilter size={'small'}/>
                <GridToolbarColumnsButton/>
                <GridToolbarFilterButton/>
                <Box sx={{flexGrow: 1}}/>
                <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                        setShowSelected(!showSelected);
                    }}
                >
                    {showSelected ? 'Ver Todos' : 'Ver Seleccionados'}
                </Button>
            </GridToolbarContainer>
        );
    }

    const fetchData = async () => {
        const res = await fetch(`${API}/articulos`);
        return await res.json();
    }

    useEffect(() => {
        fetchData().then(data => {
            setListArticulo(data['articulos']);
        });
    }, []);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth={true}
            maxWidth={'md'}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">Seleccionar Artículos</DialogTitle>
            <DialogContent dividers>
                <div style={{height: 400, width: '100%'}}>
                    <DataGrid
                        columns={[
                            {field: 'id', headerName: 'ID', width: 75},
                            {field: 'descripcion', headerName: 'Descripción', width: 500},
                            {field: 'codigo_barra', headerName: 'Código de Barras', width: 200},
                            {field: 'codigo_fabricante', headerName: 'Código de Fabricante', width: 200},
                            {field: 'codigo_proveedor', headerName: 'Código de Proveedor', width: 200},
                            {field: 'codigo_interno', headerName: 'Código Interno', width: 200}
                        ]}
                        rows={filteredArticulo.map((item) => {
                            return {
                                id: item.id,
                                descripcion: item.descripcion,
                                codigo_barra: item.codigo_barra,
                                codigo_fabricante: item.codigo_fabricante,
                                codigo_proveedor: item.codigo_proveedor,
                                codigo_interno: item.codigo_interno
                            }
                        })}
                        rowHeight={30}
                        pageSize={5}
                        rowsPerPageOptions={[5, 10, 20]}
                        checkboxSelection
                        onRowSelectionModelChange={(newSelection) => {
                            const rowSelectionArticulo = newSelection.map((row) => {
                                return listArticulo.find((item) => item.id === row);
                            });
                            const newRenglones = rowSelectionArticulo.map((row) => {
                                const exist = renglones.find((r) => r.articulo_id === row.id);
                                return exist || {
                                    articulo_id: row.id,
                                    descripcion: row.descripcion,
                                    cantidad: 1,
                                    precio_unidad: 0,
                                    subtotal: 0,
                                };
                            });
                            setRenglones(newRenglones);
                            setSelectedArticulo(newSelection);
                        }}
                        rowSelectionModel={selectedArticulo}
                        slots={{toolbar: CustomToolbar}}
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