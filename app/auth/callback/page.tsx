"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { safeInternalPath } from "../../../lib/auth";

function CallbackContent() {
  const router = useRouter();
  const search = useSearchParams();
  const [message, setMessage] = useState("Confirmando sua conta…");
  useEffect(() => {
    let active = true;
    async function finish() {
      if (!supabase) {
        setMessage("Integração ainda não configurada.");
        return;
      }
      const tokenHash = search.get("token_hash");
      const type = search.get("type");
      const code = search.get("code");
      if (tokenHash && (type === "signup" || type === "email" || type === "recovery")) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (error) {
          if (active) setMessage("Este link expirou ou já foi usado. Solicite um novo e-mail.");
          return;
        }
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (active) setMessage("Não foi possível validar este link. Solicite um novo e-mail.");
          return;
        }
      }
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        if (active) setMessage("Não foi possível confirmar a sessão. Abra novamente o link enviado por e-mail.");
        return;
      }
      if (active) router.replace(safeInternalPath(search.get("next"), "/salas"));
    }
    void finish();
    return () => { active = false; };
  }, [router, search]);
  return <main className="portal" id="conteudo"><div className="portal-container"><p role="status">{message}</p></div></main>;
}

export default function AuthCallbackPage() {
  return <Suspense><CallbackContent /></Suspense>;
}
