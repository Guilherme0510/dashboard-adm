/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";
import * as XLSX from "xlsx";
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
  const [dadosPonto, setDadosPonto] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itemsPorPagina = 10;
  const [modalAberto, setModalAberto] = useState(false);
  const [pontoSelecionado, setPontoSelecionado] = useState(null);
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [usuarioLogadoId, setUsuarioLogadoId] = useState(null);
  const admUser = "mJT4AdiNCuURJsbibAPcNeMid1I3";

  useEffect(() => {
    const auth = getAuth();
    const usuario = auth.currentUser;
    if (usuario) {
      setUsuarioLogadoId(usuario.uid); // Armazena o ID do usuário logado
    }
  }, []);
  const [senha, setSenha] = useState("");
  const [senhaCorreta, setSenhaCorreta] = useState(false);
  useEffect(() => {
    const fetchDados = async () => {
      try {
        const pontosRef = collection(db, "pontos");
        let q = pontosRef;

        // Verifique se o filtro de data foi definido
        if (filtroData) {
          // Converte a data selecionada para o formato "dd/mm/aaaa"
          const filtroDataFormatada = filtroData.split("-").reverse().join("/"); // De "yyyy-mm-dd" para "dd/mm/aaaa"

          // Filtro para buscar dados com o dia exato
          q = query(pontosRef, where("dia", "==", filtroDataFormatada));
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
  }, [filtroData]);

  const dadosFiltrados = dadosPonto.filter((ponto) =>
    ponto.nome.toLowerCase().includes(termoPesquisa.toLowerCase())
  );

  const indexFinal = paginaAtual * itemsPorPagina;
  const indexInicial = indexFinal - itemsPorPagina;
  const dadosExibidos = dadosFiltrados.slice(indexInicial, indexFinal);

  const totalPaginas = Math.ceil(dadosFiltrados.length / itemsPorPagina);

  const converterParaMinutos = (hora: string) => {
    const [horas, minutos] = hora.split(":").map(Number);
    return horas * 60 + minutos;
  };

  const converterParaHoraFormatada = (minutos: number) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${String(horas).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  const calcularTotalAtrasos = () => {
    const totalMinutos = dadosExibidos.reduce((total, ponto) => {
      // Certifique-se de que atrasos está no formato "hh:mm"
      if (ponto.atrasos && ponto.atrasos.includes(":")) {
        return total + converterParaMinutos(ponto.atrasos);
      }
      return total;
    }, 0);
    return converterParaHoraFormatada(totalMinutos);
  };

  const exportarParaXLS = () => {
    const dadosFormatados = dadosExibidos.map((ponto) => ({
      Nome: ponto.nome,

      Data: ponto.dia,
      "Dia da Semana": ponto.diaSemana,
      "Ponto Entrada": ponto.pontoEntrada,
      "Ponto Almoço": ponto.pontoAlmoco,
      "Ponto Volta": ponto.pontoVolta,
      "Ponto Saída": ponto.pontoSaida,
      "Horas Extras": ponto.horasExtras,
      Atrasos: ponto.atrasos,
      Falta: ponto.falta ? "Sim" : "Não",
    }));

    // Adicionando a linha de total
    const totalLinhas = dadosExibidos.length + 1; // A última linha de dados
    dadosFormatados.push({
      Nome: "Total",
      Atrasos: `=SOMA(H2:H${totalLinhas})`, // Fórmula para somar todos os valores na coluna H (Atrasos)
    });

    const ws = XLSX.utils.json_to_sheet(dadosFormatados, {
      header: [
        "Nome",
        "Data",
        "Dia da Semana",
        "Ponto Entrada",
        "Ponto Almoço",
        "Ponto Volta",
        "Ponto Saída",
        "Horas Extras",
        "Atrasos",
        "Falta",
      ],
    });

    const styleHeader = {
      alignment: { horizontal: "center", vertical: "center" },
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4F81BD" } },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = { r: range.s.r, c: col };
      const cellRef = XLSX.utils.encode_cell(cellAddress);
      if (!ws[cellRef]) ws[cellRef] = {};
      ws[cellRef].s = styleHeader;
    }

    const styleData = {
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = { r: row, c: col };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        if (!ws[cellRef]) ws[cellRef] = {};
        ws[cellRef].s = styleData;
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DadosPonto");
    XLSX.writeFile(wb, "dados_ponto_formatado.xlsx");
  };

  const abrirModal = (ponto) => {
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
        // Formatar a data no formato dd/mm/aaaa
        const dataFormatada = formatarData(pontoSelecionado.dia);
  
        // Upload do arquivo para o Firebase Storage
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
  
        // Atualização no Firestore
        const pontoRef = doc(db, "pontos", pontoSelecionado.id);
        await updateDoc(pontoRef, {
          ...pontoSelecionado,
          dia: dataFormatada, // Salvando a data formatada
          arquivoURL: fileURL, // Salve o URL do arquivo
          arquivo: null, // Evite salvar o arquivo diretamente
        });
  
        console.log("Dados atualizados com sucesso no Firestore:", pontoSelecionado);
        fecharModal();
  
        // Opcional: Atualize a lista de dados local para refletir a alteração
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
  
  // Função para formatar a data
  const formatarData = (data: string) => {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
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
          onChange={(e) => setFiltroData(e.target.value)} // Atualiza o valor do filtro de data
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

        {/* Navegação de páginas */}
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

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-[#35486E] p-6 rounded-lg w-96">
            <h3 className="text-xl mb-4">Editar Ponto</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Nome */}
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

              {/* Dia da semana */}
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

              {/* Dia */}
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

              {/* Ponto de Entrada */}
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

              {/* Ponto de Almoço */}
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

              {/* Ponto Volta */}
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

              {/* Ponto Saída */}
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

              {/* Horas Extras */}
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

              {/* Atrasos */}
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

              {/* Falta */}
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

            {/* Botões de ação */}
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
