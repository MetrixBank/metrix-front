/**
 * Shared utility for client scoring and intelligence calculations.
 * Ensures consistency across CustomersTab and SalesCopilot (DataIntelligenceSection).
 */

export const calculateClientIntelligence = (clientData) => {
    const { 
        lastContactDate, 
        totalPurchases, 
        ltv, 
        totalVisits,
        temperatureOverride 
    } = clientData;

    let score = 0;
    
    // 1. Recency (30%)
    const daysSince = lastContactDate ? (new Date() - new Date(lastContactDate)) / (1000 * 60 * 60 * 24) : 999;
    if (daysSince < 15) score += 30;
    else if (daysSince < 30) score += 20;
    else if (daysSince < 60) score += 10;
    
    // 2. Frequency (20%)
    if (totalVisits > 5) score += 20;
    else if (totalVisits > 2) score += 10;

    // 3. Monetary (30%)
    if (ltv > 5000) score += 30;
    else if (ltv > 1000) score += 15;

    // 4. Affinity (20% - Has bought products)
    if (totalPurchases > 0) score += 20;

    // Cap score at 100
    score = Math.min(100, score);

    // Determine Temperature
    let temperature = 'Cold';
    if (score >= 70) temperature = 'Hot';
    else if (score >= 40) temperature = 'Warm';
    
    // Special Rule for "At Risk": High value but cold (silent for > 90 days)
    if (ltv > 2000 && daysSince > 90) temperature = 'At Risk';

    // Override if provided
    if (temperatureOverride) temperature = temperatureOverride;

    // Calculate Potential (Heuristic)
    // Base potential + boosters based on temperature/value
    let potential = 500; // Base baseline
    
    if (ltv > 2000) potential = 1000; // Higher baseline for valuable clients
    if (temperature === 'Hot') potential += 1500;
    if (temperature === 'Warm') potential += 500;
    if (temperature === 'At Risk') potential += 2000; // High win-back potential

    // Conversion Probability
    let conversionProbability = 20;
    if (score >= 80) conversionProbability = 90;
    else if (score >= 50) conversionProbability = 50;
    
    // Adjust probability for At Risk
    if (temperature === 'At Risk') conversionProbability = 10;

    return {
        score,
        temperature,
        potential,
        conversionProbability
    };
};