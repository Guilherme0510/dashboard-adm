/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCircleExclamation,
  faLeftLong,
  faRefresh,
  faRightLong,
  faSearch,
  faUpDown,
} from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

interface User {
  id: string;
  nome: string;
  email: string;
  avatar: string;
  cargo: string;
  disabled: boolean;
}

export const AdmUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [, setSortField] = useState<keyof User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newCargo, setNewCargo] = useState("");

  const backendUrl = import.meta.env.VITE_BACKEND;

  const ItemsPerPage = 10;

  const indexOfLastUser = currentPage * ItemsPerPage;
  const indexOfFirstUser = indexOfLastUser - ItemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const totalPages = Math.ceil(filteredUsers.length / ItemsPerPage);

  const fetchAllInfoUsers = async () => {
    const usersCollection = collection(db, "usuarios");
    const usersSnapshot = await getDocs(usersCollection);
    const allUsers = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
    setUsers(allUsers);
    setFilteredUsers(allUsers);
  };

  const updateCargo = async () => {
    if (selectedUser && newCargo) {
      const userRef = doc(db, "usuarios", selectedUser.id);
      await updateDoc(userRef, { cargo: newCargo });
      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id ? { ...user, cargo: newCargo } : user
        )
      );
      setFilteredUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id ? { ...user, cargo: newCargo } : user
        )
      );
      setSelectedUser(null);
      setNewCargo("");
    }
  };

  const handleDisableUser = async (userId: string) => {
    try {
      const response = await axios.post(`${backendUrl}/api/disabled-user`, {
        userId,
      });

      if (response.status === 200) {
        console.log("Usuário desativado com sucesso:", response.data);

        // Atualiza os usuários no estado
        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, disabled: true } : user
          )
        );
        setFilteredUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, disabled: true } : user
          )
        );
      } else {
        console.error("Erro ao desativar usuário:", response.data.message);
      }

      toast.success("Usuário desativado com sucesso!");
    } catch (error: any) {
      console.error(
        "Erro na solicitação:",
        error.response?.data || error.message
      );
      toast.error("Erro ao desativar usuário!");
    }
  };

  const handleActiveUser = async (userId: string) => {
    try {
      const response = await axios.post(`${backendUrl}/api/active-user`, {
        userId,
      });

      if (response.status === 200) {
        console.log("Usuário ativado com sucesso:", response.data);
        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, disabled: false } : user
          )
        );
        setFilteredUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, disabled: false } : user
          )
        );
      } else {
        console.error("Erro ao ativar usuário:", response.data.message);
      }

      toast.success("Usuário ativado com sucesso!");
    } catch (error: any) {
      console.error(
        "Erro na solicitação:",
        error.response?.data || error.message
      );
      toast.error("Erro ao ativar usuário!");
    }
  };

  const sortData = (field: keyof User) => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    setSortField(field);

    const sortedUsers = [...filteredUsers].sort((a, b) => {
      const valueA = String(a[field] || "");
      const valueB = String(b[field] || "");
      return newOrder === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    });
    setFilteredUsers(sortedUsers);
  };

  const handleSearch = (searchTerm: string) => {
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      setFilteredUsers(
        users.filter((user) => user.nome.toLowerCase().includes(lowercasedTerm))
      );
    } else {
      setFilteredUsers(users); 
    }
  };

  useEffect(() => {
    fetchAllInfoUsers();
  }, []);

  return (
    <div className="h-screen flex flex-col text-white p-6">
      <div className="mb-8 flex gap-10">
        <div>
          <h1 className="text-4xl mb-2">Administrar Usuários</h1>
          <p>Administre os seus usuários</p>
        </div>
        <div className="mt-4 flex items-center relative">
          <input
            type="text"
            placeholder="Pesquisar por nome"
            className="text-black w-full p-2 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => handleSearch(e.target.value)}
            aria-label="Pesquisar por nome"
          />
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3 text-gray-500"
          />
        </div>
      </div>

      <div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#4F87F7]">
                <th
                  className="p-2 text-left flex items-center gap-2 cursor-pointer"
                  onClick={() => sortData("nome")}
                >
                  Nome
                  <FontAwesomeIcon icon={faUpDown} data-tooltip-id="icon" />
                  <Tooltip id="icon" content="Ordenar por nome" />
                </th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Avatar</th>
                <th
                  className="p-2 text-left flex items-center gap-2 cursor-pointer"
                  onClick={() => sortData("cargo")}
                >
                  Cargo
                  <FontAwesomeIcon icon={faUpDown} data-tooltip-id="icon" />
                </th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user) => (
                <tr
                  key={user.id}
                  className={
                    user.disabled
                      ? "bg-slate-200 bg-opacity-40 border-b"
                      : " border-b"
                  }
                >
                  <td className="p-2 capitalize">{user.nome}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="w-12 h-12 object-cover rounded-full"
                    />
                  </td>
                  <td className="p-2 capitalize">{user.cargo}</td>
                  <td className="text-start">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="text-blue-500"
                    >
                      <FontAwesomeIcon
                        icon={faRefresh}
                        data-tooltip-id="troca_cargo"
                      />
                      <Tooltip id="troca_cargo" content="Trocar cargo" />
                    </button>
                  </td>
                  <td className="text-start">
                    <button
                      onClick={() => {
                        if (user.disabled) {
                          handleActiveUser(user.id);
                        } else {
                          handleDisableUser(user.id);
                        }
                      }}
                      className={
                        user.disabled ? "text-red-500" : "text-green-500"
                      }
                    >
                      <FontAwesomeIcon
                        icon={user.disabled ? faCircleExclamation : faCheck}
                        data-tooltip-id={`toggle_usuario-${user.id}`}
                      />
                      <Tooltip
                        id={`toggle_usuario-${user.id}`}
                        content={
                          user.disabled ? "Ativar Usuário" : "Desativar Usuário"
                        }
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center gap-3 items-center mt-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600"
          >
            <FontAwesomeIcon icon={faLeftLong} />
          </button>
          <span>
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="w-8 h-8 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600"
          >
            <FontAwesomeIcon icon={faRightLong} />
          </button>
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white text-black p-6 rounded shadow-lg">
            <h2 className="text-xl mb-4">
              Trocar cargo de{" "}
              <span className="capitalize">
                {selectedUser.nome.replace(/\./g, " ")}
              </span>
            </h2>
            <select
              value={newCargo}
              onChange={(e) => setNewCargo(e.target.value)}
              className="border border-gray-300 p-2 rounded w-full mb-4"
            >
              <option value="">Selecione um novo cargo</option>
              <option value="adm">Admin</option>
              <option value="vendas">Vendas</option>
              <option value="monitoria">Monitoria</option>
              <option value="cobranca">Cobrança</option>
              <option value="financeiro">Financeiro</option>
              <option value="marketing">Marketing</option>
            </select>
            <div className="flex gap-4">
              <button
                onClick={updateCargo}
                className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                Salvar
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="bg-gray-300 p-2 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};
