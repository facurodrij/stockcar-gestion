import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import { Delete, Edit, Visibility } from '@mui/icons-material';
import { useConfirm } from 'material-ui-confirm';
import fetchWithAuth from '../../config/auth/fetchWithAuth';
import ListToolbar from './ListToolbar';
import SnackbarAlert from './SnackbarAlert';

const List = ({
    apiUrl,
    editUrl,
    detailUrl,
    allowView,
    allowUpdate,
    allowDelete,
    columns,
    rowHeight = 30,
    pageSizeOptions = [50],
    initialSortField = 'id',
    initialSortOrder = 'desc',
    toolbarProps,
    mapDataToRows,
    serverSide = false // New prop to enable server-side rendering
}) => {
    const [list, setList] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        autoHideDuration: 4000,
        onClose: () => handleCloseSnackbar(false)
    });
    const [loading, setLoading] = useState(false);
    const [rowCount, setRowCount] = useState(0); // New state for total row count
    const [paginationModel, setPaginationModel] = React.useState({
        pageSize: 50,
        page: 0,
    });

    const confirm = useConfirm();

    const handleCloseSnackbar = useCallback(() => {
        setOpenSnackbar(false);
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const url = serverSide 
                ? `${apiUrl}?page=${paginationModel.page + 1}&page_size=${paginationModel.pageSize}`
                : apiUrl;
            const res = await fetchWithAuth(url);
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data['error']);
            }
            setList(mapDataToRows(data));
            if (serverSide) {
                setRowCount(data.total); // Assuming the API returns the total count
            }
        } catch (e) {
            console.error(e);
            setSnackbar({
                message: `Error al obtener los registros: ${e.message}`,
                severity: 'error',
                autoHideDuration: null,
                onClose: handleCloseSnackbar
            });
            setOpenSnackbar(true);
        } finally {
            setLoading(false);
        }
    }, [apiUrl, mapDataToRows, handleCloseSnackbar, paginationModel, serverSide]);

    useEffect(() => {
        fetchData();
    }, [fetchData, paginationModel]);

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

    return (
        <>
            <div style={{ height: 500, width: '100%' }}>
                <DataGrid
                    loading={loading}
                    columns={enhancedColumns}
                    rows={list}
                    disableRowSelectionOnClick
                    rowHeight={rowHeight}
                    pageSizeOptions={pageSizeOptions}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 50, page: 0 },
                        },
                        sorting: { sortModel: [{ field: initialSortField, sort: initialSortOrder }] }
                    }}
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    slots={{
                        toolbar: () => <ListToolbar {...toolbarProps} />
                    }}
                    ignoreDiacritics
                    paginationMode={serverSide ? 'server' : 'client'} // Enable server-side pagination
                    rowCount={serverSide ? rowCount : undefined} // Set total row count for server-side pagination
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
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
};

export default List;