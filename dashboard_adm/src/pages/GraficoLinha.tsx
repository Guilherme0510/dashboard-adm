import React from "react";
import ResponsiveLineChart from "../components/ResponsiveLine";

export const GraficoLinha = () => {
  return (
    <div className="h-screen flex flex-col text-white p-6">
      <div className="mb-8 flex gap-10">
        <div>
          <h1 className="text-4xl mb-2">Gráfico de Linha</h1>
          <p>Vizualize os dados dos meses</p>
        </div>
      </div>
      <ResponsiveLineChart height={600} width={1200}/>
    </div>
  );
};
