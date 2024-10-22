import React, { useEffect, useState } from 'react'
import {
    DataGrid,
    GridActionsCellItem
} from '@mui/x-data-grid';
import { Delete, Edit, Visibility } from '@mui/icons-material';
import { API } from "../../App";
import { Link } from "react-router-dom";
import { esES } from "@mui/x-data-grid/locales";
import fetchWithAuth from '../../utils/fetchWithAuth';
import SnackbarAlert from '../shared/SnackbarAlert';
import { useLoading } from '../../utils/loadingContext';
import { useConfirm } from 'material-ui-confirm';
import ListToolbar from '../shared/ListToolbar';


export default function ArticuloList({ allowView, allowCreate, allowUpdate, allowDelete }) {
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
            const url = `${API}/articulos`;
            try {
                const res = await fetchWithAuth(url);
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data['error']);
                }
                setList(data['articulos']);
            } catch (error) {
                console.error(error);
                setSnackbar({
                    message: `Error al obtener los artículos: ${error.message}`,
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
    }, []);

    const columns = [
        { field: 'stock_actual', headerName: 'Stock', flex: 0.5 },
        { field: 'descripcion', headerName: 'Descripción', flex: 2 },
        { field: 'codigo_principal', headerName: 'Código principal', flex: 1 },
        { field: 'codigo_secundario', headerName: 'Código secundario', flex: 1 },
        { field: 'codigo_terciario', headerName: 'Código terciario', flex: 0.75 },
        { field: 'codigo_cuaternario', headerName: 'Código cuaternario', flex: 0.75 },
        { field: 'codigo_adicional', headerName: 'Código adicional', flex: 0.75 },
        {
            field: 'actions', type: 'actions', headerName: 'Acciones', flex: 0.75,
            getActions: (params) => [
                allowView && (
                    <GridActionsCellItem
                        icon={<Visibility />}
                        component={Link}
                        to={`/articulos/${params.row.id}`}
                    />
                ),
                allowUpdate && (
                    <GridActionsCellItem
                        icon={<Edit />}
                        component={Link}
                        to={`/articulos/form/${params.row.id}`}
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

    let rows = list.map(item => {
        return {
            id: item.id,
            stock_actual: item.stock_actual,
            codigo_principal: item.codigo_principal,
            codigo_secundario: item.codigo_secundario,
            codigo_terciario: item.codigo_terciario,
            codigo_cuaternario: item.codigo_cuaternario,
            codigo_adicional: item.codigo_adicional,
            descripcion: item.descripcion,
        }
    });

    const handleDelete = async (pk) => {
        confirm({
            title: 'Confirmar acción',
            description: '¿Está seguro que desea eliminar el artículo?',
            cancellationText: 'Cancelar',
            confirmationText: 'Confirmar'

        })
            .then(() => {
                withLoading(async () => {
                    const url = `${API}/articulos/${pk}/delete`;
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
                                message: data['message'],
                                severity: 'success',
                                autoHideDuration: 4000,
                                onClose: () => handleCloseSnackbar()
                            });
                            setOpenSnackbar(true);
                        })
                        .catch((error) => {
                            setSnackbar({
                                message: `Error al eliminar el artículo: ${error.message}`,
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
                    message: 'Acción cancelada',
                    severity: 'info',
                    autoHideDuration: 4000,
                    onClose: () => handleCloseSnackbar()
                });
                setOpenSnackbar(true);
            });
    }


    return (
        <>
            <div style={{ height: 500, width: '100%' }}>
                <DataGrid
                    loading={loading}
                    columns={columns}
                    rows={rows}
                    disableRowSelectionOnClick
                    rowHeight={30}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 20]}
                    initialState={{ sorting: { sortModel: [{ field: 'id', sort: 'desc' }] } }}
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    slots={{
                        toolbar: () => <ListToolbar
                            show_btn_add={allowCreate}
                            txt_btn_add='Nuevo Artículo'
                            url_btn_add='/articulos/form'
                        />
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
