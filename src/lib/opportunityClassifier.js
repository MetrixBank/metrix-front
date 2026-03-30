/**
 * Analyzes opportunity data to determine classification scores.
 * 
 * @param {Object} opportunityData - { stage, last_message, days_since_contact }
 * @returns {Object} Classification result { temperature, probability, priority, risk }
 */
export const classifyOpportunity = (opportunityData) => {
    const { 
        stage = 'new', 
        last_message = '', 
        days_since_contact = 0,
        interaction_count = 1
    } = opportunityData;

    let tempScore = 50; // Base score
    const reasoning = [];

    // 1. Recency Factor
    if (days_since_contact === 0) {
        tempScore += 20;
        reasoning.push("Contatado hoje (+20)");
    } else if (days_since_contact <= 2) {
        tempScore += 10;
        reasoning.push("Contato recente (+10)");
    } else if (days_since_contact > 7) {
        tempScore -= 15;
        reasoning.push("Inativo > 7 dias (-15)");
    } else if (days_since_contact > 30) {
        tempScore -= 40;
        reasoning.push("Inativo > 30 dias (-40)");
    }

    // 2. Message Keyword Analysis (Sentiment Proxy)
    const msg = (last_message || '').toLowerCase();
    if (msg.includes('preço') || msg.includes('valor') || msg.includes('quanto')) {
        tempScore += 10;
        reasoning.push("Interesse em preço (+10)");
    }
    if (msg.includes('comprar') || msg.includes('fechar') || msg.includes('contrato') || msg.includes('pagamento')) {
        tempScore += 25;
        reasoning.push("Intenção de compra forte (+25)");
    }
    if (msg.includes('dúvida') || msg.includes('ajuda')) {
        tempScore += 5;
        reasoning.push("Pedido de ajuda (+5)");
    }
    if (msg.includes('não tenho interesse') || msg.includes('pare')) {
        tempScore -= 50;
        reasoning.push("Negativo explícito (-50)");
    }

    // 3. Stage Factor
    const stageScores = {
        'new': 0,
        'contacted': 10,
        'interest': 20,
        'presentation': 30,
        'negotiation': 40,
        'closing': 50,
        'closed_won': 0,
        'closed_lost': -20
    };
    tempScore += (stageScores[stage] || 0);

    // Normalize Temperature (0-100)
    tempScore = Math.min(100, Math.max(0, tempScore));

    // Determine Labels
    let temperatureLabel = 'cold';
    if (tempScore >= 80) temperatureLabel = 'hot';
    else if (tempScore >= 50) temperatureLabel = 'warm';

    // Probability Calculation
    let probScore = tempScore * 0.9; // Correlation with temperature
    if (stage === 'negotiation') probScore = Math.max(probScore, 60);
    if (stage === 'closing') probScore = Math.max(probScore, 80);
    probScore = Math.round(Math.min(100, Math.max(0, probScore)));

    // Risk Calculation
    let riskLevel = 'low';
    if (days_since_contact > 14 && stage !== 'closed_won' && stage !== 'closed_lost') riskLevel = 'high';
    if (probScore < 30 && stage === 'negotiation') riskLevel = 'high';

    return {
        temperature_score: tempScore,
        temperature: temperatureLabel,
        probability_score: probScore,
        risk_level: riskLevel,
        priority_level: tempScore > 75 ? 'high' : (tempScore > 40 ? 'medium' : 'low'),
        reasoning
    };
};