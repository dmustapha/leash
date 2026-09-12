import { db } from '../../db/client';
import { users, orgs } from '../../db/schema';
(async () => {
  const u = await db.select().from(users);
  const o = await db.select().from(orgs);
  console.log('USERS:', JSON.stringify(u.map(x=>({id:x.id,privy:x.privyUserId,email:x.email})),null,0));
  console.log('ORGS:', JSON.stringify(o.map(x=>({id:x.id,owner:x.ownerId,ens:x.ensName,reg:x.registryAddress})),null,0));
  process.exit(0);
})();
