import React, { useState, useEffect } from "react";
import { collection, setDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

export const Faltas = () => {
  const dataAtual = new Date();
  const diaFormatado = dataAtual.toISOString().split("T")[0]; // Formato "yyyy-mm-dd"

  const [formData, setFormData] = useState({
    falta: true,
    nome: "",
    dia: diaFormatado, // Valor inicial definido como a data atual
    diaSemana: "",
  });

  const [usuarios, setUsuarios] = useState<string[]>([]);
  const [senha, setSenha] = useState<string>("");
  const [isSenhaValida, setIsSenhaValida] = useState<boolean>(false);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "usuarios"));
        const nomes = querySnapshot.docs.map((doc) => doc.data().nome);
        setUsuarios(nomes);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
      }
    };

    fetchUsuarios();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSenhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSenha(value);

    // Verifica se a senha está correta
    if (value === "068543") {
      setIsSenhaValida(true);
    } else {
      setIsSenhaValida(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.dia) {
      alert("Por favor, preencha o nome e a data.");
      return;
    }
  
    // Corrige o problema de fuso horário ao manipular a data
    const dataOriginal = new Date(formData.dia);
    const dataCorrigida = new Date(dataOriginal.getTime() + dataOriginal.getTimezoneOffset() * 60000);
  
    // Converte a data para o formato brasileiro (dd/mm/yyyy)
    const dataBrasileira = dataCorrigida.toLocaleDateString("pt-BR");
  
    // Gera o ID no formato "nome-yyyy-mm-dd"
    const dataPadrao = dataCorrigida.toISOString().split("T")[0];
    const docId = `${formData.nome}-${dataPadrao}`;
  
    try {
      await setDoc(doc(collection(db, "pontos"), docId), {
        ...formData,
        dia: dataBrasileira, // Salva a data no formato brasileiro
      });
      alert("Dados salvos com sucesso!");
      setFormData({ falta: true, nome: "", dia: "", diaSemana: "" });
      setSenha(""); // Limpa a senha após salvar
      setIsSenhaValida(false); // Desabilita o botão após salvar
    } catch (error) {
      console.error("Erro ao salvar os dados:", error);
      alert("Erro ao salvar os dados. Tente novamente.");
    }
  };
  

  return (
    <div className="h-screen flex flex-col text-white p-6">
      <div className="mb-8">
        <h1 className="text-4xl mb-2">Ponto Maps</h1>
        <p>Faltas</p>
      </div>
      <div className="flex justify-start gap-6">
        <div className="w-[400px] h-[450px] bg-[#35486E] p-10 gap-4 flex flex-col items-center justify-center rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Registre faltas</h2>
          <div className="flex flex-col gap-4 w-full">
            <label className="flex flex-col">
              <span>Nome:</span>
              <select
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                className="p-2 rounded bg-gray-200 text-black"
              >
                <option value="">Selecione um nome</option>
                {usuarios.map((usuario, index) => (
                  <option key={index} value={usuario}>
                    {usuario}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col">
              <span>Data:</span>
              <input
                type="date"
                name="dia"
                value={formData.dia}
                onChange={handleInputChange}
                className="p-2 rounded bg-gray-200 text-black"
              />
            </label>
            <label className="flex flex-col">
              <span>Dia da semana:</span>
              <select
                name="diaSemana"
                value={formData.diaSemana}
                onChange={handleInputChange}
                className="p-2 rounded bg-gray-200 text-black"
              >
                <option value="">Selecione o dia da semana</option>
                <option value="Segunda-feira">Segunda</option>
                <option value="Terca-feira">Terça</option>
                <option value="Quarta-feira">Quarta</option>
                <option value="Quinta-feira">Quinta</option>
                <option value="Sexta-feira">Sexta</option>
                <option value="Sabado">Sábado</option>
              </select>
            </label>
            <label className="flex flex-col">
              <span>Senha:</span>
              <input
                type="password"
                value={senha}
                onChange={handleSenhaChange}
                className="p-2 rounded bg-gray-200 text-black"
              />
            </label>
            <button
              onClick={handleSave}
              disabled={!isSenhaValida} // Desabilita o botão se a senha for inválida
              className={`bg-blue-500 text-white p-2 rounded hover:bg-blue-600 ${
                !isSenhaValida ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
