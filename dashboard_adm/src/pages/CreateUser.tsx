import { useState } from "react";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

interface FormData {
  nome: string;
  email: string;
  password: string;
  cargo: string;
  disabled: boolean;
  primeiroPonto: string;
  segundoPonto: string;
  terceiroPonto: string;
  quartoPonto: string;
}

export const CreateUser: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    email: "",
    password: "",
    cargo: "",
    primeiroPonto: "",
    segundoPonto: "",
    terceiroPonto: "",
    quartoPonto: "",
    disabled: false,
  });
  const [message, setMessage] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const auth = getAuth();
    const db = getFirestore();

    if (!formData.cargo) {
      setMessage("Por favor, selecione um cargo.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const userId = userCredential.user.uid;
      await setDoc(doc(db, "usuarios", userId), {
        nome: formData.nome,
        email: formData.email,
        cargo: formData.cargo,
        primeiroPonto: formData.primeiroPonto,
        segundoPonto: formData.segundoPonto,
        terceiroPonto: formData.terceiroPonto,
        quartoPonto: formData.quartoPonto,
        createdAt: new Date().toISOString(),
        disabled: formData.disabled,
      });

      setMessage(`Usuário criado com sucesso: ${formData.email}`);
      setFormData({
        email: "",
        password: "",
        cargo: "",
        nome: "",
        primeiroPonto: "",
        segundoPonto: "",
        terceiroPonto: "",
        quartoPonto: "",
        disabled: false,
      });
      toast.success("Usuário criado com sucesso");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setMessage(error.message || "Erro ao criar usuário");
      toast.error("Erro ao criar usuário");
    }
  };

  return (
    <div className="p-4">
      <div className="mb-8">
        <h1 className="text-4xl mb-2">Criação de Usuário</h1>
        <p>Crie o seu próximo usuário</p>
      </div>
      {message && <div className="mb-4 text-sm text-red-500">{message}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <input
            id="nome"
            name="nome"
            type="text"
            value={formData.nome}
            onChange={handleChange}
            placeholder="Digite o nome e sobrenome do usuário"
            className="mt-1 block w-full p-3 bg-gray-500 text-white border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div className="relative">
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Digite o email do usuário"
            className="mt-1 block w-full p-3 bg-gray-500 text-white border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div className="relative">
          <input
            id="primeiroPonto"
            name="primeiroPonto"
            type="primeiroPonto"
            value={formData.primeiroPonto}
            onChange={handleChange}
            placeholder="Digite o primeiro ponto a ser batido do usuário"
            className="mt-1 block w-full p-3 bg-gray-500 text-white border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div className="relative">
          <input
            id="segundoPonto"
            name="segundoPonto"
            type="segundoPonto"
            value={formData.segundoPonto}
            onChange={handleChange}
            placeholder="Digite o segundo ponto a ser batido do usuário"
            className="mt-1 block w-full p-3 bg-gray-500 text-white border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div className="relative">
          <input
            id="terceiroPonto"
            name="terceiroPonto"
            type="terceiroPonto"
            value={formData.terceiroPonto}
            onChange={handleChange}
            placeholder="Digite o terceiro ponto a ser batido do usuário"
            className="mt-1 block w-full p-3 bg-gray-500 text-white border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div className="relative">
          <input
            id="quartoPonto"
            name="quartoPonto"
            type="quartoPonto"
            value={formData.quartoPonto}
            onChange={handleChange}
            placeholder="Digite o quarto ponto a ser batido do usuário"
            className="mt-1 block w-full p-3 bg-gray-500 text-white border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            placeholder="Digite a senha do usuário"
            className="mt-1 block w-full p-3 bg-gray-500 text-white border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-4 text-gray-300 hover:text-white"
          >
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
          </button>
        </div>
        <div className="relative">
          <select
            id="cargo"
            name="cargo"
            value={formData.cargo}
            onChange={handleChange}
            className="mt-1 block w-full p-3 bg-gray-500 text-white border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="Selecione o cargo">Selecione o cargo</option>
            <option className="text-black" value="vendas">
              Vendas
            </option>
            <option className="text-black" value="monitoria">
              Monitoria
            </option>
            <option className="text-black" value="cobranca">
              Cobrança
            </option>
            <option className="text-black" value="marketing">
              Marketing
            </option>
            <option className="text-black" value="financeiro">
              Financeiro
            </option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
        >
          Criar Usuário
        </button>
      </form>
      <ToastContainer />
    </div>
  );
};
