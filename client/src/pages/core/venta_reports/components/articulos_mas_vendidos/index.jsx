import React, { useState, useEffect, useCallback } from 'react';
import {
  DataGrid,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridToolbarExport
} from '@mui/x-data-grid';
import { esES } from "@mui/x-data-grid/locales";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Card,
  CardContent,
  Grid
} from "@mui/material";
import { TrendingUp } from '@mui/icons-material';
import { API } from '../../../../../App';
import fetchWithAuth from '../../../../../config/auth/fetchWithAuth';
import SnackbarAlert from '../../../../../common/components/SnackbarAlert';
import checkPermissions from '../../../../../config/auth/checkPermissions';
import PageTitle from '../../../../../common/components/PageTitle';

const LIMITES_OPCIONES = [10, 20, 50, 100, 500, 1000];

export default function ArticulosMasVendidos({ permissions }) {
  const [list, setList] = useState([]);
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [limite, setLimite] = useState(50);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbar, setSnackbar] = useState({
    message: '',
    severity: 'success',
    autoHideDuration: 4000,
    onClose: () => handleCloseSnackbar()
  });
  const [loading, setLoading] = useState(false);

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  }

  const fetchReporteData = useCallback(async () => {
    setLoading(true);
    
    const params = new URLSearchParams();
    if (from) params.append('desde', from.toISOString());
    if (to) params.append('hasta', to.toISOString());
    params.append('limite', limite);

    try {
      const res = await fetchWithAuth(`${API}/ventas/reporte-ventas/articulos-mas-vendidos?${params.toString()}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data['error'] || 'Error al obtener el reporte');
      }

      setList(data.articulos || []);
    } catch (error) {
      console.error(error);
      setSnackbar({
        message: `Error al obtener el reporte: ${error.message}`,
        severity: 'error',
        autoHideDuration: null,
        onClose: handleCloseSnackbar
      });
      setOpenSnackbar(true);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [from, to, limite]);

  useEffect(() => {
    checkPermissions(permissions);
  }, [permissions]);

  const CustomToolbar = () => {
    return (
      <GridToolbarContainer sx={{ borderBottom: 1, borderColor: 'divider', pb: .5 }}>
        <GridToolbarQuickFilter size={'small'} />
        <GridToolbarColumnsButton />
        <GridToolbarExport 
          csvOptions={{
            fileName: `articulos_mas_vendidos_${new Date().toISOString().split('T')[0]}`,
            delimiter: ',',
            utf8WithBom: true,
          }}
        />
        <Box sx={{ flexGrow: 1 }} />
      </GridToolbarContainer>
    );
  }

  const columns = [
    {
      field: 'posicion',
      headerName: '#',
      width: 60,
      renderCell: (params) => {
        const index = list.findIndex(item => item.id === params.row.id);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
            {index + 1}
          </Box>
        );
      }
    },
    {
      field: 'codigo_principal',
      headerName: 'Código',
      flex: 1,
      minWidth: 120
    },
    {
      field: 'descripcion',
      headerName: 'Descripción',
      flex: 2,
      minWidth: 250
    },
    {
      field: 'cantidad_total',
      headerName: 'Cantidad Vendida',
      flex: 1,
      minWidth: 150,
      type: 'number',
      valueFormatter: (value) => {
        return new Intl.NumberFormat('es-AR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(value);
      }
    },
    {
      field: 'total_vendido',
      headerName: 'Total Vendido',
      flex: 1,
      minWidth: 150,
      type: 'number',
      valueFormatter: (value) => {
        return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS'
        }).format(value);
      }
    }
  ];

  const totalCantidad = list.reduce((sum, item) => sum + parseFloat(item.cantidad_total || 0), 0);
  const totalVendido = list.reduce((sum, item) => sum + parseFloat(item.total_vendido || 0), 0);

  return (
    <>
      <PageTitle heading="Artículos Más Vendidos" />

      {/* Filtros */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'es'}>
                <DatePicker
                  label="Desde"
                  value={from}
                  onChange={(newValue) => setFrom(newValue)}
                  slotProps={{
                    textField: { size: 'small', fullWidth: true }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'es'}>
                <DatePicker
                  label="Hasta"
                  value={to}
                  onChange={(newValue) => setTo(newValue)}
                  slotProps={{
                    textField: { size: 'small', fullWidth: true }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Límite de Artículos</InputLabel>
                <Select
                  value={limite}
                  onChange={(e) => setLimite(e.target.value)}
                  label="Límite de Artículos"
                >
                  {LIMITES_OPCIONES.map((opcion) => (
                    <MenuItem key={opcion} value={opcion}>
                      Top {opcion}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <Button
                startIcon={<TrendingUp />}
                onClick={fetchReporteData}
                fullWidth
                variant="contained"
                color='success'
                size="large"
              >
                Generar Reporte
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Resumen */}
      {list.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Typography variant="h6" color="primary">
                    {list.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Artículos Diferentes
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Typography variant="h6" color="info.main">
                    {new Intl.NumberFormat('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }).format(totalCantidad)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Unidades Vendidas
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Typography variant="h6" color="success.main">
                    {new Intl.NumberFormat('es-AR', {
                      style: 'currency',
                      currency: 'ARS'
                    }).format(totalVendido)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Vendido
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* DataGrid */}
      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          loading={loading}
          columns={columns}
          rows={list}
          disableRowSelectionOnClick
          rowHeight={40}
          pageSizeOptions={[25, 50, 100, 500]}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 50,
                page: 0
              }
            }
          }}
          localeText={esES.components.MuiDataGrid.defaultProps.localeText}
          slots={{ toolbar: CustomToolbar }}
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
