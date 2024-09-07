import React, { useEffect } from "react";
import Typography from "@mui/material/Typography";
import MovStockList from "../../components/movimiento_stock/MovStockList";
import { checkAuth, checkPermissions } from "../../utils/checkAuth";

export default function MovStockPage() {
    useEffect(() => {
        checkAuth();
        if (!checkPermissions(["movimiento_stock.view_all"])) {
            window.location.href = "/unauthorized";
        }
    }, []);

    return (
        <>
            <Typography
                variant="h4"
                sx={{
                    mt: 2,
                    mb: 2,
                    fontFamily: "roboto",
                    color: "inherit",
                }}
            >
                Movimientos de Stock
            </Typography>
            <MovStockList />
        </>
    );
}