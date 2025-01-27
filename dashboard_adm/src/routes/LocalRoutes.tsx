import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Login } from "../pages/Login";
import ProtectedLayout from "./ProtectedLayout";
import { Home } from "../pages/Home";
import { Sidebar } from "../components/Sidebar";
import { AdmUsers } from "../pages/AdmUsers";
import { CreateUser } from "../pages/CreateUser";
import { GraficoLinha } from "../pages/GraficoLinha";
import { GraficoGeografico } from "../pages/GraficoGeografico";
import { AuthProvider } from "../context/Context"; 
import { Ponto } from "../pages/Ponto";
import { ListaPonto } from "../pages/ListaPonto";
import { Faltas } from "../pages/Faltas";

const Layout: React.FC = () => {
  return (
    <div className="flex">
      <div className="md:w-1/6 w-full bg-[#35486E]">
        <Sidebar />
      </div>
      <div className="flex-1 w-full px-10 bg-[#1F2A40] text-white">
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/adm-users" element={<AdmUsers />} />
          <Route path="/ponto" element={<Ponto />} />
          <Route path="/listaponto" element={<ListaPonto />} />
          <Route path="/create-user" element={<CreateUser />} />
          <Route path="/line-chart" element={<GraficoLinha />} />
          <Route path="/geography-chart" element={<GraficoGeografico />} />
          <Route path="/faltas" element={<Faltas />} />
        </Routes>
      </div>
    </div>
  );
};

export const LocalRoutes: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/*" element={<Layout />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};
