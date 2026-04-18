import { Hono } from 'hono'
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { folders } from './db/schema';
import { Pool } from "pg";
import { cors } from 'hono/cors';
import { auth } from './lib/auth';
import { requireauth } from './middleware/requireauth';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});
export const db = drizzle({ client: pool });

// Extend Hono's context type so c.get("user") is typed and access  relevant docs to set this up i used docs  in https://better-auth.com/docs/integrations/hono 
type Variables = {
  user: typeof auth.$Infer.Session.user;
  session: typeof auth.$Infer.Session.session;
};

const app = new Hono<{ Variables: Variables }>();
app.use(
	"*", 
	cors({
		origin: process.env.FRONTEND_URL ?? "http://localhost:3001",
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET","PUT","DELETE", "OPTIONS"],
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => {
	return auth.handler(c.req.raw);
});

app.get('/', (c) => {
  return c.text('pslmp backend is running !')
})

app.get('/test-db', async (c) => {
  try {
    // Attempting a simple query. If the DB is unreachable, this will throw an error.
    const result = await db.select().from(folders).limit(1)
    
    return c.json({ 
      success: true, 
      message: "Database connected successfully! We are ready to build.", 
      data: result 
    })
  } catch (error) {
    console.error("DB Connection Error:", error)
    return c.json({ 
      success: false, 
      message: "Database connection failed. Check Docker.", 
      error: String(error) 
    }, 500)
  }
})

app.get('/me',requireauth, async(c)=>{
   const user = c.get("user")
   const session = c.get("session")

   return c.json({user:user,session:session}) 
})

export default app
