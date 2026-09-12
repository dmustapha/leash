// Manual replica of getTestAccessToken with an Origin header (Privy auth API requires one).
import { PrivyClient } from '@privy-io/server-auth';
const APP_ID = process.env.PRIVY_APP_ID!;
const SECRET = process.env.PRIVY_APP_SECRET!;
const BASE = process.env.PRIVY_API_URL || 'https://auth.privy.io';
const ORIGIN = process.env.PRIVY_ORIGIN || 'http://localhost:3000';
const basic = Buffer.from(`${APP_ID}:${SECRET}`).toString('base64');
const H = { 'privy-app-id': APP_ID, 'privy-client': 'server-auth:1.32.5', Authorization: `Basic ${basic}`, Origin: ORIGIN };

export async function mintTestToken(): Promise<string> {
  const cr = await fetch(`${BASE}/api/v1/apps/${APP_ID}/test_credentials`, { headers: H });
  if (!cr.ok) throw new Error(`test_credentials ${cr.status}: ${await cr.text()}`);
  const data = (await cr.json()).data as Array<{ email: string; otp_code: string }>;
  if (!data?.length) throw new Error('no test accounts');
  const { email, otp_code } = data[0];
  const ar = await fetch(`${BASE}/api/v1/passwordless/authenticate`, {
    method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code: otp_code }),
  });
  if (!ar.ok) throw new Error(`authenticate ${ar.status}: ${await ar.text()}`);
  return (await ar.json()).token as string;
}

if (process.argv[1]?.endsWith('mint-token.ts')) {
  (async () => {
    const token = await mintTestToken();
    const privy = new PrivyClient(APP_ID, SECRET);
    const claims = await privy.verifyAuthToken(token, process.env.PRIVY_VERIFICATION_KEY || undefined);
    console.log('MINT_OK userId=', claims.userId, 'appId=', claims.appId, 'tokenLen=', token.length);
  })().catch((e) => { console.error('MINT_ERR:', e instanceof Error ? e.message : e); process.exit(1); });
}
