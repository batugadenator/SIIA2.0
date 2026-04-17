import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { fetchMePerfilCMS, MePerfilCMS } from "../../services/cms";
import "./cms-admin.css";

export type CmsOutletContext = { perfil: MePerfilCMS };

export default function CmsLayout() {
  const [perfil, setPerfil] = useState<MePerfilCMS | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetchMePerfilCMS()
      .then(setPerfil)
      .catch(() => setErro("Sem permissão de acesso ao CMS."))
      .finally(() => setLoading(false));
  }, []);


  if (loading) {
    return (
      <div className="cms-center-loading">
        <div className="br-loading" aria-label="Carregando CMS..." />
      </div>
    );
  }

  if (erro || !perfil?.perfil_cms) {
    return (
      <div className="br-message danger cms-permission">
        <i className="fas fa-ban" aria-hidden="true" />
        <span className="ml-2">{erro || "Você não possui permissão para acessar o CMS."}</span>
      </div>
    );
  }

  const outletContext: CmsOutletContext = { perfil };

  return <Outlet context={outletContext} />;
}
