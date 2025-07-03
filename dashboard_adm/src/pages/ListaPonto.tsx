/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";
import { utils } from "xlsx";
import {
  collection,
  // deleteDoc,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { Link } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { writeFile } from "xlsx-js-style";
import { EditPonto } from "../components/EditPonto";

interface Ponto {
  id: null | undefined;
  nome: string;
  dia: Timestamp;
  diaSemana: string;
  pontoEntrada: string;
  pontoAlmoco: string;
  pontoVolta: string;
  pontoSaida: string;
  horasExtras: string;
  atrasos: string;
  falta: boolean;
  atestado: string;
}

interface DadosFormatados {
  Nome: string;
  Data: string;
  "Dia da Semana": string;
  "Ponto Entrada": string;
  "Ponto Almoço": string;
  "Ponto Volta": string;
  "Ponto Saída": string;
  "Horas Extras": string;
  Atrasos: string;
  Falta: string;
  Atestado: string | { t: string; v: string; l: { Target: string } };
}

interface ResumoMensal {
  Nome: string;
  "Total de Dias Trabalhados": number;
  "Total de Atrasos (hh:mm)": number;
  "Total de Horas Extras (hh:mm)": number;
  "Total de Faltas": number;
  "Total de Atestados": number;
}

export const ListaPonto = () => {
  const [dadosPonto, setDadosPonto] = useState<any[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itemsPorPagina = 10;
  const [modalAberto, setModalAberto] = useState(false);
  const [pontoSelecionado, setPontoSelecionado] = useState<any>(null);
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [dadosPontoComCalculados, setDadosPontoComCalculados] = useState<
    Ponto[]
  >([]);

  const [usuarioLogadoId, setUsuarioLogadoId] = useState<string | null>(null);
  const admUser = import.meta.env.VITE_ADM_USER;
  const supervisorUser = import.meta.env.VITE_SUPERVISOR_USER;

  useEffect(() => {
    const auth = getAuth();
    const usuario = auth.currentUser;
    if (usuario) {
      setUsuarioLogadoId(usuario.uid);
    }
  }, []);
  const [senha, setSenha] = useState("");
  const [senhaCorreta, setSenhaCorreta] = useState(false);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const pontosRef = collection(db, "pontos");
        let q = query(pontosRef);

        if (dataInicio && dataFim) {
          const dataInicioTimestamp = Timestamp.fromDate(new Date(dataInicio));
          const dataFimTimestamp = Timestamp.fromDate(new Date(dataFim));

          q = query(
            pontosRef,
            where("dia", ">=", dataInicioTimestamp),
            where("dia", "<=", dataFimTimestamp)
          );
        }

        const querySnapshot = await getDocs(q);
        const dados = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setDadosPonto(dados);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      }
    };

    fetchDados();
  }, [dataInicio, dataFim]);

  useEffect(() => {
    if (!dadosPonto.length) return;

    const dadosValidos = dadosPonto.filter((ponto) => {
      if (!ponto.nome || ponto.nome.trim() === "") return false;

      const pontos = [
        ponto.pontoEntrada,
        ponto.pontoAlmoco,
        ponto.pontoVolta,
        ponto.pontoSaida,
      ];
      const temPontoValido = pontos.some((p) => p && p.trim() !== "");
      return temPontoValido;
    });

    const calcularAtrasoEHoraExtra = async () => {
      try {
        const usuariosRef = collection(db, "usuarios");
        const usuariosSnapshot = await getDocs(usuariosRef);

        const horariosUsuarios = usuariosSnapshot.docs.reduce(
          (
            acc: Record<
              string,
              {
                primeiroPonto?: string;
                segundoPonto?: string;
                terceiroPonto?: string;
                quartoPonto?: string;
              }
            >,
            doc
          ) => {
            const nomeUsuario = doc.data().nome;
            acc[nomeUsuario] = {
              primeiroPonto: doc.data().primeiroPonto?.trim(),
              segundoPonto: doc.data().segundoPonto?.trim(),
              terceiroPonto: doc.data().terceiroPonto?.trim(),
              quartoPonto: doc.data().quartoPonto?.trim(),
            };
            return acc;
          },
          {}
        );

        const calcularHoras = (
          entradaReal: Date | null,
          almocoSaida: Date | null,
          almocoVolta: Date | null,
          saidaReal: Date | null,
          entradaEsperada: Date | null,
          saidaEsperada: Date | null
        ) => {
          let atraso = 0;
          let horasExtras = 0;
          let horasTrabalhadas = 0;

          if (entradaReal && saidaReal) {
            horasTrabalhadas =
              (saidaReal.getTime() - entradaReal.getTime()) / 3600000;

            if (almocoSaida && almocoVolta) {
              const tempoAlmoco =
                (almocoVolta.getTime() - almocoSaida.getTime()) / 3600000;
              horasTrabalhadas -= tempoAlmoco;
            }
          }

          const jornadaEsperada =
            entradaEsperada && saidaEsperada
              ? (saidaEsperada.getTime() - entradaEsperada.getTime()) / 3600000
              : 0;

          const jornadaEfetiva =
            jornadaEsperada -
            (almocoSaida && almocoVolta
              ? (almocoVolta.getTime() - almocoSaida.getTime()) / 3600000
              : 0);

          if (horasTrabalhadas > jornadaEfetiva) {
            horasExtras = horasTrabalhadas - jornadaEfetiva;
          } else {
            atraso = jornadaEfetiva - horasTrabalhadas;
          }

          return { atraso, horasExtras };
        };

        const novosDadosPonto = dadosValidos.map((ponto) => {
          const horariosEsperados = horariosUsuarios[ponto.nome] || {};
          const criarData = (hora: any) => {
            const [horaParte, minutoParte] = hora
              .split(":")
              .map((parte: any) => parte.trim());
            return new Date(`1970-01-01T${horaParte}:${minutoParte}:00`);
          };

          const entradaReal = ponto.pontoEntrada
            ? criarData(ponto.pontoEntrada)
            : null;
          const almocoSaida = ponto.pontoAlmoco
            ? criarData(ponto.pontoAlmoco)
            : null;
          const almocoVolta = ponto.pontoVolta
            ? criarData(ponto.pontoVolta)
            : null;
          const saidaReal = ponto.pontoSaida
            ? criarData(ponto.pontoSaida)
            : null;

          const entradaEsperada = horariosEsperados.primeiroPonto
            ? criarData(horariosEsperados.primeiroPonto)
            : null;
          const saidaEsperada = horariosEsperados.quartoPonto
            ? criarData(horariosEsperados.quartoPonto)
            : null;

          const { atraso, horasExtras } = calcularHoras(
            entradaReal,
            almocoSaida,
            almocoVolta,
            saidaReal,
            entradaEsperada,
            saidaEsperada
          );

          const formatarHoraMinuto = (horas: number) => {
            const minutos = Math.round(horas * 60);
            const horasFormatadas = Math.floor(minutos / 60);
            const minutosRestantes = minutos % 60;
            return `${String(horasFormatadas).padStart(2, "0")}:${String(
              minutosRestantes
            ).padStart(2, "0")}`;
          };

          return {
            ...ponto,
            atrasos: formatarHoraMinuto(atraso),
            horasExtras: formatarHoraMinuto(horasExtras),
          };
        });

        setDadosPontoComCalculados(novosDadosPonto);
      } catch (error) {
        console.error("Erro ao calcular atraso e hora extra:", error);
      }
    };

    calcularAtrasoEHoraExtra();
  }, [dadosPonto]);

  const dadosFiltrados = dadosPontoComCalculados.filter((ponto) =>
    ponto.nome.toLowerCase().includes(termoPesquisa.toLowerCase())
  );

  const indexFinal = paginaAtual * itemsPorPagina;
  const indexInicial = indexFinal - itemsPorPagina;
  const dadosExibidos = dadosFiltrados.slice(indexInicial, indexFinal);

  const totalPaginas = Math.ceil(dadosFiltrados.length / itemsPorPagina);

  const exportarParaXLS = (dadosFiltrados: Ponto[]) => {
    try {
      const formatarHoraMinuto = (horasMinutos: string): string => {
        if (!horasMinutos) return "00:00";
        const [horas, minutos] = horasMinutos.split(":").map(Number);
        return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(
          2,
          "0"
        )}`;
      };

      const dadosFormatados: DadosFormatados[] = dadosFiltrados.map(
        (ponto) => ({
          Nome: ponto.nome ?? "",
          Data: formatarData(ponto.dia),
          "Dia da Semana": ponto.diaSemana ?? "",
          "Ponto Entrada": ponto.pontoEntrada ?? "",
          "Ponto Almoço": ponto.pontoAlmoco ?? "",
          "Ponto Volta": ponto.pontoVolta ?? "",
          "Ponto Saída": ponto.pontoSaida ?? "",
          "Horas Extras": formatarHoraMinuto(ponto.horasExtras ?? "00:00"),
          Atrasos: formatarHoraMinuto(ponto.atrasos ?? "00:00"),
          Falta: ponto.falta ? "Sim" : "Não",
          Atestado: ponto.atestado
            ? { t: "s", v: "Clique aqui", l: { Target: ponto.atestado } }
            : "",
        })
      );

      dadosFormatados.push({
        Nome: "",
        Data: "",
        "Dia da Semana": "",
        "Ponto Entrada": "",
        "Ponto Almoço": "",
        "Ponto Volta": "",
        "Ponto Saída": "",
        "Horas Extras": "",
        Atrasos: "",
        Falta: "",
        Atestado: "",
      });

      // Calcula o resumo mensal
      const resumoMensal = Object.values(
        dadosFiltrados.reduce((acc, ponto) => {
          if (!acc[ponto.nome]) {
            acc[ponto.nome] = {
              Nome: ponto.nome ?? "",
              "Total de Dias Trabalhados": 0,
              "Total de Atrasos (hh:mm)": 0,
              "Total de Horas Extras (hh:mm)": 0,
              "Total de Faltas": 0,
              "Total de Atestados": 0, // Contabilizando os atestados
            };
          }

          acc[ponto.nome]["Total de Dias Trabalhados"] += 1;

          // Converte atraso e hora extra para minutos antes de somar
          const atrasoMinutos = ponto.atrasos
            ? parseInt(ponto.atrasos.split(":")[0]) * 60 +
              parseInt(ponto.atrasos.split(":")[1])
            : 0;

          const horaExtraMinutos = ponto.horasExtras
            ? parseInt(ponto.horasExtras.split(":")[0]) * 60 +
              parseInt(ponto.horasExtras.split(":")[1])
            : 0;

          acc[ponto.nome]["Total de Atrasos (hh:mm)"] += atrasoMinutos;
          acc[ponto.nome]["Total de Horas Extras (hh:mm)"] += horaExtraMinutos;
          acc[ponto.nome]["Total de Faltas"] += ponto.falta ? 1 : 0;
          acc[ponto.nome]["Total de Atestados"] += ponto.atestado ? 1 : 0; // Contabilizando os atestados

          return acc;
        }, {} as Record<string, ResumoMensal>)
      );

      // Converte os totais para formato hh:mm
      resumoMensal.forEach((resumo: any) => {
        resumo["Total de Atrasos (hh:mm)"] = formatarHoraMinuto(
          `${Math.floor(resumo["Total de Atrasos (hh:mm)"] / 60)}:${
            resumo["Total de Atrasos (hh:mm)"] % 60
          }`
        );

        resumo["Total de Horas Extras (hh:mm)"] = formatarHoraMinuto(
          `${Math.floor(resumo["Total de Horas Extras (hh:mm)"] / 60)}:${
            resumo["Total de Horas Extras (hh:mm)"] % 60
          }`
        );
      });

      // Criação das planilhas
      const wsDadosPonto = utils.json_to_sheet(dadosFormatados);
      const wsResumo = utils.json_to_sheet(resumoMensal);

      // Estilos para o cabeçalho e células
      const headerStyle = {
        fill: {
          patternType: "solid",
          fgColor: { rgb: "FFFF00" },
        },
        font: {
          bold: true,
          color: { rgb: "0000FF" },
        },
        alignment: {
          horizontal: "center",
        },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };

      const cellStyle = {
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };

      // Aplicar estilo ao cabeçalho
      const headerRange = utils.decode_range(wsDadosPonto["!ref"]!);
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = utils.encode_cell({ r: 0, c: col });
        if (!wsDadosPonto[cellAddress]) wsDadosPonto[cellAddress] = {};
        wsDadosPonto[cellAddress].s = headerStyle;
      }

      // Aplicar bordas
      const dataRange = utils.decode_range(wsDadosPonto["!ref"]!);
      for (let row = dataRange.s.r; row <= dataRange.e.r; row++) {
        for (let col = dataRange.s.c; col <= dataRange.e.c; col++) {
          const cellAddress = utils.encode_cell({ r: row, c: col });
          if (!wsDadosPonto[cellAddress]) wsDadosPonto[cellAddress] = {};
          wsDadosPonto[cellAddress].s = {
            ...wsDadosPonto[cellAddress].s,
            ...cellStyle,
          };
        }
      }

      // Aplicar estilo ao cabeçalho do resumo
      const headerRangeResumo = utils.decode_range(wsResumo["!ref"]!);
      for (
        let col = headerRangeResumo.s.c;
        col <= headerRangeResumo.e.c;
        col++
      ) {
        const cellAddress = utils.encode_cell({ r: 0, c: col });
        if (!wsResumo[cellAddress]) wsResumo[cellAddress] = {};
        wsResumo[cellAddress].s = headerStyle;
      }

      // Aplicar bordas no resumo mensal
      const dataRangeResumo = utils.decode_range(wsResumo["!ref"]!);
      for (let row = dataRangeResumo.s.r; row <= dataRangeResumo.e.r; row++) {
        for (let col = dataRangeResumo.s.c; col <= dataRangeResumo.e.c; col++) {
          const cellAddress = utils.encode_cell({ r: row, c: col });
          if (!wsResumo[cellAddress]) wsResumo[cellAddress] = {};
          wsResumo[cellAddress].s = {
            ...wsResumo[cellAddress].s,
            ...cellStyle,
          };
        }
      }

      // Define a largura das colunas
      wsDadosPonto["!cols"] = [
        { wch: 20 }, // Nome
        { wch: 15 }, // Data
        { wch: 15 }, // Dia da Semana
        { wch: 15 }, // Ponto Entrada
        { wch: 15 }, // Ponto Almoço
        { wch: 15 }, // Ponto Volta
        { wch: 15 }, // Ponto Saída
        { wch: 15 }, // Horas Extras
        { wch: 15 }, // Atrasos
        { wch: 10 }, // Falta
        { wch: 15 }, // Atestado (Novo)
      ];

      wsResumo["!cols"] = [
        { wch: 20 }, // Nome
        { wch: 20 }, // Total de Dias Trabalhados
        { wch: 15 }, // Total de Atrasos
        { wch: 15 }, // Total de Horas Extras
        { wch: 15 }, // Total de Faltas
        { wch: 15 }, // Total de Atestados (Novo)
      ];

      // Adicionar filtro automático
      wsDadosPonto["!autofilter"] = { ref: "A1:K1" }; // Coluna adicional para o atestado
      wsResumo["!autofilter"] = { ref: "A1:F1" };

      // Criar e salvar o arquivo XLSX
      const wb = utils.book_new();
      utils.book_append_sheet(wb, wsDadosPonto, "Dados Ponto Gerais");
      utils.book_append_sheet(wb, wsResumo, "Resumo Mensal");

      writeFile(wb, "relatorio_ponto.xlsx");
    } catch (error) {
      console.error("Erro ao exportar para XLSX:", error);
    }
  };

  const convertDateToTimestamp = async () => {
    const usuariosRef = collection(db, "pontos");
    const snapshot = await getDocs(usuariosRef);

    snapshot.forEach(async (docSnapshot) => {
      const data = docSnapshot.data();
      const docRef = doc(db, "pontos", docSnapshot.id);

      if (data.dia && typeof data.dia === "string" && data.dia.includes("/")) {
        const partes = data.dia.split("/");
        if (partes.length === 3) {
          let [p1, p2, ano] = partes; // Remove espaços e força números

          p1 = p1.trim();
          p2 = p2.trim();
          ano = ano.trim(); // Determinar formato: se o segundo número > 12, então é dia (formato americano)

          let dia: string;
          let mes: string;

          if (parseInt(p2) > 12) {
            mes = p1.padStart(2, "0");
            dia = p2.padStart(2, "0");
          } else {
            dia = p1.padStart(2, "0");
            mes = p2.padStart(2, "0");
          }

          const dateString = `${ano}-${mes}-${dia}T09:53:14-03:00`;
          const dateObj = new Date(dateString);

          if (!isNaN(dateObj.getTime())) {
            const timestamp = Timestamp.fromDate(dateObj);
            await updateDoc(docRef, { dia: timestamp });
            console.log(
              `✅ Documento ${docSnapshot.id} atualizado com timestamp!`
            );
          } else {
            console.warn(
              `❌ Data inválida em documento ${docSnapshot.id}: ${data.dia}`
            );
          }
        } else {
          console.warn(
            `❌ Formato inesperado de data em documento ${docSnapshot.id}: ${data.dia}`
          );
        }
      }
    });

    console.log("Conversão finalizada!");
  };

  const abrirModal = (ponto: any) => {
    setPontoSelecionado(ponto);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setPontoSelecionado(null);
    setSenha("");
    setSenhaCorreta(false);
  };

  const salvarDados = async () => {
    if (pontoSelecionado && pontoSelecionado.id) {
      try {
        const dataFormatada = pontoSelecionado.dia;
        let fileURL = pontoSelecionado.arquivoURL || null;
        if (pontoSelecionado.arquivo) {
          const storage = getStorage();
          const storageRef = ref(
            storage,
            `arquivos/${pontoSelecionado.arquivo.name}`
          );
          const snapshot = await uploadBytes(
            storageRef,
            pontoSelecionado.arquivo
          );
          fileURL = await getDownloadURL(snapshot.ref);
        }

        const pontoRef = doc(db, "pontos", pontoSelecionado.id);
        await updateDoc(pontoRef, {
          ...pontoSelecionado,
          dia: dataFormatada,
          arquivoURL: fileURL,
          arquivo: null,
        });

        console.log(
          "Dados atualizados com sucesso no Firestore:",
          pontoSelecionado
        );
        fecharModal();
        setDadosPonto((prevDados: any) =>
          prevDados.map((ponto: any) =>
            ponto.id === pontoSelecionado.id
              ? { ...pontoSelecionado, arquivoURL: fileURL }
              : ponto
          )
        );
      } catch (error) {
        console.error("Erro ao atualizar dados no Firestore:", error);
      }
    }
  };
  const formatarData = (data: any) => {
    if (data instanceof Timestamp) {
      const date = data.toDate();
      const dia = date.getDate().toString().padStart(2, "0");
      const mes = (date.getMonth() + 1).toString().padStart(2, "0");
      const ano = date.getFullYear().toString();
      return `${dia}/${mes}/${ano}`;
    } else if (typeof data === "string") {
      return data;
    } else {
      return "";
    }
  };
  const verificarSenha = (valor: any) => {
    setSenha(valor);
    setSenhaCorreta(valor === "068543");
  };

  return (
    <div className="h-screen flex flex-col text-white p-6">
      <div className="mb-8">
        <h1 className="text-4xl mb-2">Ponto Maps</h1>
        <p>Verifique seus pontos</p>
      </div>
      {/* <div className="mt-4 text-lg font-bold">
        Total de Atrasos: {calcularTotalAtrasos()}
      </div> */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Horas trabalhadas</h2>
        <div className="flex justify-center gap-3">
          {(usuarioLogadoId === admUser ||
            usuarioLogadoId === supervisorUser) && (
            <Link
              to="/faltas"
              className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
            >
              Horário Manual
            </Link>
          )}

          <button
            onClick={() => exportarParaXLS(dadosFiltrados)}
            className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600"
          >
            Download XLS
          </button>
          <button
            onClick={() => convertDateToTimestamp()}
            className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
          >
            Arrumar datas
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={termoPesquisa}
          onChange={(e) => setTermoPesquisa(e.target.value)}
          placeholder="Pesquisar por nome"
          className="p-2 rounded bg-gray-700 text-white w-1/3"
        />
        <input
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          className="p-2 rounded bg-gray-700 text-white w-1/4"
        />
        <input
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          className="p-2 rounded bg-gray-700 text-white w-1/4"
        />
      </div>

      <div className="w-full bg-[#35486E] p-10 rounded-lg shadow-lg">
        <table className="w-full text-sm text-left text-white">
          <thead>
            <tr>
              <th className="px-6 py-3">Nome</th>
              <th className="px-6 py-3">Data</th>
              <th className="px-6 py-3">Dia da Semana</th>
              <th className="px-6 py-3">Presença</th>
              <th className="px-6 py-3">Atrasos</th>
              <th className="px-6 py-3">Hora Extra</th>
              <th className="px-6 py-3">Ação</th>
            </tr>
          </thead>
          <tbody>
            {dadosExibidos.map((ponto) => (
              <tr key={ponto.id} className="border-b border-gray-700">
                <td className="px-6 py-4">{ponto.nome}</td>

                <td className="px-6 py-4">
                  {ponto.dia instanceof Date
                    ? ponto.dia.toLocaleDateString()
                    : new Date(ponto.dia.seconds * 1000).toLocaleDateString()}
                </td>

                <td className="px-6 py-4">{ponto.diaSemana}</td>

                <td className="px-6 py-4">
                  {ponto.falta ? "Falta" : "Presente"}
                </td>

                <td className="px-6 py-4">{ponto.atrasos}</td>
                <td className="px-6 py-4">{ponto.horasExtras}</td>

                <td className="px-6 py-4">
                  <button
                    onClick={() => abrirModal(ponto)}
                    className="text-white hover:text-blue-500"
                  >
                    <FaArrowRight />
                  </button>
                </td>
                {/* <td>
                  <button onClick={() => excluirPonto(ponto.id)}><FontAwesomeIcon icon={faTrash} color="#FF0000" /></button>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-center items-center mt-4 gap-4">
          <button
            onClick={() =>
              setPaginaAtual(paginaAtual > 1 ? paginaAtual - 1 : paginaAtual)
            }
            className="text-white p-2 rounded-full hover:bg-blue-500"
          >
            <FaArrowLeft />
          </button>
          <span className="text-white">
            {paginaAtual} - {totalPaginas}
          </span>
          <button
            onClick={() =>
              setPaginaAtual(
                paginaAtual < totalPaginas ? paginaAtual + 1 : paginaAtual
              )
            }
            className="text-white p-2 rounded-full hover:bg-blue-500"
          >
            <FaArrowRight />
          </button>
        </div>
      </div>
      {modalAberto && (
        <EditPonto
          pontoSelecionado={pontoSelecionado}
          setPontoSelecionado={setPontoSelecionado}
          salvarDados={salvarDados}
          fecharModal={fecharModal}
          senha={senha}
          verificarSenha={verificarSenha}
          senhaCorreta={senhaCorreta}
        />
      )}
    </div>
  );
};
