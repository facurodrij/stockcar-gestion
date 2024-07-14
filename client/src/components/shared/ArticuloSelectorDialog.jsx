import React, {useEffect, useState} from 'react';
import {Button, Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material";
import {DataGrid} from '@mui/x-data-grid';
import {API} from "../../App";

const ArticuloSelectorDialog = ({open, onClose, selectedArticulo, setSelectedArticulo, renglones, setRenglones}) => {
    const [listArticulo, setListArticulo] = useState([]);

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
                        ]}
                        rows={listArticulo.map(item => {
                            return {
                                id: item.id,
                                descripcion: item.descripcion,
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