import React, { useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { Tooltip } from 'react-tooltip';
import { db } from '../config/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import geoBrazil from '../assets/geoBrazil.json';

interface Venda {
  estado: string;
  valorVenda: number;
}

const estadosMap: { [key: string]: string } = {
  "Acre": "AC",
  "Alagoas": "AL",
  "Amapá": "AP",
  "Amazonas": "AM",
  "Bahia": "BA",
  "Ceará": "CE",
  "Espírito Santo": "ES",
  "Goiás": "GO",
  "Maranhão": "MA",
  "Mato Grosso": "MT",
  "Mato Grosso do Sul": "MS",
  "Minas Gerais": "MG",
  "Pará": "PA",
  "Paraíba": "PB",
  "Paraná": "PR",
  "Pernambuco": "PE",
  "Piauí": "PI",
  "Rio de Janeiro": "RJ",
  "Rio Grande do Norte": "RN",
  "Rio Grande do Sul": "RS",
  "Rondônia": "RO",
  "Roraima": "RR",
  "Santa Catarina": "SC",
  "São Paulo": "SP",
  "Sergipe": "SE",
  "Tocantins": "TO",
  "Distrito Federal": "DF",
};

interface GeographicMapProps {
  mapConfig?: {
    scale?: number;
    center?: [number, number];
    width?: number;
    height?: number;
    colorRange?: {
      low: string;
      medium: string;
      high: string;
    };
  };
  vendasData?: Venda[];
  showTopStatesLegend?: boolean;
}

export const GeographicMap: React.FC<GeographicMapProps> = ({ mapConfig, vendasData, showTopStatesLegend = true }) => {
  const [vendasPorEstado, setVendasPorEstado] = useState<{ estado: string; vendas: number }[]>([]);
  const [tooltipContent, setTooltipContent] = useState<string>('Carregando...');
  const [topStates, setTopStates] = useState<{ estado: string; vendas: number }[]>([]);

  useEffect(() => {
    const fetchVendas = async () => {
      const data = vendasData || []; 
      if (!data.length) {
        const vendasCollection = collection(db, 'vendas');
        const vendasSnapshot = await getDocs(vendasCollection);
        const vendasFromFirestore: Venda[] = vendasSnapshot.docs.map((doc) => doc.data() as Venda);
        data.push(...vendasFromFirestore); 
      }

      const vendasPorEstado = data.reduce<{ estado: string; vendas: number }[]>((acc, venda) => {
        const estadoSigla = estadosMap[venda.estado.trim()] || venda.estado.trim();
        if (!estadoSigla) return acc;

        const existing = acc.find(v => v.estado === estadoSigla);
        if (existing) {
          existing.vendas += 1;
        } else {
          acc.push({ estado: estadoSigla, vendas: 1 });
        }
        return acc;
      }, []);

      setVendasPorEstado(vendasPorEstado);

      const sortedStates = vendasPorEstado.sort((a, b) => b.vendas - a.vendas).slice(0, 3);
      setTopStates(sortedStates);
    };

    fetchVendas();
  }, [vendasData]);

  const getColorForState = (vendas: number) => {
    const { low = '#FF7043', medium = '#FFEB7A', high = '#66BB6A' } = mapConfig?.colorRange || {};
    if (vendas > 25) return high;
    if (vendas > 15) return medium;
    return low;
  };

  return (
    <div className="flex">
      <div className="flex-1">
        <ComposableMap
          projection="geoMercator"
          width={mapConfig?.width || 400}
          height={mapConfig?.height || 350}
          projectionConfig={{
            scale: mapConfig?.scale || 900,
            center: mapConfig?.center || [-52, -15],
          }}
        >
          <Geographies geography={geoBrazil}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const vendasEstado = vendasPorEstado.find(v => v.estado === geo.properties.sigla);
                const vendas = vendasEstado ? vendasEstado.vendas : 0;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    data-tooltip-id="geographic"
                    onMouseEnter={() =>
                      setTooltipContent(
                        vendas > 0
                          ? `Vendas no estado de ${geo.properties.name}: ${vendas}`
                          : `Nenhuma venda no estado de ${geo.properties.name}`
                      )
                    }
                    style={{
                      default: {
                        fill: getColorForState(vendas),
                        outline: 'none',
                      },
                      hover: {
                        fill: '#00F',
                        outline: 'none',
                      },
                      pressed: {
                        fill: '#fff',
                        outline: 'none',
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
        <Tooltip id="geographic" content={tooltipContent} />
      </div>

      {showTopStatesLegend && (
        <div className="ml-8">
          <h3 className="text-xl font-semibold mb-4">Top 3 Estados com Mais Vendas</h3>
          <div className="flex flex-col space-y-2">
            {topStates.map((state, index) => (
              <div key={state.estado} className="flex items-center">
                <span className="font-bold">{index + 1}. {state.estado}</span>
                <span className="ml-2">- {state.vendas} vendas</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
