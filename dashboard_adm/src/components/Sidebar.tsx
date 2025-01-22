import {
  faChartBar,
  faChartLine,
  faChartPie,
  faClock,
  faFileAlt,
  faGlobe,
  faQuestionCircle,
  faTachometerAlt,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { signOut } from "firebase/auth";
import { NavLink, useNavigate } from "react-router-dom";
import { auth } from "../config/firebaseConfig";
import { useAuth } from "../context/Context";


export const Sidebar = () => {
  const { nome, avatar, cargo } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Deslogado com sucesso!");
      navigate("/");
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };
  return (
    <div className="flex flex-col items-center text-white h-screen">
      <div className="mt-5 flex flex-col items-center text-center">
        <img
           src={avatar || "https://placehold.co/400"}
          alt="Imagem Fictícia"
          className="w-[120px] h-[120px] rounded-full"
        />
        <div className="mt-4">
          <h2 className="text-xl">{nome}</h2>
          <h2 className="text-md">{cargo}</h2>
        </div>
      </div>

      <div className="space-y-2 gap-5 flex flex-col">
        <NavLink
          className={({ isActive }) =>
            `flex items-center mt-5 gap-3 px-3 py-2 transition-all duration-300 ease-in-out transform ${
              isActive
                ? "text-[#4F87F7] scale-110 border-l-4 border-[#4F87F7] shadow-lg"
                : "text-gray-300 hover:bg-gray-600 hover:text-white hover:scale-110 hover:border-l-4 hover:border-[#4F87F7] hover:shadow-lg"
            }`
          }
          to={"/home"}
        >
          <FontAwesomeIcon icon={faTachometerAlt} className="w-5 h-5" />
          <p className="hidden md:block">Dashboard</p>
        </NavLink>

        <div className="flex flex-col gap-1">
          <p className="font-semibold text-lg">Dados</p>
          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 transition-all duration-200 ease-in-out ${
                isActive
                  ? "text-[#4F87F7] scale-110 border-l-4 border-[#4F87F7] shadow-lg"
                  : "text-gray-300 hover:bg-gray-600 hover:text-white hover:scale-110 hover:border-l-4 hover:border-[#4F87F7] hover:shadow-lg"
              }`
            }
            to="/adm-users"
          >
            <FontAwesomeIcon icon={faUsers} className="w-5 h-5" />
            <span>Administrar Usuários</span>
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 transition-all duration-200 ease-in-out ${
                isActive
                  ? "text-[#4F87F7] scale-110 border-l-4 border-[#4F87F7] shadow-lg"
                  : "text-gray-300 hover:bg-gray-600 hover:text-white hover:scale-110 hover:border-l-4 hover:border-[#4F87F7] hover:shadow-lg"
              }`
            }
            to="/info-users"
          >
            <FontAwesomeIcon icon={faFileAlt} className="w-5 h-5" />
            <span>Informações Funcionários</span>
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 transition-all duration-200 ease-in-out ${
                isActive
                  ? "text-[#4F87F7] scale-110 border-l-4 border-[#4F87F7] shadow-lg"
                  : "text-gray-300 hover:bg-gray-600 hover:text-white hover:scale-110 hover:border-l-4 hover:border-[#4F87F7] hover:shadow-lg"
              }`
            }
            to="/balance-users"
          >
            <FontAwesomeIcon icon={faFileAlt} className="w-5 h-5" />
            <span>Balanço Usuários</span>
          </NavLink>
        </div>

        <div className="flex flex-col gap-1">
          <p className="font-semibold text-lg">Páginas</p>
          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 transition-all duration-200 ease-in-out ${
                isActive
                  ? "text-[#4F87F7] scale-110 border-l-4 border-[#4F87F7] shadow-lg"
                  : "text-gray-300 hover:bg-gray-600 hover:text-white hover:scale-110 hover:border-l-4 hover:border-[#4F87F7] hover:shadow-lg"
              }`
            }
            to="/create-user"
          >
            <FontAwesomeIcon icon={faUsers} className="w-5 h-5" />
            <span>Criar usuário</span>
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 transition-all duration-200 ease-in-out ${
                isActive
                  ? "text-[#4F87F7] scale-110 border-l-4 border-[#4F87F7] shadow-lg"
                  : "text-gray-300 hover:bg-gray-600 hover:text-white hover:scale-110 hover:border-l-4 hover:border-[#4F87F7] hover:shadow-lg"
              }`
            }
            to="/ponto"
          >
            <FontAwesomeIcon icon={faClock} className="w-5 h-5" />
            <span>Ponto Maps</span>
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 transition-all duration-200 ease-in-out ${
                isActive
                  ? "text-[#4F87F7] scale-110 border-l-4 border-[#4F87F7] shadow-lg"
                  : "text-gray-300 hover:bg-gray-600 hover:text-white hover:scale-110 hover:border-l-4 hover:border-[#4F87F7] hover:shadow-lg"
              }`
            }
            to="/listaponto"
          >
            <FontAwesomeIcon icon={faClock} className="w-5 h-5" />
            <span>Relatório de Ponto</span>
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 transition-all duration-200 ease-in-out ${
                isActive
                  ? "text-[#4F87F7] scale-110 border-l-4 border-[#4F87F7] shadow-lg"
                  : "text-gray-300 hover:bg-gray-600 hover:text-white hover:scale-110 hover:border-l-4 hover:border-[#4F87F7] hover:shadow-lg"
              }`
            }
            to="/chamados"
          >
            <FontAwesomeIcon icon={faQuestionCircle} className="w-5 h-5" />
            <span>Chamados</span>
          </NavLink>
        </div>

        <div className="flex flex-col gap-1">
          <p className="font-semibold text-lg">Gráficos</p>
          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 transition-all duration-200 ease-in-out ${
                isActive
                  ? "text-[#4F87F7] scale-110 border-l-4 border-[#4F87F7] shadow-lg"
                  : "text-gray-300 hover:bg-gray-600 hover:text-white hover:scale-110 hover:border-l-4 hover:border-[#4F87F7] hover:shadow-lg"
              }`
            }
            to="/bar-chart"
          >
            <FontAwesomeIcon icon={faChartBar} className="w-5 h-5" />
            <span>Gráfico de Barra</span>
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 transition-all duration-200 ease-in-out ${
                isActive
                  ? "text-[#4F87F7] scale-110 border-l-4 border-[#4F87F7] shadow-lg"
                  : "text-gray-300 hover:bg-gray-600 hover:text-white hover:scale-110 hover:border-l-4 hover:border-[#4F87F7] hover:shadow-lg"
              }`
            }
            to="/pie-chart"
          >
            <FontAwesomeIcon icon={faChartPie} className="w-5 h-5" />
            <span>Gráfico de Pizza</span>
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 transition-all duration-200 ease-in-out ${
                isActive
                  ? "text-[#4F87F7] scale-110 border-l-4 border-[#4F87F7] shadow-lg"
                  : "text-gray-300 hover:bg-gray-600 hover:text-white hover:scale-110 hover:border-l-4 hover:border-[#4F87F7] hover:shadow-lg"
              }`
            }
            to="/line-chart"
          >
            <FontAwesomeIcon icon={faChartLine} className="w-5 h-5" />
            <span>Gráfico de Linha</span>
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 transition-all duration-200 ease-in-out ${
                isActive
                  ? "text-[#4F87F7] scale-110 border-l-4 border-[#4F87F7] shadow-lg"
                  : "text-gray-300 hover:bg-gray-600 hover:text-white hover:scale-110 hover:border-l-4 hover:border-[#4F87F7] hover:shadow-lg"
              }`
            }
            to="/geography-chart"
          >
            <FontAwesomeIcon icon={faGlobe} className="w-5 h-5" />
            <span>Gráfico Geográfico</span>
          </NavLink>
        </div>
        <div className="flex items-center justify-center">
          <button
            className="bg-red-500 w-1/2 py-2 rounded-xl hover:bg-red-700 transition-all duration-200 hover:scale-105"
            onClick={handleLogout}
          >
            Deslogar
          </button>
        </div>
      </div>
    </div>
  );
};
