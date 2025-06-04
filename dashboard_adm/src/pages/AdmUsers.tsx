/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCircleExclamation,
  faLeftLong,
  faPenToSquare,
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
  cargo: string;
  disabled: boolean;
  primeiroPonto: string;
  segundoPonto: string;
  terceiroPonto: string;
  quartoPonto: string;
  equipe_msg: string;
}

export const AdmUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortField, setSortField] = useState<keyof User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newCargo, setNewCargo] = useState("");
  const [newEquipe_msg, setNewEquipe_msg] = useState("");
  const [modalEdit, setModalEdit] = useState(false);
  const [editUserData, setEditUserData] = useState<User | null>(null);
  const [disabledFilter, setDisabledFilter] = useState<null | boolean>(null);

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

  const handleOpenModalEdit = (user: User) => {
    setEditUserData(user);
    setModalEdit(true);
  };

  const handleCloseModalEdit = () => {
    setModalEdit(false);
    setEditUserData(null);
  };

  const handleEditInputChange = (field: keyof User, value: string) => {
    if (editUserData) {
      setEditUserData({ ...editUserData, [field]: value });
    }
  };

  const handleSaveEdit = async () => {
    try {
      if (editUserData) {
        const updatedUser = {
          ...editUserData,
          cargo: newCargo || editUserData.cargo,
          equipe_msg: newEquipe_msg || editUserData.equipe_msg,
        };

        const userRef = doc(db, "usuarios", updatedUser.id);
        await updateDoc(userRef, {
          nome: updatedUser.nome,
          email: updatedUser.email,
          cargo: updatedUser.cargo,
          primeiroPonto: updatedUser.primeiroPonto,
          segundoPonto: updatedUser.segundoPonto,
          terceiroPonto: updatedUser.terceiroPonto,
          quartoPonto: updatedUser.quartoPonto,
          equipe_msg: updatedUser.equipe_msg,
        });

        setUsers((prev) =>
          prev.map((user) => (user.id === updatedUser.id ? updatedUser : user))
        );
        setFilteredUsers((prev) =>
          prev.map((user) => (user.id === updatedUser.id ? updatedUser : user))
        );

        toast.success("Usuário atualizado com sucesso!");
        handleCloseModalEdit();
        setNewCargo("");
        setNewEquipe_msg("");
      } else if (selectedUser) {
        const updatedFields: Partial<User> = {};
        if (newCargo) updatedFields.cargo = newCargo;
        if (newEquipe_msg) updatedFields.equipe_msg = newEquipe_msg;

        if (Object.keys(updatedFields).length > 0) {
          const userRef = doc(db, "usuarios", selectedUser.id);
          await updateDoc(userRef, updatedFields);

          setUsers((prev) =>
            prev.map((user) =>
              user.id === selectedUser.id ? { ...user, ...updatedFields } : user
            )
          );
          setFilteredUsers((prev) =>
            prev.map((user) =>
              user.id === selectedUser.id ? { ...user, ...updatedFields } : user
            )
          );

          toast.success("Usuário atualizado com sucesso!");
          setSelectedUser(null);
          setNewCargo("");
          setNewEquipe_msg("");
        }
      }
    } catch (error: any) {
      console.error("Erro ao salvar as alterações:", error);
      toast.error("Erro ao atualizar usuário!");
    }
  };

  const handleDisableUser = async (userId: string) => {
    try {
      const response = await axios.post(`${backendUrl}/api/disabled-user`, {
        userId,
      });
      if (response.status === 200) {
        console.log("Usuário desativado com sucesso:", response.data);
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

  const sortAndFilterData = (
    field: keyof User,
    currentDisabledFilter: boolean | null = disabledFilter
  ) => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    setSortField(field);

    let usersToSort = [...users];
    if (currentDisabledFilter !== null) {
      usersToSort = usersToSort.filter(
        (user) => user.disabled === currentDisabledFilter
      );
    }

    const sortedUsers = usersToSort.sort((a, b) => {
      const valueA = String(a[field] ?? "");
      const valueB = String(b[field] ?? "");

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
                  onClick={() => sortAndFilterData("nome")}
                >
                  Nome
                  <FontAwesomeIcon icon={faUpDown} data-tooltip-id="icon" />
                  <Tooltip id="icon" content="Ordenar por nome" />
                </th>
                <th className="p-2 text-left">Email</th>
                <th
                  className="p-2 text-left flex items-center gap-2 cursor-pointer"
                  onClick={() => sortAndFilterData("cargo")}
                >
                  Cargo
                  <FontAwesomeIcon icon={faUpDown} data-tooltip-id="icon" />
                </th>
                <th className="p-2 text-left">
                  <select
                    className="bg-white text-black rounded p-1 text-sm"
                    value={
                      disabledFilter === null
                        ? ""
                        : disabledFilter
                        ? "true"
                        : "false"
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      const newFilter = value === "" ? null : value === "true";
                      setDisabledFilter(newFilter);
                      sortAndFilterData(sortField ?? "nome", newFilter); // mantém a ordenação atual
                    }}
                  >
                    <option value="">Todos</option>
                    <option value="false">Ativos</option>
                    <option value="true">Desativados</option>
                  </select>
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
                  <td className="p-2 py-5 capitalize">{user.nome}</td>
                  <td className="p-2 py-5">{user.email}</td>

                  <td className="p-2 py-5 capitalize">{user.cargo}</td>
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
                      onClick={() => handleOpenModalEdit(user)}
                      className="text-yellow-500"
                    >
                      <FontAwesomeIcon
                        icon={faPenToSquare}
                        data-tooltip-id="edit_user"
                      />
                      <Tooltip id="edit_user" content="Editar usuário" />
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
      {modalEdit && editUserData && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-black">
            <h2 className="text-xl font-bold mb-4 text-center">
              Editar Usuário de{" "}
              <span className="capitalize">
                {editUserData.nome.replace(".", " ")}
              </span>
            </h2>

            {/* Grid de Inputs em 3 por linha */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={editUserData.nome}
                  onChange={(e) =>
                    handleEditInputChange("nome", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editUserData.email}
                  onChange={(e) =>
                    handleEditInputChange("email", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo
                </label>
                <select
                  value={newCargo}
                  onChange={(e) => setNewCargo(e.target.value)}
                  className="border border-gray-300 p-2 rounded w-full mb-4"
                >
                  <option value="">{editUserData.cargo}</option>
                  <option value="adm">Admin</option>
                  <option value="vendas">Vendas</option>
                  <option value="monitoria">Monitoria</option>
                  <option value="cobranca">Cobrança</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="marketing">Marketing</option>
                  <option value="posVenda">Pós Venda</option>
                  <option value="Dev">Dev</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primeiro Ponto
                </label>
                <input
                  type="text"
                  value={editUserData.primeiroPonto}
                  onChange={(e) =>
                    handleEditInputChange("primeiroPonto", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Segundo Ponto
                </label>
                <input
                  type="text"
                  value={editUserData.segundoPonto}
                  onChange={(e) =>
                    handleEditInputChange("segundoPonto", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terceiro Ponto
                </label>
                <input
                  type="text"
                  value={editUserData.terceiroPonto}
                  onChange={(e) =>
                    handleEditInputChange("terceiroPonto", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quarto Ponto
                </label>
                <input
                  type="text"
                  value={editUserData.quartoPonto}
                  onChange={(e) =>
                    handleEditInputChange("quartoPonto", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipe
              </label>
              <select
                value={newEquipe_msg}
                onChange={(e) => setNewEquipe_msg(e.target.value)}
                className="border border-gray-300 p-2 rounded w-full mb-4"
              >
                <option value="">{editUserData.equipe_msg}</option>
                <option value="equipe_01">equipe_01</option>
                <option value="equipe_02">equipe_02</option>
                <option value="equipe_03">equipe_03</option>
              </select>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCloseModalEdit}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};
