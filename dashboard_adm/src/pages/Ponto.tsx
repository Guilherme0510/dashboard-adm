/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { FaArrowRight } from "react-icons/fa";
import { useAuth } from "../context/Context";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { Value } from "react-calendar/dist/esm/shared/types.js";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import { Loader2 } from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

export const Ponto = () => {
  const {
    nome,
    avatar,
    primeiroPonto,
    segundoPonto,
    terceiroPonto,
    quartoPonto,
  } = useAuth();

  const [horaAtual, setHoraAtual] = useState<string>("");
  const [registrosPonto, setRegistrosPonto] = useState<string[]>([]);
  const [faltas, setFaltas] = useState<number>(0);
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [cliquesPonto, setCliquesPonto] = useState<number>(0);
  const [cargaHoraria, setCargaHoraria] = useState<string>("");
  const [intervaloCliques, setIntervaloCliques] = useState<string>("");
  const [horasExtras, setHorasExtras] = useState<string>("");
  const [atrasos, setAtrasos] = useState<string>("");
  const [, setDadosDoDia] = useState<any | null>(null);
  const [botaoDesabilitado, setBotaoDesabilitado] = useState(false);
  const [mostrarPopup, setMostrarPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const [tempoRestante, setTempoRestante] = useState(5);
  const TEMPO_COOLDOWN = 5;

  const MAX_CLIQUES = 4;

  const horarios = [
    { motivo: "1", horario: `${primeiroPonto}` },
    { motivo: "2", horario: `${segundoPonto}` },
    { motivo: "3", horario: `${terceiroPonto}` },
    { motivo: "4", horario: `${quartoPonto}` },
  ];

  const parseTimeToMinutes = (time: string) => {
    const [hours, minutes] = time.split("h").map((part) => part.trim());
    return parseInt(hours) * 60 + parseInt(minutes);
  };

  const formatTime = (hours: number, minutes: number) => {
    const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${formattedHours}:${formattedMinutes}`;
  };

  useEffect(() => {
    const atualizarHora = () => {
      const agora = new Date();
      const hora = agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setHoraAtual(hora);
    };

    atualizarHora();
    const intervalo = setInterval(atualizarHora, 1000);

    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (primeiroPonto && quartoPonto) {
      const calcularIntervalo = () => {
        const [hora1, minuto1] = primeiroPonto.split(":").map(Number);
        const [hora2, minuto2] = quartoPonto.split(":").map(Number);

        const inicio = hora1 * 60 + minuto1;
        const fim = hora2 * 60 + minuto2;

        const duracao = fim - inicio;

        const horas = Math.floor(duracao / 60);
        const minutos = duracao % 60;

        setCargaHoraria(`${horas}h ${minutos}m`);
      };

      calcularIntervalo();
    }
  }, [primeiroPonto, quartoPonto]);

  useEffect(() => {
    if (registrosPonto.length === MAX_CLIQUES) {
      const calcularIntervaloCliques = () => {
        const [hora1, minuto1] = registrosPonto[0].split(":").map(Number);
        const [hora2, minuto2] = registrosPonto[registrosPonto.length - 1]
          .split(":")
          .map(Number);

        const inicio = hora1 * 60 + minuto1;
        const fim = hora2 * 60 + minuto2;

        const duracao = fim - inicio;

        const horas = Math.floor(duracao / 60);
        const minutos = duracao % 60;

        setIntervaloCliques(`${horas}h ${minutos}m`);
      };

      calcularIntervaloCliques();
    }
  }, [registrosPonto]);

  useEffect(() => {
    if (intervaloCliques && cargaHoraria) {
      const intervaloCliquesMinutos = parseTimeToMinutes(intervaloCliques);
      const cargaHorariaMinutos = parseTimeToMinutes(cargaHoraria);

      if (intervaloCliquesMinutos > cargaHorariaMinutos) {
        const horasExtrasMinutos =
          intervaloCliquesMinutos - cargaHorariaMinutos;
        const horas = Math.floor(horasExtrasMinutos / 60);
        const minutos = horasExtrasMinutos % 60;
        setHorasExtras(formatTime(horas, minutos));
        setAtrasos("");
      } else {
        const atrasosMinutos = cargaHorariaMinutos - intervaloCliquesMinutos;
        const horas = Math.floor(atrasosMinutos / 60);
        const minutos = atrasosMinutos % 60;
        setAtrasos(formatTime(horas, minutos));
        setHorasExtras("");
      }
    }
  }, [intervaloCliques, cargaHoraria]);

  const baterPonto = async () => {
    if (botaoDesabilitado) return;

    setBotaoDesabilitado(true);
    setTempoRestante(TEMPO_COOLDOWN);

    if (cliquesPonto < MAX_CLIQUES) {
      const novosRegistros = [...registrosPonto, horaAtual];
      setRegistrosPonto(novosRegistros);
      setCliquesPonto(cliquesPonto + 1);

      const diasDaSemana = [
        "Domingo",
        "Segunda-feira",
        "Terça-feira",
        "Quarta-feira",
        "Quinta-feira",
        "Sexta-feira",
        "Sábado",
      ];
      const diaSemana = diasDaSemana[dataSelecionada.getDay()];

      const dataFormatada = Timestamp.fromDate(dataSelecionada);
      const dataId = dataSelecionada.toISOString().split("T")[0];
      const nomeUsuario = nome.replace(/\s+/g, "_");
      const documentoId = `${nomeUsuario}-${dataId}`;
      const pontoRef = doc(db, "pontos", documentoId);

      const docSnapshot = await getDoc(pontoRef);
      const dadosAtuais = docSnapshot.exists() ? docSnapshot.data() : {};

      const pontoData = {
        dia: dataFormatada,
        diaSemana: diaSemana,
        nome: nome,
        pontoEntrada:
          dadosAtuais.pontoEntrada || (cliquesPonto === 0 ? horaAtual : null),
        pontoAlmoco:
          dadosAtuais.pontoAlmoco || (cliquesPonto === 1 ? horaAtual : null),
        pontoVolta:
          dadosAtuais.pontoVolta || (cliquesPonto === 2 ? horaAtual : null),
        pontoSaida:
          dadosAtuais.pontoSaida || (cliquesPonto === 3 ? horaAtual : null),
        horasExtras: dadosAtuais.horasExtras || horasExtras || "00:00",
        atrasos: dadosAtuais.atrasos || atrasos || "00:00",
      };

      await setDoc(pontoRef, pontoData, { merge: true });

      console.log("Ponto registrado/atualizado com sucesso!");
    } else {
      console.log("Máximo de pontos atingido para hoje.");
    }
  };

  const salvarOuAtualizarPontoNoFirebase = async (pontoData: any) => {
    try {
      const dataFormatada = dataSelecionada.toISOString().split("T")[0];
      const nomeUsuario = nome.replace(/\s+/g, "_");
      const documentoId = `${nomeUsuario}-${dataFormatada}`;

      const pontoRef = doc(db, "pontos", documentoId);

      pontoData.horasExtras = horasExtras || "00:00";
      pontoData.atrasos = atrasos || "00:00";

      await setDoc(pontoRef, pontoData, { merge: true });
      console.log("Ponto registrado/atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar ou atualizar o ponto:", error);
    }
  };

  useEffect(() => {
    const carregarPontos = async () => {
      setLoading(true);
      const dataId = dataSelecionada.toISOString().split("T")[0];
      const nomeUsuario = nome.replace(/\s+/g, "_");
      const documentoId = `${nomeUsuario}-${dataId}`;
      const pontoRef = doc(db, "pontos", documentoId);

      const docSnapshot = await getDoc(pontoRef);

      if (docSnapshot.exists()) {
        const dados = docSnapshot.data();

        const pontosExistentes = [
          dados.pontoEntrada,
          dados.pontoAlmoco,
          dados.pontoVolta,
          dados.pontoSaida,
        ].filter(Boolean);

        setRegistrosPonto(pontosExistentes);
        setCliquesPonto(pontosExistentes.length);
      }
      setLoading(false);
    };

    carregarPontos();
  }, [dataSelecionada, nome]);

  useEffect(() => {
    setBotaoDesabilitado(false);
    setCliquesPonto(0);
    setRegistrosPonto([]);
    setDadosDoDia(null);
  }, [dataSelecionada]);

  useEffect(() => {
    if (atrasos) {
      const pontoData = {
        dia: dataSelecionada.toLocaleDateString(),
        nome: nome,
        atrasos: atrasos,
      };
      salvarOuAtualizarPontoNoFirebase(pontoData);
    }
  }, [atrasos, dataSelecionada, nome, salvarOuAtualizarPontoNoFirebase]);

  useEffect(() => {
    if (horasExtras) {
      const pontoData = {
        dia: dataSelecionada.toLocaleDateString(),
        nome: nome,
        horasExtras: horasExtras,
      };
      salvarOuAtualizarPontoNoFirebase(pontoData);
    }
  }, [horasExtras, dataSelecionada, nome, salvarOuAtualizarPontoNoFirebase]);

  const data = {
    labels: ["Horas extras", "Atrasos"],
    datasets: [
      {
        data: [
          horasExtras !== "" ? parseTimeToMinutes(horasExtras) : 0,
          atrasos !== "" ? parseTimeToMinutes(atrasos) : 0,
        ],
        backgroundColor: ["#36A2EB", "#FF6384"],
        hoverBackgroundColor: ["#36A2EB", "#FF6384"],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "white",
        },
      },
      tooltip: {
        bodyColor: "white",
      },
    },
  };

  const onChange = (value: Value) => {
    if (!value) return; // Ignora null

    const novaData = Array.isArray(value) ? value[0] : value; // Pega a primeira data caso seja um intervalo

    if (novaData instanceof Date) {
      setDataSelecionada(novaData);
    }
  };

  useEffect(() => {
    if (registrosPonto.length === MAX_CLIQUES) {
      setBotaoDesabilitado(true);
      setMostrarPopup(true);
    }
  }, [registrosPonto]);

  const handleClosePopup = () => {
    setMostrarPopup(false);
    navigate("/");
  };

  useEffect(() => {
    if (botaoDesabilitado) {
      const intervalo = setInterval(() => {
        setTempoRestante((prev) => {
          if (prev <= 1) {
            clearInterval(intervalo);
            setBotaoDesabilitado(false);
            return 0;
          }
          return prev - 1;
        });
      }, 60 * 1000); // Atualiza a cada 1 minuto

      return () => clearInterval(intervalo);
    }
  }, [botaoDesabilitado]);

  useEffect(() => {
    const carregarFaltas = async () => {
      try {
        const nomeUsuario = nome; // Nome do usuário logado
        const faltasQuery = query(
          collection(db, "pontos"),
          where("nome", "==", nomeUsuario), // Verifica pelo nome do usuário logado
          where("falta", "==", true) // Verifica se falta é true
        );

        const querySnapshot = await getDocs(faltasQuery);

        setFaltas(querySnapshot.size);
      } catch (error) {
        console.error("Erro ao carregar as faltas:", error);
      }
    };

    carregarFaltas();
  }, [nome]);

  return (
    <div className="flex flex-col text-white p-6">
      <div className="mb-8">
        <h1 className="text-4xl mb-2">Ponto Maps</h1>
        <p>Bata seu ponto</p>
      </div>
      <div className="flex flex-wrap gap-6">
        <div className="flex-grow min-w-[300px] max-w-lg bg-[#35486E] p-6 gap-2 flex flex-col items-center justify-center rounded-lg shadow-lg">
          <div className="mb-4 text-xl font-bold">{horaAtual}</div>
          <div className="w-[148px] h-[148px] bg-white rounded-full overflow-hidden flex items-center justify-center">
            <img
              src={avatar || "https://placehold.co/400"}
              alt="Imagem de perfil"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-xl capitalize mt-2">{nome.replace(".", " ")}</h2>
          <button
            className={`mt-4 px-6 py-2 font-bold rounded-lg shadow flex items-center justify-center gap-2 ${
              botaoDesabilitado || loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
            onClick={baterPonto}
            disabled={botaoDesabilitado || loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
              </>
            ) : botaoDesabilitado ? (
              `Aguarde ${tempoRestante}m`
            ) : (
              "Bater o Ponto"
            )}
          </button>
        </div>

        <div className="flex-grow min-w-[300px] max-w-lg bg-[#35486E] p-6 gap-2 flex flex-col items-start justify-start rounded-lg shadow-lg">
          <h3>Carga Horária Estimada: {cargaHoraria} por dia.</h3>
          <ul className="text-lg">
            {horarios.map((item, index) => (
              <li key={index} className="flex justify-between w-full">
                <span className="font-semibold">{item.motivo}:</span>
                <span>{item.horario}</span>
              </li>
            ))}
          </ul>
          <ul className="text-lg">
            {loading ? (
              <li className="flex justify-center w-full py-2">
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              </li>
            ) : registrosPonto.length > 0 ? (
              registrosPonto.map((horario, index) => (
                <li key={index} className="flex justify-between w-full">
                  <span className="font-semibold">Ponto {index + 1}:</span>
                  <span>{horario}</span>
                </li>
              ))
            ) : (
              <li className="text-center w-full py-2 text-gray-300">
                Nenhum ponto registrado
              </li>
            )}
          </ul>
        </div>

        <div className="flex-grow min-w-[300px] max-w-lg bg-[#35486E] p-6 gap-2 flex flex-col items-center justify-center rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Horas trabalhadas</h2>
          <h3>Horas extras: {horasExtras}</h3>
          <h3>Atrasos: {atrasos}</h3>
          <div className="w-full h-[250px]">
            <Pie data={data} options={options} />
          </div>
        </div>

        <div className="flex-grow min-w-[300px] max-w-lg bg-[#35486E] p-6 gap-2 flex flex-col items-center justify-center rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Faltas</h2>
          <div className="text-xl mb-4">
            <strong>Quantidade de faltas:</strong> {faltas}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 mt-6">
        <div className="flex-grow min-w-[300px] max-w-lg bg-[#35486E] p-6 gap-2 flex flex-col items-center justify-center rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Calendário</h2>
          <div className="w-full">
            <Calendar
              onChange={onChange}
              value={dataSelecionada}
              className="w-full h-full rounded-lg border border-gray-300 text-black"
            />
          </div>
        </div>

        <div className="flex-grow min-w-[300px] max-w-lg bg-[#35486E] p-6 gap-2 flex flex-col items-center justify-center rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Relatório de Pontos</h2>
          <Link
            to="/listaponto"
            className="px-6 py-2 bg-blue-500 text-white font-bold rounded-lg shadow hover:bg-blue-600"
          >
            <FaArrowRight />
          </Link>
        </div>
      </div>
      {mostrarPopup && (
        <Popup
          open={mostrarPopup}
          position="top center"
          closeOnDocumentClick
          onClose={() => setMostrarPopup(false)}
          contentStyle={{
            borderRadius: "10px",
            padding: "20px",
            width: "300px",
            textAlign: "center",
            backgroundColor: "#fff",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
          }}
        >
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800">
              Parabéns! Você finalizou seu turno. 🎉
            </h3>
            <p className="text-gray-600 mt-2">
              Aproveite seu descanso e volte renovado para o próximo dia! 🛌💤
            </p>
            <button
              onClick={handleClosePopup}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Fechar
            </button>
          </div>
        </Popup>
      )}
    </div>
  );
};
