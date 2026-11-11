import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase = url && key ? createClient(url, key) : null;
export async function apiRequest(path: string, body?: object) {
  if (!supabase) throw new Error("Integração ainda não configurada.");
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Sua sessão expirou. Entre novamente.");
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new Error("Integração ainda não configurada.");
  const response = await fetch(base.replace(/\/$/, "") + path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok)
    throw new Error(
      response.status === 403
        ? "Você não tem acesso a esta sala."
        : response.status === 401
          ? "Sua sessão expirou. Entre novamente."
          : "Não foi possível conectar. Tente novamente.",
    );
  return response.json();
}
