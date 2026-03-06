const YOOKASSA_BASE_URL = 'https://api.yookassa.ru/v3';

export interface YooKassaPayment {
  id: string;
  status: string;
  amount: { value: string; currency: string };
  confirmation: { type: string; confirmation_url: string };
  metadata: Record<string, string>;
}

function getAuthHeader(): string {
  const credentials = `${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

export async function createPayment(params: {
  amountKopecks: number;
  description: string;
  returnUrl: string;
  metadata: Record<string, string>;
  idempotencyKey: string;
}): Promise<YooKassaPayment> {
  const res = await fetch(`${YOOKASSA_BASE_URL}/payments`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
      'Idempotence-Key': params.idempotencyKey,
    },
    body: JSON.stringify({
      amount: {
        value: (params.amountKopecks / 100).toFixed(2),
        currency: 'RUB',
      },
      confirmation: {
        type: 'redirect',
        return_url: params.returnUrl,
      },
      capture: true,
      description: params.description,
      metadata: params.metadata,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`YooKassa error ${res.status}: ${err}`);
  }

  return res.json() as Promise<YooKassaPayment>;
}

export async function getPayment(paymentId: string): Promise<YooKassaPayment> {
  const res = await fetch(`${YOOKASSA_BASE_URL}/payments/${paymentId}`, {
    headers: { 'Authorization': getAuthHeader() },
  });

  if (!res.ok) {
    throw new Error(`YooKassa getPayment error ${res.status}`);
  }

  return res.json() as Promise<YooKassaPayment>;
}

// YooKassa IP whitelist for webhook verification
export const YOOKASSA_IPS = [
  '185.71.76.0/27',
  '185.71.77.0/27',
  '77.75.153.0/25',
  '77.75.156.11',
  '77.75.156.35',
];

function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, part) => (acc << 8) + parseInt(part), 0);
}

function cidrContains(cidr: string, ip: string): boolean {
  if (!cidr.includes('/')) return cidr === ip;
  const [network, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr);
  const mask = ~((1 << (32 - prefix)) - 1);
  return (ipToNumber(network) & mask) === (ipToNumber(ip) & mask);
}

export function isYooKassaIp(ip: string): boolean {
  return YOOKASSA_IPS.some(range => cidrContains(range, ip));
}
