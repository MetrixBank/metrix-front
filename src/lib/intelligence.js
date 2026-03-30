export const PRODUCT_ASSOCIATIONS = {
  'diabetes': 'Alcaline Max',
  'dor': 'Pulseira Magnética',
  'sono': 'Colchão Terapêutico',
  'energia': 'Combo Vitalidade',
  'stress': 'Pulseira Bioquântica',
  'coluna': 'Colchão Magnético'
};

export const calculateScoring = (clientData) => {
    let score = 0;
    const { lastContactDate, totalPurchases, ltv, totalVisits } = clientData;
    
    // Recency (30%)
    const daysSince = lastContactDate ? (new Date() - new Date(lastContactDate)) / (1000 * 60 * 60 * 24) : 999;
    if (daysSince < 15) score += 30;
    else if (daysSince < 30) score += 20;
    else if (daysSince < 60) score += 10;
    
    // Frequency (20%)
    if (totalVisits > 5) score += 20;
    else if (totalVisits > 2) score += 10;

    // Monetary (30%)
    if (ltv > 5000) score += 30;
    else if (ltv > 1000) score += 15;

    // Affinity (20% - Has bought products)
    if (totalPurchases > 0) score += 20;

    // Determine Temperature & Risk
    let temperature = 'Cold';
    if (score >= 70) temperature = 'Hot';
    else if (score >= 40) temperature = 'Warm';
    
    // Special Rule for "At Risk": High value but cold
    if (ltv > 2000 && daysSince > 90) temperature = 'At Risk';

    return { score, temperature };
};

export const getRecommendations = (clientData) => {
    const { pathologies = [], products = [] } = clientData;
    const recs = [];
    
    // Pathology based matching
    pathologies.forEach(path => {
        Object.keys(PRODUCT_ASSOCIATIONS).forEach(key => {
            if (path.toLowerCase().includes(key) && !products.some(p => p.includes(PRODUCT_ASSOCIATIONS[key]))) {
                recs.push({
                    productName: PRODUCT_ASSOCIATIONS[key],
                    reason: `Para: ${path}`
                });
            }
        });
    });
    
    // Refill logic
    if (products.some(p => p.toLowerCase().includes('alcaline')) && !products.some(p => p.toLowerCase().includes('refil'))) {
         recs.push({ productName: 'Refil Anual', reason: 'Manutenção Preventiva' });
    }
    
    // Deduplicate recommendations
    const uniqueRecs = [];
    const seen = new Set();
    recs.forEach(r => {
      if(!seen.has(r.productName)) {
        seen.add(r.productName);
        uniqueRecs.push(r);
      }
    });

    return uniqueRecs;
};

export const calculateRevenuePotential = (clientData, recommendations) => {
    const { ltv, temperature } = clientData;
    // Heuristic: Base potential + product value
    let base = 200; 
    if (ltv > 2000) base = 1000;
    if (temperature === 'Hot') base += 500;
    
    // Add potential value of recommended products (mock values)
    const prodValue = recommendations.length * 500; 
    return base + prodValue;
};

export const determineNextBestAction = (clientData, recommendations) => {
    const { temperature, products = [], objections = [] } = clientData;
    
    if (temperature === 'At Risk') return 'Reativar Cliente VIP - Urgente';
    if (temperature === 'Hot' && products.length === 0) return 'Fechar Primeira Venda';
    if (objections.some(o => o.toLowerCase().includes('preço'))) return 'Apresentar Parcelamento/Desconto';
    if (recommendations.length > 0) return `Oferecer ${recommendations[0].productName}`;
    if (temperature === 'Warm') return 'Enviar Conteúdo de Valor';
    return 'Agendar Contato de Relacionamento';
};