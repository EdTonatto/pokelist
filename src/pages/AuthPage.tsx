import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { AuthController } from "../lib/auth";
import { apiRequest, ApiError } from "../lib/api";
type Mode = "login" | "register" | "verify-email" | "forgot-password" | "reset-password";
const messages: Record<string,string> = {
  INVALID_CREDENTIALS: "E-mail ou senha incorretos.",

  EMAIL_ALREADY_REGISTERED: "Já existe uma conta com este e-mail.",
  REQUEST_FAILED: "Não foi possível concluir a operação.",
};
export function AuthPage({ auth }: { auth: AuthController }) {
  const route = useLocation(), nav = useNavigate();
  const mode = (route.pathname.split("/").pop() || "login") as Mode;
  const token = new URLSearchParams(route.search).get("token") || "";
  const [email,setEmail] = useState(""), [displayName,setName] = useState("");
  const [password,setPassword] = useState(""), [confirm,setConfirm] = useState("");
  const [busy,setBusy] = useState(false), [notice,setNotice] = useState(""), [error,setError] = useState("");
  const titles: Record<Mode,string> = {
    login:"Entrar no PokeList", register:"Criar conta", "verify-email":"Confirmar e-mail",
    "forgot-password":"Esqueci minha senha", "reset-password":"Criar nova senha",
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);setError("");setNotice("");
    try {
      if (mode === "login") {
        await auth.login({email,password});
        nav("/dashboard", {replace:true});
      } else if (mode === "register") {
        if (password !== confirm) throw new Error("As senhas não coincidem.");
        await auth.register({displayName,email,password});
        nav("/dashboard", {replace:true});
      } else if (mode === "verify-email") {
        if (!token) throw new Error("Link de confirmação inválido.");
        await apiRequest("/auth/verify-email",{method:"POST",body:JSON.stringify({token})});
        setNotice("E-mail confirmado! Você já pode entrar.");
      } else if (mode === "forgot-password") {
        await apiRequest("/auth/forgot-password",{method:"POST",body:JSON.stringify({email})});
        setNotice("Se o e-mail estiver cadastrado, você receberá um link.");
      } else {
        if (password !== confirm) throw new Error("As senhas não coincidem.");
        if (!token) throw new Error("Link de recuperação inválido.");
        await apiRequest("/auth/reset-password",{method:"POST",body:JSON.stringify({token,password})});
        setNotice("Senha alterada. Faça login novamente.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? messages[err.code] || err.code
        : err instanceof Error ? err.message : "Não foi possível completar a operação.");
    } finally { setBusy(false); }
  }
  const needsEmail = mode === "login" || mode === "register" || mode === "forgot-password";
  const needsPassword = mode === "login" || mode === "register" || mode === "reset-password";
  return <main className="auth-shell">
    <div className="auth-panel">
      <Link to="/" className="brand">◉ pokélist</Link>
      <h1>{titles[mode]}</h1>
      <p>Seus dados locais continuam no dispositivo. A sincronização de listas será liberada após a atualização do backend.</p>
      <form onSubmit={(event)=>void submit(event)} className="auth-form">
        {mode==="register" && <label>Nome de exibição<input required maxLength={100} value={displayName} onChange={e=>setName(e.target.value)}/></label>}
        {needsEmail && <label>E-mail<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>}
        {needsPassword && <label>Senha<input type="password" autoComplete={mode==="login"?"current-password":"new-password"} required minLength={mode==="login"?1:12} value={password} onChange={e=>setPassword(e.target.value)}/></label>}
        {(mode==="register" || mode==="reset-password") && <label>Confirmar senha<input type="password" autoComplete="new-password" required minLength={12} value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>}
        {error && <div role="alert" className="error-box">{error}</div>}
        {notice && <p role="status">{notice}</p>}
        <button className="button primary" disabled={busy} type="submit">{busy?"Processando…":titles[mode]}</button>
      </form>
      <div className="auth-links">
        {mode !== "login" && <Link to="/auth/login">Já tenho conta</Link>}
        {mode === "login" && <><Link to="/auth/register">Criar conta</Link><Link to="/auth/forgot-password">Esqueci a senha</Link></>}
        <Link to="/dashboard">Continuar com listas locais</Link>
      </div>
    </div>
  </main>;
}
