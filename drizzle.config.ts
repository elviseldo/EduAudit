
import { defineConfig } from "drizzle-kit";

// Hardcoded connection for your private local EduAudit project
const supabaseUrl = "postgresql://postgres:85aWG6RQU9NeYVfk@db.ssgjbqmqknqbryrcvlft.supabase.co:5432/postgres";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: supabaseUrl,
  },
});