/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

interface Ponto {
  nome: any;
  diaSemana: any;
  dia: any;
  pontoEntrada: any;
  pontoAlmoco: any;
  pontoVolta: any;
  pontoSaida: any;
  horasExtras: any;
  atrasos: any;
  falta: boolean;
  atestado: any;
}

interface EditPontoProps {
  pontoSelecionado: Ponto;
  setPontoSelecionado: (ponto: Ponto) => void;
  salvarDados: () => void;
  fecharModal: () => void;
  senha: string;
  verificarSenha: (senha: string) => void;
  senhaCorreta: boolean;
}

export const EditPonto: React.FC<EditPontoProps> = ({
  pontoSelecionado,
  setPontoSelecionado,
  salvarDados,
  fecharModal,
  senha,
  verificarSenha,
  senhaCorreta,
}) => {
  return (
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
              value={
                pontoSelecionado?.dia && pontoSelecionado.dia.seconds
                  ? new Date(pontoSelecionado.dia.seconds * 1000)
                      .toLocaleDateString("pt-BR")
                      .split(" ")[0]
                      .split("/")
                      .reverse()
                      .join("-")
                  : ""
              }
              onChange={(e) => {
                const novaData = new Date(e.target.value);
                novaData.setHours(novaData.getHours() + 3);
                setPontoSelecionado({
                  ...pontoSelecionado,
                  dia: novaData,
                });
              }}
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
            <div className="mt-2">
              <label className="block font-bold mb-1">Atestado</label>
              <input
                type="text"
                value={pontoSelecionado?.atestado || ""}
                onChange={(e) =>
                  setPontoSelecionado({
                    ...pontoSelecionado,
                    atestado: e.target.value,
                  })
                }
                placeholder="Insira o link do atestado"
                className="p-2 border rounded w-full text-black"
              />
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
  );
};
