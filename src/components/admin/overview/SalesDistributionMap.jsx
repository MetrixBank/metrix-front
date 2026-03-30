import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Map, Flag, User, DollarSign, Calendar } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, formatDate } from '@/lib/utils';

const brazilGeoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/brazil/brazil-states.json";

const stateCentroids = {
    'SP': [-46.6333, -23.5505], 'RJ': [-43.1729, -22.9068], 'MG': [-44.5550, -18.5122],
    'BA': [-41.2909, -12.9611], 'RS': [-51.2287, -30.0346], 'PR': [-51.1696, -25.2521],
    'SC': [-48.8454, -27.2423], 'GO': [-49.2558, -16.6809], 'DF': [-47.8825, -15.7942],
    'MT': [-55.4229, -15.5989], 'MS': [-54.6295, -20.4435], 'ES': [-40.3378, -20.3155],
    'PE': [-34.8770, -8.0476], 'CE': [-38.5267, -3.7319], 'MA': [-44.3028, -2.5307],
    'PI': [-42.8122, -5.0919], 'RN': [-35.2094, -5.7945], 'PB': [-34.8630, -7.1195],
    'AL': [-35.7359, -9.6658], 'SE': [-37.0731, -10.9167], 'TO': [-48.3336, -10.1838],
    'PA': [-52.0886, -1.4558], 'AP': [-51.0664, 0.0349], 'AM': [-60.0217, -3.1190],
    'RR': [-60.6714, 2.8235], 'AC': [-67.8100, -9.9747], 'RO': [-63.9038, -8.7619]
};

const SalesDistributionMap = ({ salesByState }) => {
  const [selectedState, setSelectedState] = useState(null);
  const soldToStates = useMemo(() => Object.keys(salesByState || {}), [salesByState]);
  
  const salesForSelectedState = useMemo(() => {
    if (!selectedState || !salesByState) return [];
    return salesByState[selectedState]?.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date)) || [];
  }, [selectedState, salesByState]);

  return (
    <>
      <Card className="card-gradient shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-gradient flex items-center">
            <Map className="w-6 h-6 mr-3" />
            Distribuição de Vendas no Brasil
          </CardTitle>
          <CardDescription>
            {soldToStates.length > 0 
              ? "Clique nas bandeiras para ver os detalhes das vendas em cada estado."
              : "Ainda não há dados de vendas para exibir no mapa."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[450px] w-full p-0">
            {soldToStates.length > 0 ? (
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 750, center: [-54, -15] }}
                style={{ width: '100%', height: '100%' }}
              >
                <Geographies geography={brazilGeoUrl}>
                  {({ geographies }) =>
                    geographies.map(geo => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={soldToStates.includes(geo.properties.sigla) ? "hsl(var(--primary) / 0.7)" : "hsl(var(--muted) / 0.5)"}
                        stroke="hsl(var(--background))"
                        style={{
                          default: { outline: 'none' },
                          hover: { fill: "hsl(var(--primary))", outline: 'none' },
                          pressed: { outline: 'none' },
                        }}
                      />
                    ))
                  }
                </Geographies>
                {soldToStates.map(stateAbbr => {
                  const coordinates = stateCentroids[stateAbbr];
                  if (!coordinates) return null;
                  
                  return (
                      <Marker key={stateAbbr} coordinates={coordinates}>
                          <motion.g
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: "spring", stiffness: 260, damping: 20 }}
                              className="cursor-pointer"
                              onClick={() => setSelectedState(stateAbbr)}
                          >
                              <Flag className="text-destructive w-6 h-6 hover:scale-125 transition-transform" fill="currentColor"/>
                          </motion.g>
                      </Marker>
                  )
                })}
              </ComposableMap>
            ) : (
                <div className="h-full w-full flex items-center justify-center">
                    <div className="text-center">
                        <Map className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Aguardando as primeiras vendas para popular o mapa.</p>
                    </div>
                </div>
            )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedState} onOpenChange={(isOpen) => !isOpen && setSelectedState(null)}>
        <DialogContent className="sm:max-w-[625px] bg-background/90 backdrop-blur-sm">
            <DialogHeader>
                <DialogTitle className="text-2xl text-gradient">Vendas em {selectedState}</DialogTitle>
                <DialogDescription>
                    Lista de vendas realizadas no estado de {selectedState}.
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[400px] pr-4 -mr-4">
                <div className="space-y-4">
                    {salesForSelectedState.length > 0 ? salesForSelectedState.map(sale => (
                        <div key={sale.id} className="p-3 border rounded-lg bg-background/50">
                            <p className="font-semibold flex items-center text-primary"><User className="w-4 h-4 mr-2"/> {sale.customer_name}</p>
                            <div className="grid grid-cols-2 gap-x-4 text-sm mt-2">
                                <p className="flex items-center"><DollarSign className="w-3 h-3 mr-1.5 text-muted-foreground"/> {formatCurrency(sale.sale_value)}</p>
                                <p className="flex items-center"><Calendar className="w-3 h-3 mr-1.5 text-muted-foreground"/> {formatDate(sale.visit_date)}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Consultor(a): {sale.consultant_name}</p>
                        </div>
                    )) : (
                        <p className="text-muted-foreground text-center py-8">Nenhuma venda encontrada para este estado.</p>
                    )}
                </div>
            </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SalesDistributionMap;