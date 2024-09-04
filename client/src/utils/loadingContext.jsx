import React, { createContext, useContext, useState, useCallback } from 'react';
import { LinearProgress, Box } from '@mui/material';
import { styled } from '@mui/system';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);

    const withLoading = useCallback(async (fn) => {
        setLoading(true);
        try {
            await fn();
        } finally {
            setLoading(false);
        }
    }, []);

    const DisabledBackground = styled(Box)({
        width: "100%",
        height: "100%",
        position: "fixed",
        background: "#ccc",
        top: 0,
        left: 0,
        opacity: 0.5,
        zIndex: 9998
    });

    return (
        <LoadingContext.Provider value={{ loading, withLoading }}>
            {children}
            {loading && (
                <>
                    <LinearProgress style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 99999 }} />
                    <DisabledBackground />
                </>
            )}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => {
    return useContext(LoadingContext);
};