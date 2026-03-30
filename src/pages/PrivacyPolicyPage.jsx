import React from 'react';
import { Shield, Lock, Eye, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Shield className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-gradient">Política de Privacidade</h1>
            </div>
            <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
        </div>

        <Card className="backdrop-blur-sm bg-card/50 border-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="w-5 h-5" />
              Termos de Uso e Privacidade (LGPD)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground text-sm md:text-base leading-relaxed">
            <p>
              A sua privacidade é importante para nós. É política do METRIX respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site METRIX, e outros sites que possuímos e operamos.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-4 flex items-center gap-2">
                <Eye className="w-4 h-4" /> 1. Informações que coletamos
            </h3>
            <p>
              Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-4 flex items-center gap-2">
                <Lock className="w-4 h-4" /> 2. Uso de Dados e Segurança
            </h3>
            <p>
              Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis ​​para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.
            </p>
            <p>
              No contexto da nossa plataforma de gestão de equipes, dados de clientes finais cadastrados por distribuidores podem ser visíveis para líderes de equipe (Sub-Admins) de forma anonimizada ou mascarada para fins de conferência e gestão, respeitando a privacidade do cliente final.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-4">3. Compartilhamento de Dados</h3>
            <p>
              Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-4">4. Seus Direitos (LGPD)</h3>
            <p>
              Você é livre para recusar a nossa solicitação de informações pessoais, entendendo que talvez não possamos fornecer alguns dos serviços desejados. Você tem o direito de solicitar o acesso, a correção, a anonimização ou a exclusão de seus dados pessoais, conforme previsto na Lei Geral de Proteção de Dados (LGPD).
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-4">5. Compromisso do Usuário</h3>
            <p>
              O usuário se compromete a fazer uso adequado dos conteúdos e da informação que o METRIX oferece no site e com caráter enunciativo, mas não limitativo:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>A) Não se envolver em atividades que sejam ilegais ou contrárias à boa fé a à ordem pública;</li>
              <li>B) Não difundir propaganda ou conteúdo de natureza racista, xenofóbica, ou azar, qualquer tipo de pornografia ilegal, de apologia ao terrorismo ou contra os direitos humanos;</li>
              <li>C) Não causar danos aos sistemas físicos (hardwares) e lógicos (softwares) do METRIX, de seus fornecedores ou terceiros.</li>
            </ul>

            <p className="mt-6 pt-4 border-t border-border">
              Esta política é efetiva a partir de <strong>Novembro de 2024</strong>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;