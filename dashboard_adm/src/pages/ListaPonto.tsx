/* eslint-disable @typescript-eslint/no-explicit-any */
import { SetStateAction, useEffect, useState } from "react";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";
import { utils, writeFileXLSX } from "xlsx";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { Link } from "react-router-dom";
import { getAuth } from "firebase/auth";

export const ListaPonto = () => {
  const [dadosPonto, setDadosPonto] = useState<any[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itemsPorPagina = 10;
  const [modalAberto, setModalAberto] = useState(false);
  const [pontoSelecionado, setPontoSelecionado] = useState<any>(null);
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [usuarioLogadoId, setUsuarioLogadoId] = useState<string | null>(null);
  const admUser = import.meta.env.VITE_ADM_USER;

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
        let q = pontosRef;
        if (filtroData) {
          const filtroDataFormatada = filtroData.split("-").reverse().join("/"); 
          q = query(pontosRef, where("dia", "==", filtroDataFormatada)) as any;
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
  }, [filtroData]); // Esse efeito só busca os pontos e atualiza `dadosPonto`
  
  useEffect(() => {
    if (dadosPonto.length === 0) return; // Só calcula se houver dados
  
    const calcularAtrasoEHoraExtra = async () => {
      try {
        const usuariosRef = collection(db, "usuarios");
        const usuariosSnapshot = await getDocs(usuariosRef);
  
        // Criar um mapa com os horários dos usuários
        const horariosUsuarios = usuariosSnapshot.docs.reduce((acc, doc) => {
          const nomeUsuario = doc.data().nome; // Usando o nome para corresponder ao ponto
          acc[nomeUsuario] = {
            primeiroPonto: doc.data().primeiroPonto?.trim(),
            segundoPonto: doc.data().segundoPonto?.trim(),
            terceiroPonto: doc.data().terceiroPonto?.trim(),
            quartoPonto: doc.data().quartoPonto?.trim(),
          };
          return acc;
        }, {} as Record<string, any>);
  
  
        const novosDadosPonto = dadosPonto.map((ponto) => {
          const horariosEsperados = horariosUsuarios[ponto.nome]; // Usamos o nome para corresponder
  
          if (!horariosEsperados) {
            console.log(`Usuário não encontrado para o ponto ${ponto.nome}`);
            return ponto; // Se não encontrar o usuário, mantém os dados inalterados
          }
  
          // Corrigir formato de horário e criar Date corretamente
          const criarData = (hora: string) => {
            const [horaParte, minutoParte] = hora.split(':').map((parte) => parte.trim());
            return new Date(`1970-01-01T${horaParte}:${minutoParte}:00`);
          };
  
          const entradaReal = ponto.pontoEntrada ? criarData(ponto.pontoEntrada) : null;
          const almocoSaida = ponto.pontoAlmoco ? criarData(ponto.pontoAlmoco) : null;
          const almocoVolta = ponto.pontoVolta ? criarData(ponto.pontoVolta) : null;
          const saidaReal = ponto.pontoSaida ? criarData(ponto.pontoSaida) : null;
  
          const entradaEsperada = horariosEsperados.primeiroPonto ? criarData(horariosEsperados.primeiroPonto) : null;
          const saidaEsperada = horariosEsperados.quartoPonto ? criarData(horariosEsperados.quartoPonto) : null;
  
  
          let atraso = 0;
          let horasExtras = 0;
          let horasTrabalhadas = 0;
  
          // Calcular atraso se entrou depois do horário esperado
          if (entradaReal && entradaEsperada && entradaReal > entradaEsperada) {
            atraso = (entradaReal.getTime() - entradaEsperada.getTime()) / 60000; // Atraso em minutos
          }
  
          // Calcular horas trabalhadas
          if (entradaReal && saidaReal) {
            // Calcular a diferença entre entrada e saída
            horasTrabalhadas = (saidaReal.getTime() - entradaReal.getTime()) / 3600000; // Converter ms para horas
  
            // Subtrair o tempo de almoço, se houver
            if (almocoSaida && almocoVolta) {
              const tempoAlmoco = (almocoVolta.getTime() - almocoSaida.getTime()) / 3600000;
              horasTrabalhadas -= tempoAlmoco;
            }
          }
  
          // Calcular a jornada esperada em horas
          const jornadaEsperada = entradaEsperada && saidaEsperada
          ? (saidaEsperada.getTime() - entradaEsperada.getTime()) / 3600000
          : 0;
        
        // Corrigir cálculo das horas extras
        const jornadaEfetiva = jornadaEsperada - (almocoSaida && almocoVolta ? (almocoVolta.getTime() - almocoSaida.getTime()) / 3600000 : 0);
        
        if (horasTrabalhadas > jornadaEfetiva) {
          horasExtras = horasTrabalhadas - jornadaEfetiva;
        } else {
          horasExtras = 0;
        }
        
  
          const formatarHoraMinuto = (horas: number) => {
            const minutos = Math.round(horas * 60);
            const horasFormatadas = Math.floor(minutos / 60);
            const minutosRestantes = minutos % 60;
            return `${String(horasFormatadas).padStart(2, "0")}:${String(minutosRestantes).padStart(2, "0")}`;
          };
  
          // Atualizar os valores para os campos de atraso e horas extras
          return {
            ...ponto,
            atrasos: formatarHoraMinuto(atraso / 60), // Atraso no formato HH:mm
            horasExtras: formatarHoraMinuto(horasExtras), // Horas extras no formato HH:mm
          };
        });
  
        setDadosPonto(novosDadosPonto);
      } catch (error) {
        console.error("Erro ao calcular atraso e hora extra:", error);
      }
    };
  
    calcularAtrasoEHoraExtra();
  }, [dadosPonto]);
  
  const dadosFiltrados = dadosPonto.filter((ponto) =>
    ponto.nome.toLowerCase().includes(termoPesquisa.toLowerCase())
  );

  const indexFinal = paginaAtual * itemsPorPagina;
  const indexInicial = indexFinal - itemsPorPagina;
  const dadosExibidos = dadosFiltrados.slice(indexInicial, indexFinal);

  const totalPaginas = Math.ceil(dadosFiltrados.length / itemsPorPagina);

const exportarParaXLS = () => {
  try {
    const dadosFormatados = dadosFiltrados.map((ponto) => ({
      Nome: ponto.nome ?? "",
      Data: ponto.dia ?? "",
      "Dia da Semana": ponto.diaSemana ?? "",
      "Ponto Entrada": ponto.pontoEntrada ?? "",
      "Ponto Almoço": ponto.pontoAlmoco ?? "",
      "Ponto Volta": ponto.pontoVolta ?? "",
      "Ponto Saída": ponto.pontoSaida ?? "",
      "Horas Extras": ponto.horasExtras ?? "",
      Atrasos: ponto.atrasos ?? "",
      Falta: ponto.falta ? "Sim" : "Não",
    }));

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
    });

    const resumoMensal = Object.values(
      dadosFiltrados.reduce((acc, ponto) => {
        if (!acc[ponto.nome]) {
          acc[ponto.nome] = {
            Nome: ponto.nome ?? "",
            "Total de Dias Trabalhados": 0,
            "Total de Atrasos": 0,
            "Total de Horas Extras": 0,
            "Total de Faltas": 0,
          };
        }

        acc[ponto.nome]["Total de Dias Trabalhados"] += 1;
        acc[ponto.nome]["Total de Atrasos"] += ponto.atrasos
          ? parseFloat(ponto.atrasos) || 0
          : 0;
        acc[ponto.nome]["Total de Horas Extras"] += ponto.horasExtras
          ? parseFloat(ponto.horasExtras) || 0
          : 0;
        acc[ponto.nome]["Total de Faltas"] += ponto.falta ? 1 : 0;

        return acc;
      }, {})
    );

    const wsDadosPonto = utils.json_to_sheet(dadosFormatados);
    const wsResumo = utils.json_to_sheet(resumoMensal);

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
    ];

    wsResumo["!cols"] = [
      { wch: 20 }, // Nome
      { wch: 20 }, // Total de Dias Trabalhados
      { wch: 15 }, // Total de Atrasos
      { wch: 15 }, // Total de Horas Extras
      { wch: 15 }, // Total de Faltas
    ];

    const wb = utils.book_new();
    utils.book_append_sheet(wb, wsDadosPonto, "Dados Ponto Gerais");
    utils.book_append_sheet(wb, wsResumo, "Resumo Mensal");

    writeFileXLSX(wb, "relatorio_ponto.xlsx");
  } catch (error) {
    console.error("Erro ao exportar para XLSX:", error);
  }
};

  const abrirModal = (ponto: SetStateAction<null>) => {
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
        const dataFormatada = formatarData(pontoSelecionado.dia);
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
  const formatarData = (data: string) => {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const verificarSenha = (valor: any) => {
    setSenha(valor);
    setSenhaCorreta(valor === "2025@maps");
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
          {usuarioLogadoId === admUser && (
            <Link
              to="/faltas"
              className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
            >
              Horário Manual
            </Link>
          )}
          <button
            onClick={exportarParaXLS}
            className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600"
          >
            Download XLS
          </button>
        </div>
      </div>

      {/* Barra de pesquisa e filtro */}
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
          value={filtroData}
          onChange={(e) => setFiltroData(e.target.value)}
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
                <td className="px-6 py-4">{ponto.dia}</td>
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
            Página {paginaAtual} de {totalPaginas}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-[#35486E] p-6 rounded-lg w-96">
            <h3 className="text-xl mb-4">Editar Ponto</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1">Nome</label>
                <input
                  type="text"
                  value={pontoSelecionado?.nome || ""}
                  onChange={(e) =>
                    setPontoSelecionado({
                      ...pontoSelecionado,
                      nome: e.target.value,
                    })
                  }
                  className="p-2 border rounded w-full text-black"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Dia da semana</label>
                <select
                  value={pontoSelecionado?.diaSemana || ""}
                  onChange={(e) =>
                    setPontoSelecionado({
                      ...pontoSelecionado,
                      diaSemana: e.target.value,
                    })
                  }
                  className="p-2 border rounded w-full text-black"
                >
                  <option value="">Selecione</option>
                  <option value="Segunda-feira">Segunda-feira</option>
                  <option value="Terça-feira">Terça-feira</option>
                  <option value="Quarta-feira">Quarta-feira</option>
                  <option value="Quinta-feira">Quinta-feira</option>
                  <option value="Sexta-feira">Sexta-feira</option>
                  <option value="Sábado">Sábado</option>
                  <option value="Domingo">Domingo</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Data</label>
                <input
                  type="date"
                  value={pontoSelecionado?.dia || ""}
                  onChange={(e) =>
                    setPontoSelecionado({
                      ...pontoSelecionado,
                      dia: e.target.value,
                    })
                  }
                  className="p-2 border rounded w-full text-black"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Ponto Entrada</label>
                <input
                  type="text"
                  value={pontoSelecionado?.pontoEntrada || ""}
                  onChange={(e) =>
                    setPontoSelecionado({
                      ...pontoSelecionado,
                      pontoEntrada: e.target.value,
                    })
                  }
                  className="p-2 border rounded w-full text-black"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Ponto Almoço</label>
                <input
                  type="text"
                  value={pontoSelecionado?.pontoAlmoco || ""}
                  onChange={(e) =>
                    setPontoSelecionado({
                      ...pontoSelecionado,
                      pontoAlmoco: e.target.value,
                    })
                  }
                  className="p-2 border rounded w-full text-black"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Ponto Volta</label>
                <input
                  type="text"
                  value={pontoSelecionado?.pontoVolta || ""}
                  onChange={(e) =>
                    setPontoSelecionado({
                      ...pontoSelecionado,
                      pontoVolta: e.target.value,
                    })
                  }
                  className="p-2 border rounded w-full text-black"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Ponto Saída</label>
                <input
                  type="text"
                  value={pontoSelecionado?.pontoSaida || ""}
                  onChange={(e) =>
                    setPontoSelecionado({
                      ...pontoSelecionado,
                      pontoSaida: e.target.value,
                    })
                  }
                  className="p-2 border rounded w-full text-black"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Horas Extras</label>
                <input
                  type="text"
                  value={pontoSelecionado?.horasExtras || ""}
                  onChange={(e) =>
                    setPontoSelecionado({
                      ...pontoSelecionado,
                      horasExtras: e.target.value,
                    })
                  }
                  className="p-2 border rounded w-full text-black"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Atrasos</label>
                <input
                  type="text"
                  value={pontoSelecionado?.atrasos || ""}
                  onChange={(e) =>
                    setPontoSelecionado({
                      ...pontoSelecionado,
                      atrasos: e.target.value,
                    })
                  }
                  className="p-2 border rounded w-full text-black"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-bold mb-1">Falta</label>
                <div className="flex gap-4">
                  <label>
                    <input
                      type="radio"
                      value="true"
                      checked={pontoSelecionado?.falta === true}
                      onChange={() =>
                        setPontoSelecionado({
                          ...pontoSelecionado,
                          falta: true,
                        })
                      }
                    />
                    Sim
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="false"
                      checked={pontoSelecionado?.falta === false}
                      onChange={() =>
                        setPontoSelecionado({
                          ...pontoSelecionado,
                          falta: false,
                        })
                      }
                    />
                    Não
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-5">
              <label className="block font-bold mb-1">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => verificarSenha(e.target.value)}
                placeholder="Digite a senha"
                className="p-2 border rounded w-full text-black"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={salvarDados}
                disabled={!senhaCorreta}
                className={`px-4 py-2 rounded ${
                  senhaCorreta
                    ? "bg-blue-500 text-white"
                    : "bg-gray-500 text-gray-300 cursor-not-allowed"
                }`}
              >
                Salvar
              </button>
              <button
                onClick={fecharModal}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
