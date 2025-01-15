import React, { useState } from "react";
import { GeographicMap } from "../components/GeographicMap";

export const GraficoGeografico = () => {
  const [loading] = useState(false);

  return (
    <div className="p-4">
      <div className="mb-8">
        <h1 className="text-4xl mb-2">Gráfico Geográfico</h1>
        <p>Visualize onde há maiores números de vendas</p>
        <p className="mt-2 text-gray-600">
          O gráfico exibe a distribuição geográfica das vendas em diferentes regiões. 
          A intensidade de cor indica o volume de vendas, com as áreas mais escuras representando maior número de vendas.
        </p>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <span>Carregando gráfico...</span>
        </div>
      ) : (
        <div className="p-4 rounded-lg shadow-md">
          <GeographicMap 
  mapConfig={{
    scale: 250,
    center: [-50, -20],
    width: 400,
    height: 250,
  }} 
  showTopStatesLegend={true}
/>
        </div>
      )}
    </div>
  );
};
