import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Login } from "../pages/Login";
import ProtectedLayout from "./ProtectedLayout";
import { Home } from "../pages/Home";
import { Sidebar } from "../components/Sidebar";
import  { AdmUsers } from "../pages/AdmUsers";
import { CreateUser } from "../pages/CreateUser";
import { GraficoLinha } from "../pages/GraficoLinha";
import { GraficoGeografico } from "../pages/GraficoGeografico";

const Layout: React.FC = () => {
  const location = useLocation(); 

  return (
    <div className="flex">
      {location.pathname !== "/" && (
        <div className="md:w-1/6 w-full  bg-[#35486E]">
          <Sidebar />
        </div>
      )}

      <div className="flex-1 h-screen w-full px-10 bg-[#1F2A40] text-white">
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/adm-users" element={<AdmUsers />} />
          <Route path="/create-user" element={<CreateUser />} />
          <Route path="/line-chart" element={<GraficoLinha />} />
          <Route path="/geography-chart" element={<GraficoGeografico />} />
        </Routes>
      </div>
    </div>
  );
};

export const LocalRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/*" element={<Layout />} />
        </Route>
      </Routes>
    </Router>
  );
};
