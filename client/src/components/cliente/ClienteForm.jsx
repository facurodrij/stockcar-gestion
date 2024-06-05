import React, {useEffect, useState} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {
    Button,
    FormControl,
    FormHelperText,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography
} from "@mui/material";
import {DatePicker, LocalizationProvider} from '@mui/x-date-pickers';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from "dayjs";

import {API} from "../../App";


export default function ClienteForm(id) {
    const [item, setItem] = useState(null);
    const {register, handleSubmit, control, formState: {errors}} = useForm();
    const [selectItems, setSelectItems] = useState({
        tipo_documento: [],
        tipo_responsable: [],
        provincia: [],
        genero: []
    });

    const fetchData = async () => {
        const res = await fetch(`${API}/clientes/create`);
        return await res.json();
    }

    useEffect(() => {
        fetchData().then((data) => {
            setSelectItems({
                tipo_documento: data['tipo_documento'],
                tipo_responsable: data['tipo_responsable'],
                provincia: data['provincia'],
                genero: data['genero']
            });
        });
    }, []);


    const onSubmit = (data) => {
        if (Boolean(id.id) === false) {
            fetch(`${API}/clientes/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }).then(response => {
                if (response.ok) {
                    alert('Cliente creado correctamente');
                } else {
                    alert('Error al crear el cliente');
                }
            });
        } else {
            fetch(`${API}/clientes/${id.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }).then(response => {
                if (response.ok) {
                    alert('Cliente actualizado correctamente');
                } else {
                    alert('Error al actualizar el cliente');
                }
            });
        }
    }

    return (
        <>
            <Paper elevation={3} component="form" onSubmit={handleSubmit(onSubmit)} noValidate
                   sx={{mt: 2, padding: 2}}>
                <Typography variant="h6" gutterBottom>Identidad</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={4}>
                        <FormControl fullWidth required error={Boolean(errors.tipo_responsable)}>
                            <InputLabel id="tipo_responsable_label">Tipo de Responsable IVA</InputLabel>
                            <Controller
                                name="tipo_responsable"
                                control={control}
                                defaultValue=""
                                rules={{required: "Este campo es requerido"}}
                                render={({field}) => (
                                    <Select
                                        {...field}
                                        id="tipo_responsable"
                                        labelId="tipo_responsable_label"
                                        label="Tipo de Responsable IVA"
                                    >
                                        {selectItems.tipo_responsable.map((item) => (
                                            <MenuItem key={item.id} value={item.id}>{item.descripcion}</MenuItem>))}
                                    </Select>
                                )}
                            />
                            <FormHelperText>{errors.tipo_responsable && errors.tipo_responsable.message}</FormHelperText>
                        </FormControl>
                    </Grid>
                    <Grid item xs={8}>
                        <FormControl fullWidth>
                            <Controller
                                name="razon_social"
                                control={control}
                                defaultValue=""
                                rules={{required: "Este campo es requerido"}}
                                render={({field}) => (
                                    <TextField
                                        {...field}
                                        required
                                        id="razon_social"
                                        label="Razón Social"
                                        variant="outlined"
                                        error={Boolean(errors.razon_social)}
                                        helperText={errors.razon_social && errors.razon_social.message}
                                    />
                                )}
                            />
                        </FormControl>
                    </Grid>
                    <Grid item xs={4}>
                        <FormControl fullWidth required error={Boolean(errors.tipo_documento)}>
                            <InputLabel id="tipo_documento_label">Tipo de Documento</InputLabel>
                            <Controller
                                name="tipo_documento"
                                control={control}
                                defaultValue=""
                                rules={{required: "Este campo es requerido"}}
                                render={({field}) => (
                                    <Select
                                        {...field}
                                        id="tipo_documento"
                                        labelId="tipo_documento_label"
                                        label="Tipo de Documento"
                                    >
                                        {selectItems.tipo_documento.map((item) => (
                                            <MenuItem key={item.id} value={item.id}>{item.descripcion}</MenuItem>))}
                                    </Select>
                                )}
                            />
                            <FormHelperText>{errors.tipo_documento && errors.tipo_documento.message}</FormHelperText>
                        </FormControl>
                    </Grid>
                    <Grid item xs={8}>
                        <FormControl fullWidth>
                            <Controller
                                name="nro_documento"
                                control={control}
                                defaultValue=""
                                rules={{
                                    required: "Este campo es requerido",
                                    pattern: {
                                        value: /^[0-9]*$/,
                                        message: "El número de documento debe ser numérico"
                                    }
                                }}
                                render={({field}) => (
                                    <TextField
                                        {...field}
                                        required
                                        id="nro_documento"
                                        label="Número de Documento"
                                        variant="outlined"
                                        error={Boolean(errors.nro_documento)}
                                        helperText={errors.nro_documento && errors.nro_documento.message}
                                    />
                                )}
                            />
                        </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth error={Boolean(errors.fecha_nacimiento)}>
                            <Controller
                                name="fecha_nacimiento"
                                control={control}
                                defaultValue={null}
                                rules={{
                                    validate: value => {
                                        if (!value) return true; // Si no hay valor, la validación pasa
                                        const selectedDate = new Date(value);
                                        const currentDate = new Date();
                                        // Si el valor es mayor que la fecha actual, la validación falla
                                        return selectedDate < currentDate || "La fecha de nacimiento no puede ser futura";
                                    }
                                }}
                                render={({field}) => (
                                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'es'}>
                                        <DatePicker
                                            {...field}
                                            label="Fecha de Nacimiento"
                                            maxDate={dayjs()}
                                            inputFormat="DD/MM/YYYY"
                                        />
                                    </LocalizationProvider>
                                )}
                            />
                            <FormHelperText>{errors.fecha_nacimiento && errors.fecha_nacimiento.message}</FormHelperText>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <InputLabel id="genero_label">Género</InputLabel>
                            <Controller
                                name="genero"
                                control={control}
                                defaultValue=""
                                render={({field}) => (
                                    <Select
                                        {...field}
                                        id="genero"
                                        labelId="genero_label"
                                        label="Género"
                                    >
                                        {selectItems.genero.map((item) => (
                                            <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>))}
                                    </Select>
                                )}
                            />
                        </FormControl>
                    </Grid>
                </Grid>
                <Typography variant="h6" gutterBottom sx={{mt: 3}}>Dirección</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <Controller
                                name="direccion"
                                control={control}
                                defaultValue=""
                                rules={{required: "Este campo es requerido"}}
                                render={({field}) => (
                                    <TextField
                                        {...field}
                                        required
                                        id="direccion"
                                        label="Dirección"
                                        variant="outlined"
                                        error={Boolean(errors.direccion)}
                                        helperText={errors.direccion && errors.direccion.message}
                                    />
                                )}
                            />
                        </FormControl>
                    </Grid>
                    <Grid item xs={4}>
                        <FormControl fullWidth>
                            <Controller
                                name="localidad"
                                control={control}
                                defaultValue=""
                                rules={{required: "Este campo es requerido"}}
                                render={({field}) => (
                                    <TextField
                                        {...field}
                                        required
                                        id="localidad"
                                        label="Localidad"
                                        variant="outlined"
                                        error={Boolean(errors.localidad)}
                                        helperText={errors.localidad && errors.localidad.message}
                                    />
                                )}
                            />
                        </FormControl>
                    </Grid>
                    <Grid item xs={4}>
                        <FormControl fullWidth>
                            <Controller
                                name="codigo_postal"
                                control={control}
                                defaultValue=""
                                rules={{required: "Este campo es requerido"}}
                                render={({field}) => (
                                    <TextField
                                        {...field}
                                        required
                                        id="codigo_postal"
                                        label="Código Postal"
                                        variant="outlined"
                                        error={Boolean(errors.codigo_postal)}
                                        helperText={errors.codigo_postal && errors.codigo_postal.message}
                                    />
                                )}
                            />
                        </FormControl>
                    </Grid>
                    <Grid item xs={4}>
                        <FormControl fullWidth required error={Boolean(errors.provincia)}>
                            <InputLabel id="provincia_label">Provincia</InputLabel>
                            <Controller
                                name="provincia"
                                control={control}
                                defaultValue=""
                                rules={{required: "Este campo es requerido"}}
                                render={({field}) => (
                                    <Select
                                        {...field}
                                        id="provincia"
                                        labelId="provincia_label"
                                        label="Provincia"
                                    >
                                        {selectItems.provincia.map((item) => (
                                            <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>))}
                                    </Select>
                                )}
                            />
                            <FormHelperText>{errors.provincia && errors.provincia.message}</FormHelperText>
                        </FormControl>
                    </Grid>
                </Grid>
                <Typography variant="h6" gutterBottom sx={{mt: 3}}>Contacto</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <TextField
                                {...register("telefono")}
                                id="telefono"
                                label="Teléfono"
                                variant="outlined"
                            />
                        </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <Controller
                                name="email"
                                control={control}
                                defaultValue=""
                                rules={{
                                    pattern: {
                                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                                        message: "Email inválido"
                                    }
                                }}
                                render={({field}) => (
                                    <TextField
                                        {...field}
                                        id="email"
                                        label="Email"
                                        variant="outlined"
                                        error={Boolean(errors.email)}
                                        helperText={errors.email && errors.email.message}
                                    />
                                )}
                            />
                        </FormControl>
                    </Grid>
                </Grid>
                <Grid container spacing={2} sx={{mt: 2}}>
                    <Grid item xs={6}>
                        <Button type="submit" variant="contained" color="primary">
                            Guardar
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </>
    );
}