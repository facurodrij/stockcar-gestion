import React, { useState, useEffect, useCallback } from 'react';
import {
  DataGrid,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarQuickFilter
} from '@mui/x-data-grid';
import dayjs from "dayjs";
import { esES } from "@mui/x-data-grid/locales";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  Button,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Typography,
  Card,
  CardContent,
  Grid
} from "@mui/material";
import { Search } from '@mui/icons-material';
import { API } from '../../../../../App';
import fetchWithAuth from '../../../../../config/auth/fetchWithAuth';
import SnackbarAlert from '../../../../../common/components/SnackbarAlert';
import checkPermissions from '../../../../../config/auth/checkPermissions';
import PageTitle from '../../../../../common/components/PageTitle';

const ESTADOS_VENTA = [
  { value: 'orden', label: 'Orden', color: 'info' },
  { value: 'ticket', label: 'Ticket', color: 'success' },
  { value: 'facturado', label: 'Facturado', color: 'success' },
  { value: 'anulado', label: 'Anulado', color: 'error' }
];

const TIPOS_COMPROBANTE = [
  { id: 1, descripcion: 'Factura A' },
  { id: 5, descripcion: 'Factura B' },
  { id: 9, descripcion: 'Remito' }
];

export default function VentaReporteVendedor({ permissions }) {
  const [list, setList] = useState([]);
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [selectedUsuarioId, setSelectedUsuarioId] = useState('');
  const [selectedTiposComprobante, setSelectedTiposComprobante] = useState([1, 5, 9]);
  const [selectedEstados, setSelectedEstados] = useState(['ticket', 'facturado']);
  const [usuarios, setUsuarios] = useState([]);
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

  const fetchUsuarios = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API}/usuarios`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data['error']);
      }
      setUsuarios(data['usuarios'] || []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  }, []);

  const fetchReporteData = useCallback(async () => {
    if (!selectedUsuarioId) {
      setList([]);
      return;
    }

    setLoading(true);
    const fromStr = from ? from.toISOString() : '';
    const toStr = to ? to.toISOString() : '';

    try {
      const res = await fetchWithAuth(`${API}/ventas/reporte-ventas/por-vendedor`, 'POST', {
        desde: fromStr,
        hasta: toStr,
        usuario_id: parseInt(selectedUsuarioId),
        tipo_comprobante_ids: selectedTiposComprobante
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data['error']);
      }

      // Filtrar por estados seleccionados
      const ventasFiltradas = data.ventas.filter(venta =>
        selectedEstados.includes(venta.estado)
      );

      setList(ventasFiltradas);
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
  }, [from, to, selectedUsuarioId, selectedTiposComprobante, selectedEstados]);

  useEffect(() => {
    checkPermissions(permissions);
    fetchUsuarios();
  }, [permissions, fetchUsuarios]);

  const CustomToolbar = () => {
    return (
      <GridToolbarContainer sx={{ borderBottom: 1, borderColor: 'divider', pb: .5 }}>
        <GridToolbarQuickFilter size={'small'} />
        <GridToolbarColumnsButton />
        <Box sx={{ flexGrow: 1 }} />
        <Button
          startIcon={<Search />}
          onClick={fetchReporteData}
          size="small"
          variant="contained"
          color='primary'
          disabled={!selectedUsuarioId}
        >
          Generar Reporte
        </Button>
      </GridToolbarContainer>
    );
  }

  const columns = [
    {
      field: 'fecha_hora',
      headerName: 'Fecha y hora',
      type: 'dateTime',
      flex: 1,
      valueFormatter: (value) => {
        if (!value) return "";
        return dayjs(value, 'YYYY-MM-DDTHH:mm:ss.SSSSSS').format('DD/MM/YYYY HH:mm:ss');
      }
    },
    {
      field: 'tipo_comprobante',
      headerName: 'Comprobante',
      flex: 1,
      valueGetter: (value, row) => row.tipo_comprobante?.descripcion || ''
    },
    { field: 'nro_comprobante', headerName: 'Número', flex: 1 },
    { field: 'nombre_cliente', headerName: 'Cliente', flex: 1 },
    {
      field: 'total',
      headerName: 'Total',
      flex: 1,
      valueFormatter: (value) => {
        return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS'
        }).format(value);
      }
    },
    {
      field: 'estado',
      headerName: 'Estado',
      flex: 1,
      renderCell: (params) => {
        const estadoInfo = ESTADOS_VENTA.find(e => e.value === params.value);
        return (
          <Chip
            variant='outlined'
            label={estadoInfo?.label || params.value}
            color={estadoInfo?.color || 'default'}
            size='small'
          />
        );
      },
    }
  ];

  const totalVentas = list.reduce((sum, venta) => sum + parseFloat(venta.total || 0), 0);
  const cantidadVentas = list.length;

  return (
    <>
      <PageTitle heading="Reporte de Ventas por Vendedor" />

      {/* Filtros */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Vendedor</InputLabel>
                <Select
                  value={selectedUsuarioId}
                  onChange={(e) => setSelectedUsuarioId(e.target.value)}
                  label="Vendedor"
                >
                  <MenuItem value="">
                    <em>Seleccionar vendedor</em>
                  </MenuItem>
                  {usuarios.map((usuario) => (
                    <MenuItem key={usuario.id} value={usuario.id}>
                      {usuario.username} - {usuario.nombre} {usuario.apellido}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
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

            <Grid item xs={12} md={2}>
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

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipos de Comprobante</InputLabel>
                <Select
                  multiple
                  value={selectedTiposComprobante}
                  onChange={(e) => setSelectedTiposComprobante(e.target.value)}
                  input={<OutlinedInput label="Tipos de Comprobante" />}
                  renderValue={(selected) =>
                    selected.map(id =>
                      TIPOS_COMPROBANTE.find(t => t.id === id)?.descripcion
                    ).join(', ')
                  }
                >
                  {TIPOS_COMPROBANTE.map((tipo) => (
                    <MenuItem key={tipo.id} value={tipo.id}>
                      {tipo.descripcion}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Estados</InputLabel>
                <Select
                  multiple
                  value={selectedEstados}
                  onChange={(e) => setSelectedEstados(e.target.value)}
                  input={<OutlinedInput label="Estados" />}
                  renderValue={(selected) =>
                    selected.map(estado =>
                      ESTADOS_VENTA.find(e => e.value === estado)?.label
                    ).join(', ')
                  }
                >
                  {ESTADOS_VENTA.map((estado) => (
                    <MenuItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Resumen */}
      {list.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box textAlign="center">
                  <Typography variant="h6" color="primary">
                    {cantidadVentas}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Cantidad de Ventas
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box textAlign="center">
                  <Typography variant="h6" color="success.main">
                    {new Intl.NumberFormat('es-AR', {
                      style: 'currency',
                      currency: 'ARS'
                    }).format(totalVentas)}
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
      <div style={{ height: 500, width: '100%' }}>
        <DataGrid
          loading={loading}
          columns={columns}
          rows={list}
          disableRowSelectionOnClick
          rowHeight={30}
          pageSizeOptions={[25, 50, 100]}
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