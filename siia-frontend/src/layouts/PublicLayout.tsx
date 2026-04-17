import React from "react";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import HeaderPublico from "../components/dsgov/HeaderPublico";
import FooterPublico from "../components/dsgov/FooterPublico";
import MenuLateralPublico from "../components/dsgov/MenuLateralPublico";
import Breadcrumb, { BreadcrumbItem } from "../components/Breadcrumb";
import { CmsPublicMenuItem, CmsPublicPageData, fetchPublicMenuItems, fetchPublicPageData } from "../services/cms";

export type PublicLayoutContext = {
  publicData: CmsPublicPageData | null;
};

const PublicLayout: React.FC = () => {
  const [publicData, setPublicData] = useState<CmsPublicPageData | null>(null);
  const [menuData, setMenuData] = useState<CmsPublicMenuItem[]>([]);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    fetchPublicPageData().then((response) => {
      if (!mounted) {
        return;
      }
      setPublicData(response);
    });

    fetchPublicMenuItems().then((response) => {
      if (!mounted) {
        return;
      }
      setMenuData(response);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const pathSegments = location.pathname.split("/").filter(Boolean);

  const breadcrumbItems: BreadcrumbItem[] = pathSegments.map((segment, index) => {
    const to = `/${pathSegments.slice(0, index + 1).join("/")}`;
    return {
      label: formatCrumbLabel(segment),
      to,
      isLast: index === pathSegments.length - 1,
    };
  });

  return (
    <div className="template-base">
      <HeaderPublico cabecalho={publicData?.cabecalho || null} />
      <MenuLateralPublico items={menuData} />
      <main id="main" className="p-3">
        <div className="container-lg">
          <Breadcrumb items={breadcrumbItems} />
          <Outlet context={{ publicData }} />
        </div>
      </main>
      <FooterPublico config={publicData?.configuracao ?? null} />
    </div>
  );
};

function formatCrumbLabel(segment: string): string {
  const map: Record<string, string> = {
    noticias: "Notícias",
    login: "Entrar",
    dashboard: "Dashboard",
  };

  const normalized = segment.toLowerCase();
  if (map[normalized]) {
    return map[normalized];
  }

  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default PublicLayout;
