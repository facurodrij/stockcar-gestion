import React, { useEffect, useState } from 'react'
import {
    DataGrid,
    GridActionsCellItem,
    GridToolbarColumnsButton,
    GridToolbarContainer,
    GridToolbarDensitySelector,
    GridToolbarExport,
    GridToolbarFilterButton, GridToolbarQuickFilter
} from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { API } from "../../App";
import { Link } from "react-router-dom";
import { esES } from "@mui/x-data-grid/locales";
import { Box, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import fetchWithAuth from '../../utils/fetchWithAuth';
import SnackbarAlert from '../shared/SnackbarAlert';
import { useLoading } from '../../utils/loadingContext';
import dayjs from "dayjs";


const CustomToolbar = () => {
    return (
        <GridToolbarContainer sx={{ borderBottom: 1, borderColor: 'divider', pb: .5 }}>
            <GridToolbarQuickFilter size={'small'} />
            <GridToolbarColumnsButton />
            <GridToolbarFilterButton />
            <GridToolbarDensitySelector />
            <GridToolbarExport />
            <Box sx={{ flexGrow: 1 }} />
            <Button
                startIcon={<AddIcon />}
                component={Link}
                to="/movimientos-stock/form"
                size="small"
                variant="contained"
                color="success"
            >
                Nuevo Movimiento de Stock
            </Button>
        </GridToolbarContainer>
    );
}


export default function MovStockList() {
    const [list, setList] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        autoHideDuration: 4000,
        onClose: () => handleCloseSnackbar(false)
    });
    const { withLoading } = useLoading();

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    useEffect(() => {
        const fetchData = async () => {
            const url = `${API}/movimientos-stock`;
            try {
                const res = await fetchWithAuth(url);
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data['error']);
                }
                setList(data['movimientos']);
            } catch (error) {
                console.error(error);
                setSnackbar({
                    message: `Error al cargar los movimientos de stock: ${error.message}`,
                    severity: 'error',
                    autoHideDuration: null,
                    onClose: () => handleCloseSnackbar
                });
                setOpenSnackbar(true);
            }
        }

        withLoading(fetchData);
    }, [withLoading]);

    const columns = [
        {
            field: 'fecha_hora', headerName: 'Fecha y hora', type: 'dateTime', flex: 2,
            valueFormatter: (value) => {
                if (!value) {
                    return "";
                }
                return dayjs(value, 'YYYY-MM-DDTHH:mm:ss').format('DD/MM/YYYY HH:mm:ss');
            }
        },
        { field: 'tipo_movimiento', headerName: 'Tipo de Movimiento', flex: 2 },
        { field: 'origen', headerName: 'Origen', flex: 2 },
        {
            field: 'acciones',
            headerName: 'Acciones',
            flex: 1,
            renderCell: (params) => (
                <GridActionsCellItem
                        icon={<VisibilityIcon />}
                        component={Link}
                        to={`/movimientos-stock/${params.id}`}
                    />
            )
        }
    ];

    let rows = list.map(item => {
        return {
            id: item.id,
            fecha_hora: item.fecha_hora,
            tipo_movimiento: item.tipo_movimiento,
            origen: item.origen
        };
    });

    return (
        <>
            <div style={{ height: 500, width: '100%' }}>
                <DataGrid
                    columns={columns}
                    rows={rows}
                    disableSelectionOnClick
                    rowHeight={30}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 20]}
                    initialState={{ sorting: { sortModel: [{ field: 'fecha_hora', sort: 'desc' }] } }}
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    slots={{ toolbar: CustomToolbar }}
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
