export const MessageAnalyzer = {
    keywords: {
      positive: ['ótimo', 'bom', 'gostei', 'interesse', 'sim', 'claro', 'preço', 'comprar', 'topo', 'valor'],
      negative: ['não', 'ruim', 'caro', 'parar', 'sair', 'cancelar', 'odeio', 'nunca'],
      intents: {
        purchase: ['preço', 'valor', 'quanto', 'custo', 'comprar', 'pagar', 'pix', 'cartão'],
        question: ['como', 'onde', 'quando', 'funciona', 'dúvida', '?'],
        complaint: ['problema', 'defeito', 'erro', 'não funciona', 'estragado', 'atraso'],
      },
      stages: {
        'Novo Lead': ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'saber mais'],
        'Qualificado': ['interesse', 'funciona', 'detalhes', 'agendar'],
        'Negociação': ['preço', 'valor', 'desconto', 'pagamento', 'condições'],
        'Fechado': ['comprovante', 'paguei', 'enviado', 'fechado'],
        'Perdido': ['não tenho interesse', 'caro', 'agora não']
      }
    },
  
    analyze: (message) => {
      if (!message) return { sentiment: 'neutral', intent: 'unknown', stage_suggestion: null };
  
      const lowerMsg = message.toLowerCase();
      
      // Sentiment Analysis
      let sentimentScore = 0;
      MessageAnalyzer.keywords.positive.forEach(w => { if(lowerMsg.includes(w)) sentimentScore++; });
      MessageAnalyzer.keywords.negative.forEach(w => { if(lowerMsg.includes(w)) sentimentScore--; });
      
      let sentiment = 'neutral';
      if (sentimentScore > 0) sentiment = 'positive';
      if (sentimentScore < 0) sentiment = 'negative';
  
      // Intent Detection
      let bestIntent = 'unknown';
      let maxIntentMatches = 0;
      
      Object.entries(MessageAnalyzer.keywords.intents).forEach(([intent, keywords]) => {
        const matches = keywords.filter(k => lowerMsg.includes(k)).length;
        if (matches > maxIntentMatches) {
          maxIntentMatches = matches;
          bestIntent = intent;
        }
      });
  
      // Funnel Stage Suggestion
      let suggestedStage = 'Novo Lead'; // Default
      let maxStageMatches = 0;
  
      Object.entries(MessageAnalyzer.keywords.stages).forEach(([stage, keywords]) => {
         const matches = keywords.filter(k => lowerMsg.includes(k)).length;
         if (matches > maxStageMatches) {
             maxStageMatches = matches;
             suggestedStage = stage;
         }
      });
  
      return {
        sentiment,
        intent: bestIntent,
        stage_suggestion: suggestedStage,
        keywords_matched: maxStageMatches + maxIntentMatches
      };
    }
  };