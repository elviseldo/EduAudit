import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

const connectionString = "postgresql://postgres:85aWG6RQU9NeYVfk@db.ssgjbqmqknqbryrcvlft.supabase.co:5432/postgres";

const client = postgres(connectionString);
export const db = drizzle(client, { schema });