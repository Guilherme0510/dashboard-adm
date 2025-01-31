import { useEffect, useState } from "react";
import { ResponsiveLine } from "@nivo/line";
import { db } from "../config/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import _ from "lodash";

// Definir a tipagem para os dados
interface Venda {
  data: string;
  valorVenda: number;
}

interface VendaPorMes {
  x: string;
  label: string;
  y: number;
}

interface ResponsiveLineChartProps {
  width?: number; // Tamanho da largura
  height?: number; // Tamanho da altura
}

const ResponsiveLineChart: React.FC<ResponsiveLineChartProps> = ({
  width = 800,
  height = 400,
}) => {
  const [dados, setDados] = useState<{ id: string; data: VendaPorMes[] }[]>([]);

  useEffect(() => {
    const fetchVendasPorMes = async () => {
      // Acessa as vendas no Firestore
      const vendasCollection = collection(db, "vendas");
      const vendasSnapshot = await getDocs(vendasCollection);
      const vendasData: Venda[] = vendasSnapshot.docs.map(
        (doc) => doc.data() as Venda
      );

      // Agrupa as vendas por mês e ano
      const vendasAgrupadas = _.groupBy(vendasData, (venda) => {
        const date = new Date(venda.data);
        const mesAno = `${date.getFullYear()}-${date.getMonth() + 1}`;
        return mesAno;
      });

      // Formata as vendas por mês
      const vendasPorMes: VendaPorMes[] = _.map(
        vendasAgrupadas,
        (vendas, mesAno) => {
          const [ano, mes] = mesAno.split("-");
          const mesNome = new Date(+ano, +mes - 1).toLocaleString("default", {
            month: "long",
          });
          return {
            x: mesAno,
            label: `${mesNome} ${ano}`,
            y: vendas.length,
          };
        }
      );

      // Ordena as vendas por mês
      const vendasOrdenadas = _.orderBy(vendasPorMes, ["x"], ["asc"]);

      setDados([{ id: "Vendas", data: vendasOrdenadas }]);
    };

    fetchVendasPorMes();
  }, []);

  return (
    <div style={{ height, width }}>
      <ResponsiveLine
        data={dados}
        margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
        xScale={{ type: "point" }}
        yScale={{
          type: "linear",
          min: "auto",
          max: "auto",
          stacked: true,
        }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "Meses",
          legendOffset: 36,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "Vendas",
          legendOffset: -40,
        }}
        pointSize={8}
        pointColor={{ theme: "background" }}
        pointBorderWidth={2}
        pointBorderColor={{ from: "serieColor" }}
        pointLabel="yFormatted"
        pointLabelYOffset={-12}
        enableTouchCrosshair={true}
        useMesh={true}
        
        colors={["#ff8c00"]}
        theme={{
          axis: {
            legend: {
              text: { fill: "#fff" },
            },
            ticks: {
              text: { fill: "#fff" },
            },
          },
        }}
        legends={[
          {
            anchor: "bottom-right",
            direction: "column",
            justify: false,
            translateX: 100,
            itemsSpacing: 0,
            itemDirection: "left-to-right",
            itemWidth: 80,
            itemHeight: 20,
            itemOpacity: 0.75,
            symbolSize: 12,
            symbolShape: "circle",
            symbolBorderColor: "rgba(0, 0, 0, .5)",
            effects: [
              {
                on: "hover",
                style: {
                  itemBackground: "rgba(0, 0, 0, .03)",
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
        tooltip={({ point }) => (
          <div
            style={{
              padding: "10px",
              background: "#333",
              color: "#fff",
              borderRadius: "5px",
            }}
          >
                        <strong>{point.data.xFormatted}</strong>
                        <br />
            Vendas: {point.data.yFormatted}
          </div>
        )}
      />
    </div>
  );
};

export default ResponsiveLineChart;
