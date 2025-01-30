import { collection, getDocs, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../config/firebaseConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faChartLine,
  faRefresh,
} from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";
import { GeographicMap } from "../components/GeographicMap";
import ResponsiveLineChart from "../components/ResponsiveLine";

interface Venda {
  id: string;
  cnpj: string;
  cpf: string;
  responsavel: string;
  email1: string;
  email2: string;
  operador: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  dataVencimento: string;
  contrato: string;
  createdBy: string;
  setor: string;
}

interface Marketing {
  id: string;
  cnpj: string;
  cpf: string;
  responsavel: string;
  email1: string;
  email2: string;
  operador: string;
  data: string;
  dataVencimento: string;
  contrato: string;
  nomeMonitor: string;
  monitoriaConcluidaYes: boolean;
  servicosConcluidos: boolean;
  encaminharCliente: string;
  rePagamento: string;
}

export const Home = () => {
  const [totalVendas, setTotalVendas] = useState(0);
  const [vendasPorMes, setVendasPorMes] = useState<{ [mes: string]: number }>(
    {}
  );
  const [topOperadores, setTopOperadores] = useState<[string, number][]>([]);
  const [totalVendasPagos, setTotalVendasPagos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendas = async () => {
    try {
      setLoading(true);

      const vendasCollection = collection(db, "vendas");
      const vendasSnapshot = await getDocs(vendasCollection);

      const vendasList = vendasSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Venda[];

      setTotalVendas(vendasList.length);

      const vendasPorMesTemp: { [mes: string]: number } = {};

      const hoje = new Date();
      const anoAtual = hoje.getFullYear();
      const mesAtual = hoje.getMonth();

      const mesesConsiderados = Array.from({ length: 3 }, (_, i) => {
        const data = new Date(anoAtual, mesAtual - i, 1);
        const mes = (data.getMonth() + 1).toString().padStart(2, "0");
        return `${data.getFullYear()}-${mes}`;
      });

      vendasList.forEach((venda) => {
        if (venda.data) {
          const dataVenda =
            venda.data instanceof Timestamp
              ? venda.data.toDate()
              : new Date(venda.data);

          if (dataVenda) {
            const mesAno = `${dataVenda.getFullYear()}-${(
              dataVenda.getMonth() + 1
            )
              .toString()
              .padStart(2, "0")}`;
            if (mesesConsiderados.includes(mesAno)) {
              vendasPorMesTemp[mesAno] = (vendasPorMesTemp[mesAno] || 0) + 1;
            }
          }
        }
      });

      setVendasPorMes(vendasPorMesTemp);
    } catch (error) {
      setError("Erro ao buscar vendas");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendasPagas = async () => {
    try {
      setLoading(true);

      const financeiroCollection = collection(db, "financeiros");
      const financeiroSnapshot = await getDocs(financeiroCollection);

      const vendasPagosList = financeiroSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Marketing[];

      const totalPagos = vendasPagosList.filter(
        (financeiro) => financeiro.rePagamento === "sim"
      ).length;

      setTotalVendasPagos(totalPagos);
    } catch (error) {
      setError("Erro ao buscar vendas pagas");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatarMes = (mesAno: string) => {
    const meses = [
      "Jan -  ",
      "Fev - ",
      "Mar - ",
      "Abr - ",
      "Mai - ",
      "Jun - ",
      "Jul - ",
      "Ago - ",
      "Set - ",
      "Out - ",
      "Nov - ",
      "Dez - ",
    ];

    const [ano, mes] = mesAno.split("-");
    const mesNome = meses[parseInt(mes, 10) - 1];

    return `${mesNome} ${ano}`;
  };

  const fetchTop3OperadoresDoDia = async () => {
    try {
      setLoading(true);

      const vendasCollection = collection(db, "vendas");
      const vendasSnapshot = await getDocs(vendasCollection);

      const vendasList = vendasSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Venda[];

      const hoje = new Date();
      const inicioDoDia = new Date(hoje.setHours(0, 0, 0, 0));
      const fimDoDia = new Date(hoje.setHours(23, 59, 59, 999));

      const vendasDoDia = vendasList.filter((venda) => {
        if (venda.data) {
          let dataVenda: Date;
          if (typeof venda.data === "string") {
            const [year, month, day] = venda.data.split("-");
            dataVenda = new Date(`${year}-${month}-${day}T00:00:00`);
          } else if (venda.data instanceof Timestamp) {
            dataVenda = venda.data.toDate();
          } else {
            return false;
          }
          const vendaDia = new Date(dataVenda.setHours(0, 0, 0, 0));
          const inicioDia = new Date(inicioDoDia.setHours(0, 0, 0, 0));
          const fimDia = new Date(fimDoDia.setHours(23, 59, 59, 999));

          return vendaDia >= inicioDia && vendaDia <= fimDia;
        }
        return false;
      });
      const vendasPorOperador: { [operador: string]: number } = {};

      vendasDoDia.forEach((venda) => {
        if (venda.operador) {
          vendasPorOperador[venda.operador] =
            (vendasPorOperador[venda.operador] || 0) + 1;
        }
      });
      const topOperadores = Object.entries(vendasPorOperador)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      setTopOperadores(topOperadores);
    } catch (error) {
      setError("Erro ao buscar os melhores operadores do dia");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendas();
    fetchVendasPagas();
    fetchTop3OperadoresDoDia();
  }, []);

  return (
    <div className="h-screen flex flex-col text-white p-6">
      <div className="mb-8">
        <h1 className="text-4xl mb-2">Dashboard</h1>
        <p>Bem-vindo ao seu dashboard</p>
      </div>
      <div className="flex justify-between gap-6">
        <div className="w-[300px] h-[150px] bg-[#35486E] p-10 gap-2 flex flex-col items-center justify-center rounded-lg shadow-lg">
          <FontAwesomeIcon
            icon={faChartLine}
            className="text-yellow-400 text-4xl"
          />
          <div className="text-center">
            <h2 className="text-xl">
              {loading ? "Carregando..." : `${totalVendas}`}
            </h2>
            <h2 className="text-[#4F87F7]">Total Vendas</h2>
            {error && <p className="text-red-500">{error}</p>}
          </div>
        </div>
        <div className="w-[300px] h-[150px] bg-[#35486E] p-10 gap-2 flex flex-col items-center justify-center rounded-lg shadow-lg">
          <FontAwesomeIcon
            icon={faCalendarCheck}
            className="text-green-400 text-4xl"
          />
          <div className="text-center">
            <h2 className="text-xl">
              {loading ? "Carregando..." : `${totalVendasPagos}`}
            </h2>
            <h2 className="text-[#4F87F7]">Vendas Pagas</h2>
            {error && <p className="text-red-500">{error}</p>}
          </div>
        </div>
        <div className="w-[300px] h-[150px] bg-[#35486E] px-10 py-2 gap-2 flex flex-col rounded-lg shadow-lg">
          <h2 className="text-xl mb-2">Vendas por Mês:</h2>
          {loading ? (
            <p>Carregando...</p>
          ) : (
            <ul>
              {Object.entries(vendasPorMes).map(([mes, total]) => (
                <li
                  key={mes}
                  className={`flex items-center justify-between ${
                    total > 200 ? "text-green-500" : "text-gray-400"
                  }`}
                >
                  <span className="font-semibold">{formatarMes(mes)}</span>
                  <span>{total} vendas</span>
                  {total > 200 ? (
                    <FontAwesomeIcon
                      icon={faChartLine}
                      className="text-green-500 text-lg"
                    />
                  ) : (
                    <FontAwesomeIcon
                      icon={faChartLine}
                      className="text-gray-400 text-lg"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
          {error && <p className="text-red-500">{error}</p>}
        </div>
        <div className="w-[300px] h-[150px] bg-[#35486E] px-7 py-2 gap-2 flex flex-col rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-white">Top Operadores:</h2>

          {loading ? (
            <p className="text-white">Carregando...</p>
          ) : (
            <ul className="text-white text-base">
              {topOperadores.map(([operador, vendas], index) => (
                <li
                  key={index}
                  className={`flex justify-between ${
                    index === 0
                      ? "text-yellow-400"
                      : index === 1
                      ? "text-blue-400"
                      : index === 2
                      ? "text-green-400"
                      : ""
                  }`}
                >
                  <span>
                    {index + 1}.{" "}
                    <span className="capitalize">
                      {operador.replace(".", " ")}
                    </span>
                  </span>
                  <span>{vendas} vendas</span>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      </div>
      <div className="flex space-x-4">
        <div className="flex-1">
          <GeographicMap
            showTopStatesLegend={false}
            mapConfig={{
              scale: 350,
              center: [-50, -20], 
              width: 400,
              height: 350,
            }}
          />
        </div>
        <div className="flex-1">
          <ResponsiveLineChart height={400} width={700} />
        </div>
      </div>
      <div className="fixed z-10 bottom-6 right-6">
        <button
          onClick={() => {
            fetchVendas();
            fetchVendasPagas();
          }}
          data-tooltip-id="refresh"
          className="group bg-[#4F87F7] text-white py-2 px-4 rounded-lg shadow-lg hover:bg-[#3b70a1] transition duration-300"
        >
          <Tooltip id="refresh" content="Atualizar dados" />
          <FontAwesomeIcon
            icon={faRefresh}
            className="transition-transform duration-300 group-hover:rotate-180"
          />
        </button>
      </div>
    </div>
  );
};
