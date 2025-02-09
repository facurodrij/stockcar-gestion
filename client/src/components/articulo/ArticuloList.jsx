import React, { useCallback, useState } from 'react';
import { GridToolbarContainer, GridToolbarColumnsButton } from '@mui/x-data-grid';
import { Box, Button, TextField } from '@mui/material';
import { Add } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import { Delete, Edit, Visibility } from '@mui/icons-material';
import { useConfirm } from 'material-ui-confirm';
import fetchWithAuth from '../../utils/fetchWithAuth';
import SnackbarAlert from '../shared/SnackbarAlert';

const ArticuloListToolbar = ({ show_btn_add, txt_btn_add, url_btn_add, onSearch }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (event) => {
        if (event.key === 'Enter' || event.type === 'blur') {
            if (searchQuery.length >= 3) {
                // Si hay un + en la búsqueda, se reemplaza por %2B
                const searchQueryFixed = searchQuery.replace('+', '%2B');
                onSearch(searchQueryFixed);
            }
        }
    };

    return (
        <GridToolbarContainer sx={{ borderBottom: 1, borderColor: 'divider', pb: .5 }}>
            <TextField
                label="Buscar..."
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                onBlur={handleSearch}
                sx={{ width: 350 }}
            />
            <GridToolbarColumnsButton />
            <Box sx={{ flexGrow: 1 }} />
            {show_btn_add && (
                <Button
                    startIcon={<Add />}
                    component={Link}
                    to={url_btn_add}
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

export default function ArticuloList({
    apiUrl,
    editUrl,
    detailUrl,
    allowView,
    allowCreate,
    allowUpdate,
    allowDelete
}) {
    const [list, setList] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        autoHideDuration: 4000,
        onClose: () => handleCloseSnackbar(false)
    });
    const [loading, setLoading] = useState(false);

    const confirm = useConfirm();

    const handleCloseSnackbar = useCallback(() => {
        setOpenSnackbar(false);
    }, []);

    const columns = [
        { field: 'stock_actual', headerName: 'Stock', flex: 0.5 },
        { field: 'descripcion', headerName: 'Descripción', flex: 2 },
        { field: 'codigo_principal', headerName: 'Código principal', flex: 1 },
        { field: 'codigo_secundario', headerName: 'Código secundario', flex: 1 },
        { field: 'codigo_terciario', headerName: 'Código terciario', flex: 0.75 },
        { field: 'codigo_cuaternario', headerName: 'Código cuaternario', flex: 0.75 },
        { field: 'codigo_adicional', headerName: 'Código adicional', flex: 0.75 },
    ];

    const mapDataToRows = (data) => {
        return data['articulos'].map(item => ({
            id: item.id,
            stock_actual: item.stock_actual,
            codigo_principal: item.codigo_principal,
            codigo_secundario: item.codigo_secundario,
            codigo_terciario: item.codigo_terciario,
            codigo_cuaternario: item.codigo_cuaternario,
            codigo_adicional: item.codigo_adicional,
            descripcion: item.descripcion,
        }));
    };

    const handleDelete = useCallback(async (pk) => {
        confirm({
            title: 'Confirmar acción',
            description: '¿Está seguro que desea eliminar el registro seleccionado?',
            cancellationText: 'Cancelar',
            confirmationText: 'Confirmar'
        })
            .then(async () => {
                setLoading(true);
                try {
                    const url = `${apiUrl}/${pk}/delete`;
                    const res = await fetchWithAuth(url, 'DELETE');
                    const data = await res.json();
                    if (!res.ok) {
                        throw new Error(data['error']);
                    }
                    setList(list.filter(item => item.id !== pk));
                    setSnackbar({
                        message: data['message'],
                        severity: 'success',
                        autoHideDuration: 4000,
                        onClose: handleCloseSnackbar
                    });
                    setOpenSnackbar(true);
                } catch (e) {
                    setSnackbar({
                        message: `Error al eliminar el registro: ${e.message}`,
                        severity: 'error',
                        autoHideDuration: 6000,
                        onClose: handleCloseSnackbar
                    });
                    setOpenSnackbar(true);
                } finally {
                    setLoading(false);
                }
            })
            .catch(() => {
                setSnackbar({
                    message: 'Acción cancelada',
                    severity: 'info',
                    autoHideDuration: 4000,
                    onClose: handleCloseSnackbar
                });
                setOpenSnackbar(true);
            });
    }, [apiUrl, confirm, handleCloseSnackbar, list]);

    const enhancedColumns = [
        ...columns,
        {
            field: 'actions', type: 'actions', headerName: 'Acciones', flex: 0.75,
            getActions: (params) => [
                allowView && (
                    <GridActionsCellItem
                        icon={<Visibility />}
                        component={Link}
                        to={`${detailUrl}/${params.row.id}`}
                    />
                ),
                allowUpdate && (
                    <GridActionsCellItem
                        icon={<Edit />}
                        component={Link}
                        to={`${editUrl}/${params.row.id}`}
                    />
                ),
                allowDelete && (
                    <GridActionsCellItem
                        icon={<Delete />}
                        onClick={() => handleDelete(params.row.id)}
                    />
                )
            ].filter(Boolean) // Remove undefined values
        }
    ];

    const fetchData = useCallback(async (query = '') => {
        setLoading(true);
        try {
            const url = `${apiUrl}?query=${query}`;
            const res = await fetchWithAuth(url);
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data['error']);
            }
            setList(mapDataToRows(data));
        } catch (e) {
            setSnackbar({
                message: `Error al cargar los artículos: ${e.message}`,
                severity: 'error',
                autoHideDuration: 6000,
                onClose: handleCloseSnackbar
            });
            setOpenSnackbar(true);
        } finally {
            setLoading(false);
        }
    }, [apiUrl, handleCloseSnackbar]);

    const handleSearch = useCallback((query) => {
        fetchData(query);
    }, [fetchData]);

    const toolbarProps = {
        show_btn_add: allowCreate,
        txt_btn_add: 'Nuevo Artículo',
        url_btn_add: '/articulos/form',
        onSearch: handleSearch
    };

    return (
        <>
            <div style={{ height: 500, width: '100%' }}>
                <DataGrid
                    loading={loading}
                    columns={enhancedColumns}
                    rows={list}
                    disableRowSelectionOnClick
                    pageSizeOptions={[]}
                    rowHeight={30}
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    slots={{
                        toolbar: () => <ArticuloListToolbar {...toolbarProps} />
                    }}
                    ignoreDiacritics
                />
            </div>
            <SnackbarAlert
                open={openSnackbar}
                message={snackbar.message}
                severity={snackbar.severity}
                autoHideDuration={snackbar.autoHideDuration}
                onClose={snackbar.onClose}
            />
        </>
    );
}