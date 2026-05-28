import "dotenv/config";
import { db } from "./server/db.ts";
import { concepts } from "./shared/schema.ts";
import { desc } from "drizzle-orm";

async function checkRecent() {
  try {
    const recent = await db.select().from(concepts).orderBy(desc(concepts.createdAt)).limit(10);
    console.log("Recent Concepts:");
    recent.forEach(c => console.log(`- ${c.term} (${c.createdAt})`));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkRecent();
