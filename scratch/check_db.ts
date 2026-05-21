import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: "backend/.env" });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase.from("profiles").select("*").limit(1);
  if (error) {
    console.error("Error fetching profiles:", error);
  } else {
    console.log("Profiles data sample / columns:", data);
  }
}

main().catch(console.error);
