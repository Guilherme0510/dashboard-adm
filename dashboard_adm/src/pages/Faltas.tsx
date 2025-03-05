import { useState, useEffect } from "react";
import {
  collection,
  setDoc,
  doc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { toast, ToastContainer } from "react-toastify";

export const Faltas = () => {
  type FormData = {
    falta: boolean;
    nome: string;
    dia: string;
    diaSemana: string;
    pontoEntrada: string;
    pontoAlmoco: string;
    pontoVolta: string;
    pontoSaida: string;
    atrasos: string;
    horasExtras: string;
    atestado: string;
  };

  const [formData, setFormData] = useState<FormData>({
    falta: true, // Inicialmente "Sim"
    nome: "",
    dia: "",
    diaSemana: "",
    pontoEntrada: "",
    pontoAlmoco: "",
    pontoVolta: "",
    pontoSaida: "",
    atrasos: "",
    horasExtras: "",
    atestado: "",
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;

    if (
      name === "pontoEntrada" ||
      name === "pontoAlmoco" ||
      name === "pontoVolta" ||
      name === "pontoSaida" ||
      name === "atrasos" ||
      name === "horasExtras"
    ) {
      let formattedValue = value.replace(/[^0-9]/g, "");

      if (formattedValue.length > 2 && formattedValue.length <= 4) {
        formattedValue = `${formattedValue.slice(0, 2)}:${formattedValue.slice(
          2
        )}`;
      }

      if (formattedValue.length > 5) {
        formattedValue = formattedValue.slice(0, 5);
      }

      if (formattedValue.replace(":", "").length > 4) {
        return;
      }

      setFormData((prev) => ({
        ...prev,
        [name as keyof FormData]: formattedValue,
      }));
    } else if (name === "dia") {
      const [year, month, day] = value.split("-");
      if (year && month && day) {
        const formattedDate = `${String(day).padStart(2, "0")}/${String(
          month
        ).padStart(2, "0")}/${year}`;
        setFormData((prev) => ({
          ...prev,
          [name as keyof FormData]: formattedDate,
        }));
      }
    } else if (name === "falta") {
      setFormData((prev) => ({
        ...prev,
        [name as keyof FormData]: value === "sim",
      }));
    } else if (name === "atestado") {
      // Caso o campo "atestado" seja um link (URL), apenas armazene o valor no estado
      setFormData((prev) => ({
        ...prev,
        [name as keyof FormData]: value, // Aqui você armazena o link diretamente
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name as keyof FormData]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSenhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSenha(value);
    setIsSenhaValida(value === "068543");
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.dia) {
      alert("Por favor, preencha o nome e a data.");
      return;
    }
  
    try {
      // Converte a data de formato dd/mm/yyyy para yyyy-mm-dd
      const [day, month, year] = formData.dia.split("/");
      const formattedDiaBanco = `${year}-${month}-${day}`;
  
      // Cria uma data no fuso horário de Brasília (GMT-3)
      const diaLocal = new Date(`${formattedDiaBanco}T00:00:00-03:00`);
  
      // Converte para Timestamp do Firebase
      const diaTimestamp = Timestamp.fromDate(diaLocal);
  
      const docId = `${formData.nome}-${formattedDiaBanco}`;
  
      // Salva no Firestore com o Timestamp
      await setDoc(doc(collection(db, "pontos"), docId), {
        ...formData,
        dia: diaTimestamp, // Salva como Timestamp do Firebase
      });
  
      // Limpar os campos após o sucesso
      setFormData({
        falta: false,
        nome: "",
        dia: "",
        diaSemana: "",
        pontoEntrada: "00:00",
        pontoAlmoco: "00:00",
        pontoVolta: "00:00",
        pontoSaida: "00:00",
        atrasos: "00:00",
        horasExtras: "00:00",
        atestado: "",
      });
  
      toast.success(`Dados salvos de ${formData.nome} com sucesso!`);
      setSenha("");
      setIsSenhaValida(false);
    } catch (error) {
      console.error("Erro ao salvar os dados:", error);
      alert("Erro ao salvar os dados. Tente novamente.");
    }
  };
  

  return (
    <div className=" flex flex-col text-white p-6">
      <div className="mb-8">
        <h1 className="text-4xl mb-2">Ponto Maps</h1>
        <p>Pontos e Faltas Manuais</p>
      </div>
      <div className="flex justify-start gap-6">
        <div className="w-[600px] bg-[#35486E] p-10 gap-4 flex flex-col items-center justify-center rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Registre Pontos</h2>
          <div className="grid grid-cols-2 gap-4 w-full">
            <label className="flex flex-col col-span-2">
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
                value={formData.dia.split("/").reverse().join("-")}
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
                <option value="">Selecione o dia</option>
                <option value="Segunda-feira">Segunda</option>
                <option value="Terca-feira">Terça</option>
                <option value="Quarta-feira">Quarta</option>
                <option value="Quinta-feira">Quinta</option>
                <option value="Sexta-feira">Sexta</option>
                <option value="Sabado">Sábado</option>
              </select>
            </label>
            {[
              { label: "Ponto de Entrada", name: "pontoEntrada" },
              { label: "Ponto de Almoço", name: "pontoAlmoco" },
              { label: "Ponto de Volta", name: "pontoVolta" },
              { label: "Ponto de Saída", name: "pontoSaida" },
              { label: "Horas Extras", name: "horasExtras" },
              { label: "Atraso", name: "atrasos" },
            ].map(({ label, name }) => (
              <label key={name} className="flex flex-col">
                <span>{label}:</span>
                <input
                  type="text"
                  name={name}
                  value={String(formData[name as keyof FormData])}
                  onChange={handleInputChange}
                  className="p-2 rounded bg-gray-200 text-black"
                />
              </label>
            ))}
            <label className="flex flex-col col-span-2">
              <span>Falta:</span>
              <div className="flex gap-4">
                <label>
                  <input
                    type="radio"
                    name="falta"
                    value="sim"
                    checked={formData.falta === true}
                    onChange={handleInputChange}
                  />
                  Sim
                </label>
                <label>
                  <input
                    type="radio"
                    name="falta"
                    value="nao"
                    checked={formData.falta === false}
                    onChange={handleInputChange}
                  />
                  Não
                </label>
              </div>
            </label>
            <label className="flex flex-col">
              <span>Atestado:</span>
              <input
                type="text"
                name="atestado"
                value={formData.atestado}
                onChange={handleInputChange}
                className="p-2 rounded bg-gray-200 text-black"
              />
            </label>
            <label className="flex flex-col col-span-2">
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
              disabled={!isSenhaValida}
              className={`bg-blue-500 text-white p-2 rounded hover:bg-blue-600 col-span-2 ${
                !isSenhaValida ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};
