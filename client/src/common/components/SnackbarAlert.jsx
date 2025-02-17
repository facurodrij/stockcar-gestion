import React from "react";
import {Alert, Snackbar} from "@mui/material";

export default function SnackbarAlert({ open, autoHideDuration, onClose, severity, message }) {
    return (
        <Snackbar open={open} autoHideDuration={autoHideDuration} onClose={onClose}>
            <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
                {message}
            </Alert>
        </Snackbar>
    );
}