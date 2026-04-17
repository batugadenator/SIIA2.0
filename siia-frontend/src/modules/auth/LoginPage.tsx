import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginLDAP, storeToken } from "../../services/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const redirectTo = ((location.state as { from?: string } | null)?.from || "/dashboard") as string;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const { token } = await loginLDAP(usuario.trim(), senha);
      storeToken(token);
      navigate(redirectTo, { replace: true });
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      setErro(detail || "Falha na autenticacao. Verifique usuario e senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Acesso ao SIIA 2.0</h1>
        <p>Identifique-se com seu usuario da rede institucional.</p>
        {erro && <div className="login-error">{erro}</div>}

        <label htmlFor="usuario">Usuario da Rede (LDAP)</label>
        <input
          id="usuario"
          name="usuario"
          value={usuario}
          onChange={(event) => setUsuario(event.target.value)}
          required
        />

        <label htmlFor="senha">Senha</label>
        <input
          id="senha"
          type="password"
          name="senha"
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Autenticando..." : "Acessar SIIA 2.0"}
        </button>
      </form>
    </section>
  );
}
