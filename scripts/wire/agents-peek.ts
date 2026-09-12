import { db } from '../../db/client'; import { agents } from '../../db/schema';
(async()=>{const a=await db.select().from(agents);console.log('AGENT_COUNT',a.length);console.log(a.map(x=>`${x.ensName} [${x.status}]`).join(' | '));process.exit(0);})();
