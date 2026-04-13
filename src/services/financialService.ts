/**
 * Camada de integração futura com a API do Asaas (ou backend próprio).
 * Implementação atual: stubs com delay simulado — substituir por chamadas HTTP reais.
 */

export type CurrencyCode = 'BRL';

export interface AccountBalance {
  available: number;
  blocked: number;
  currency: CurrencyCode;
}

export interface CreatePixChargeInput {
  amount: number;
  description: string;
  payerName?: string;
  payerEmail?: string;
}

export interface CreateBoletoInput {
  amount: number;
  description: string;
  dueDate: string;
}

export interface CreatePaymentLinkInput {
  amount: number;
  description: string;
  name?: string;
}

export interface ChargeResult {
  id: string;
  status: 'pending' | 'confirmed';
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Saldo da conta (Asaas / wallet). Substituir por GET /finance/balance ou similar. */
export async function getBalance(): Promise<AccountBalance> {
  await delay(450);
  return {
    available: 12_847.32,
    blocked: 250.0,
    currency: 'BRL',
  };
}

/** Gera cobrança PIX. Substituir por POST Asaas payments (billingType PIX). */
export async function createPixCharge(
  input: CreatePixChargeInput,
): Promise<ChargeResult> {
  await delay(500);
  if (!input.amount || input.amount <= 0) {
    throw new Error('Valor inválido para cobrança PIX.');
  }
  return { id: `pix_stub_${Date.now()}`, status: 'pending' };
}

/** Gera boleto. Substituir por POST Asaas payments (billingType BOLETO). */
export async function createBoleto(input: CreateBoletoInput): Promise<ChargeResult> {
  await delay(550);
  if (!input.amount || input.amount <= 0) {
    throw new Error('Valor inválido para boleto.');
  }
  return { id: `boleto_stub_${Date.now()}`, status: 'pending' };
}

/** Cria link de pagamento. Substituir por POST payment links Asaas. */
export async function createPaymentLink(
  input: CreatePaymentLinkInput,
): Promise<ChargeResult> {
  await delay(500);
  if (!input.amount || input.amount <= 0) {
    throw new Error('Valor inválido para o link.');
  }
  return { id: `link_stub_${Date.now()}`, status: 'pending' };
}
