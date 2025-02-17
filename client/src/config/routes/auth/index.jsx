import React from "react";
import { Route, Routes } from "react-router-dom";
import LoginPage from "../../../pages/auth/login";
import ProfilePage from "../../../pages/auth/profile";
import Unauthorized from "../../../pages/auth/unauthorized";

export default function AuthRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />}></Route>
            <Route path="/profile" element={<ProfilePage />}></Route>
            <Route path="/unauthorized" element={<Unauthorized />}></Route>
        </Routes>
    )
}
