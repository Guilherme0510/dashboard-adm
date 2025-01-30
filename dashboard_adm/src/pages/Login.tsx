import  { FormEvent, useState } from "react";
import { auth } from "../config/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { assets } from "../assets/assets";

export const Login = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Por favor, preencha ambos os campos.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Logado com sucesso");
      navigate("/home");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.log("Erro capturado:", error);

      if (error.code === "auth/invalid-credential/password") {
        toast.error("Senha incorreta. Tente novamente.");
      } else if (error.code === "auth/user-not-found") {
        toast.error("Este e-mail não está cadastrado.");
      } else if (error.code === "auth/invalid-email") {
        toast.error("E-mail inválido. Por favor, verifique o formato.");
      } else {
        toast.error("Erro ao logar. Tente novamente mais tarde.");
      }
    }
  };

  return (
    <div className="relative h-screen flex flex-col items-center justify-center">
      <img src={assets.img_login} className="h-screen absolute w-full" alt="" />
      <form
        onSubmit={handleLoginSubmit}
        className="relative z-10 bg-white shadow-lg p-10 rounded-lg flex flex-col gap-6 w-80"
      >
        <h2 className="text-xl font-bold text-gray-700 text-center">Login</h2>
        <input
          type="email"
          className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white rounded-lg p-3 hover:bg-blue-600 transition"
        >
          Login
        </button>
      </form>
      <ToastContainer />
    </div>
  );
};
