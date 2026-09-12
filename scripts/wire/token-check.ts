import { PrivyClient } from '@privy-io/server-auth';
const privy = new PrivyClient(process.env.PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!);
(async () => {
  try {
    const { accessToken } = await privy.getTestAccessToken();
    console.log('TEST_TOKEN_OK len=', accessToken.length);
    const claims = await privy.verifyAuthToken(accessToken, process.env.PRIVY_VERIFICATION_KEY || undefined);
    console.log('VERIFIED userId=', claims.userId, 'appId=', claims.appId);
  } catch (e) {
    console.log('TOKEN_ERR:', e instanceof Error ? e.message : String(e));
  }
})();
