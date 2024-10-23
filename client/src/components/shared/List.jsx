import React, { useState, useEffect } from 'react';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { Delete, Edit, Visibility } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import SnackbarAlert from './SnackbarAlert';
import { useLoading } from '../../utils/loadingContext';
import { useConfirm } from 'material-ui-confirm';
import fetchWithAuth from '../../utils/fetchWithAuth';
import { esES } from '@mui/x-data-grid/locales';
import ListToolbar from './ListToolbar';

const List = ({
    apiUrl,
    editUrl,
    detailUrl,
    allowView,
    allowUpdate,
    allowDelete,
    columns,
    rowHeight = 30,
    pageSize = 5,
    rowsPerPageOptions = [5, 10, 20],
    initialSortField = 'id',
    initialSortOrder = 'desc',
    toolbarProps,
    snackbarMessages,
    mapDataToRows
}) => {
    const [list, setList] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        autoHideDuration: 4000,
        onClose: () => handleCloseSnackbar(false)
    });
    const { withLoading } = useLoading();
    const [loading, setLoading] = useState(false);

    const confirm = useConfirm();

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetchWithAuth(apiUrl);
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data['error']);
                }
                setList(mapDataToRows(data));
            } catch (error) {
                console.error(error);
                setSnackbar({
                    message: snackbarMessages.fetchError(error.message),
                    severity: 'error',
                    autoHideDuration: null,
                    onClose: handleCloseSnackbar
                });
                setOpenSnackbar(true);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [apiUrl, snackbarMessages, mapDataToRows]);

    const handleDelete = async (pk) => {
        confirm({
            title: 'Confirmar acción',
            description: '¿Está seguro que desea eliminar el artículo?',
            cancellationText: 'Cancelar',
            confirmationText: 'Confirmar'
        })
            .then(() => {
                withLoading(async () => {
                    const url = `${apiUrl}/${pk}/delete`;
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
                            setList(list.filter(item => item.id !== pk));
                            setSnackbar({
                                message: snackbarMessages.deleteSuccess(data['message']),
                                severity: 'success',
                                autoHideDuration: 4000,
                                onClose: () => handleCloseSnackbar()
                            });
                            setOpenSnackbar(true);
                        })
                        .catch((error) => {
                            setSnackbar({
                                message: snackbarMessages.deleteError(error.message),
                                severity: 'error',
                                autoHideDuration: 6000,
                                onClose: () => handleCloseSnackbar()
                            });
                            setOpenSnackbar(true);
                        });
                });
            })
            .catch((error) => {
                setSnackbar({
                    message: snackbarMessages.actionCancelled,
                    severity: 'info',
                    autoHideDuration: 4000,
                    onClose: () => handleCloseSnackbar()
                });
                setOpenSnackbar(true);
            });
    }

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
                    pageSize={pageSize}
                    rowsPerPageOptions={rowsPerPageOptions}
                    initialState={{ sorting: { sortModel: [{ field: initialSortField, sort: initialSortOrder }] } }}
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    slots={{
                        toolbar: () => <ListToolbar {...toolbarProps} />
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
};

export default List;