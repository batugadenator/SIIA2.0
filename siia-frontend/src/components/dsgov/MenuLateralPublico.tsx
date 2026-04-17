import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CmsPublicMenuItem } from "../../services/cms";

interface MenuProps {
  items: CmsPublicMenuItem[];
}

/** Estado de entrada de um painel de sub-nível. */
type PanelEntry = {
  title: string;
  items: CmsPublicMenuItem[];
};

/**
 * Limite de profundidade alinhado ao padrão DSGov (máx. 4 níveis).
 * Boa prática: não ultrapassar 3. Nunca deve exceder MAX_DEPTH.
 */
const MAX_DEPTH = 4;

// ─── Nó de NÍVEL 1 — accordion (único nível onde expansível é permitido) ─────

interface Level1NodeProps {
  item: CmsPublicMenuItem;
  onNavigate: (entry: PanelEntry) => void;
}

const Level1Node: React.FC<Level1NodeProps> = ({ item, onNavigate }) => {
  const hasSubmenus = Array.isArray(item.submenus) && item.submenus.length > 0;
  const isExternal = item.is_externo;
  const hasInternalUrl = item.url?.startsWith("/");
  const [expanded, setExpanded] = useState(false);
  const submenuId = useMemo(() => `menu-node-${item.id}-nivel-1`, [item.id]);

  const itemContent = (
    <>
      {item.icone_classe ? (
        <span className="icon" aria-hidden="true">
          <i className={item.icone_classe}></i>
        </span>
      ) : null}
      <span className="content">{item.titulo}</span>
    </>
  );

  return (
    <li className={`menu-node menu-level-1 ${expanded ? "is-expanded" : "is-collapsed"}`}>
      <div className="menu-folder">
        <div className="menu-item-row">
          {isExternal || !hasInternalUrl ? (
            <a
              className="menu-item"
              href={item.url}
              target={isExternal ? "_blank" : "_self"}
              rel={isExternal ? "noopener noreferrer" : undefined}
              aria-label={isExternal ? `${item.titulo} (abre em nova aba)` : item.titulo}
            >
              {itemContent}
            </a>
          ) : (
            <Link className="menu-item" to={item.url} aria-label={item.titulo}>
              {itemContent}
            </Link>
          )}

          {/* Botão accordion — exclusivo do nível 1 conforme DSGov */}
          {hasSubmenus && (
            <button
              type="button"
              className="menu-node-toggle br-button circle small"
              aria-controls={submenuId}
              // aria-expanded: boolean é válido em React JSX (produz "true"/"false" no DOM)
              aria-expanded={expanded ? ("true" as const) : ("false" as const)}
              aria-label={expanded ? `Recolher ${item.titulo}` : `Expandir ${item.titulo}`}
              onClick={() => setExpanded((prev) => !prev)}
            >
              <i className="fas fa-chevron-down" aria-hidden="true"></i>
            </button>
          )}
        </div>

        {hasSubmenus && (
          <div
            id={submenuId}
            className={`menu-subtree ${expanded ? "is-open" : "is-closed"}`}
          >
            <ul data-nivel="2">
              {item.submenus.map((sub) => (
                // Nível 2: item do accordion — usa painel se tiver filhos
                <Level2PlusNode key={sub.id} item={sub} nivel={2} onNavigate={onNavigate} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </li>
  );
};

// ─── Nó de NÍVEL 2+ — substitui o painel quando tem filhos (DSGov) ───────────

interface Level2PlusNodeProps {
  item: CmsPublicMenuItem;
  nivel: number;
  onNavigate: (entry: PanelEntry) => void;
}

const Level2PlusNode: React.FC<Level2PlusNodeProps> = ({ item, nivel, onNavigate }) => {
  const hasSubmenus = Array.isArray(item.submenus) && item.submenus.length > 0;
  const isExternal = item.is_externo;
  const hasInternalUrl = item.url?.startsWith("/");
  // Respeita o limite DSGov: nível 4 nunca abre sub-painel.
  const canGoDeeper = hasSubmenus && nivel < MAX_DEPTH;

  const baseContent = (
    <>
      {item.icone_classe ? (
        <span className="icon" aria-hidden="true">
          <i className={item.icone_classe}></i>
        </span>
      ) : null}
      <span className="content">{item.titulo}</span>
    </>
  );

  return (
    <li className={`menu-node menu-level-${nivel}`}>
      <div className="menu-folder">
        <div className="menu-item-row">
          {canGoDeeper ? (
            // Item com filhos: abre novo painel (substitui camada anterior — DSGov)
            <button
              type="button"
              className="menu-item menu-panel-trigger"
              aria-label={`Abrir submenu de ${item.titulo}`}
              onClick={() => onNavigate({ title: item.titulo, items: item.submenus })}
            >
              {baseContent}
              <span className="menu-panel-arrow" aria-hidden="true">
                <i className="fas fa-chevron-right"></i>
              </span>
            </button>
          ) : isExternal || !hasInternalUrl ? (
            <a
              className="menu-item"
              href={item.url}
              target={isExternal ? "_blank" : "_self"}
              rel={isExternal ? "noopener noreferrer" : undefined}
              aria-label={isExternal ? `${item.titulo} (abre em nova aba)` : item.titulo}
            >
              {baseContent}
            </a>
          ) : (
            <Link className="menu-item" to={item.url} aria-label={item.titulo}>
              {baseContent}
            </Link>
          )}
        </div>
      </div>
    </li>
  );
};

// ─── Componente principal ────────────────────────────────────────────────────

const MenuLateralPublico: React.FC<MenuProps> = ({ items }) => {
  /**
   * panelStack: pilha de painéis navegados.
   * [] = painel raiz (nível 1).
   * [entry] = sub-painel com os filhos do item clicado (nível 3 visível).
   * [entry, entry] = segundo sub-painel (nível 4 visível — máximo DSGov).
   */
  const [panelStack, setPanelStack] = useState<PanelEntry[]>([]);

  useEffect(() => {
    import("@govbr-ds/core/dist/core-init")
      .then(() => {
        const core = (window as any).core;
        if (core && typeof core.init === "function") {
          core.init();
        }
      })
      .catch(() => {
        // Keep menu usable even when DSGOV JS is unavailable.
      });
  }, []);

  const handleNavigate = (entry: PanelEntry) => {
    setPanelStack((prev) => [...prev, entry]);
  };

  const handleBack = () => {
    setPanelStack((prev) => prev.slice(0, -1));
  };

  const isSubPanel = panelStack.length > 0;
  const activePanel = isSubPanel ? panelStack[panelStack.length - 1] : null;
  // Nível dos itens no sub-painel ativo:
  // panelStack[0] → os filhos do item de nível 2 → são nível 3
  // panelStack[1] → os filhos do item de nível 3 → são nível 4
  const activePanelNivel = panelStack.length + 2;

  return (
    <div className="br-menu" id="main-navigation">
      <div className="menu-container">
        <div className="menu-panel">
          <div className="menu-header">
            {isSubPanel && activePanel ? (
              // Cabeçalho de sub-painel: botão Voltar + título do painel atual
              <div className="menu-panel-header-sub">
                <button
                  type="button"
                  className="br-button circle small"
                  aria-label="Voltar ao menu anterior"
                  onClick={handleBack}
                >
                  <i className="fas fa-arrow-left" aria-hidden="true"></i>
                </button>
                <span className="menu-panel-title" aria-live="polite">
                  {activePanel.title}
                </span>
              </div>
            ) : (
              <div className="menu-title">
                <img src="/assets/logo-aman.png" alt="Logo AMAN" />
                <span>Menu Principal</span>
              </div>
            )}
            <div className="menu-close">
              <button
                className="br-button circle small"
                type="button"
                aria-label="Fechar o menu"
                data-dismiss="menu"
              >
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          <nav className="menu-body" aria-label="Menu de navegação">
            {isSubPanel && activePanel ? (
              // Sub-painel: lista dos filhos do item navegado (nível 3 ou 4)
              <ul className="menu-panel-list">
                {activePanel.items.map((item) => (
                  <Level2PlusNode
                    key={item.id}
                    item={item}
                    nivel={activePanelNivel}
                    onNavigate={handleNavigate}
                  />
                ))}
              </ul>
            ) : (
              // Painel raiz: nível 1 com accordion (comportamento expansível)
              <div className="menu-folder">
                <div className="menu-item">
                  <span className="content">Acesso Rápido</span>
                </div>
                <ul>
                  {items.map((item) => (
                    <Level1Node key={item.id} item={item} onNavigate={handleNavigate} />
                  ))}
                </ul>
              </div>
            )}
          </nav>

          {!isSubPanel && (
            <div className="menu-footer">
              <div className="menu-info">
                <div className="text-center text-sm-left">
                  <p>
                    <strong>AMAN</strong> - Academia Militar das Agulhas Negras
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="menu-scrim" data-dismiss="menu" tabIndex={-1}></div>
      </div>
    </div>
  );
};

export default MenuLateralPublico;
