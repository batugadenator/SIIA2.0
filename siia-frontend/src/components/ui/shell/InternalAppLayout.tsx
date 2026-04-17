import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

import FontAwesomeIcon from '../../FontAwesomeIcon';
import { clearToken, fetchMe } from '../../../services/auth';
import './InternalAppLayout.css';

export interface InternalAppMenuItem {
  label: string;
  to: string;
  icon?: ReactNode;
  exact?: boolean;
  end?: boolean;
  description?: string;
  children?: InternalAppMenuItem[];
}

export interface InternalAppMenuSection {
  title?: string;
  items: InternalAppMenuItem[];
}

export interface InternalAppLayoutProps {
  children?: ReactNode;
  menuItems: InternalAppMenuSection[];
  moduleTitle: string;
  moduleSubtitle?: string;
  brandName?: string;
  brandLogoSrc?: string;
  brandLogoAlt?: string;
  brandMark?: ReactNode;
  userName?: string;
  userProfileLabel?: string;
  headerActions?: ReactNode;
  showBackButton?: boolean;
  backTo?: string;
  backLabel?: string;
  onLogout?: () => void | Promise<void>;
  contentClassName?: string;
}

type ResolvedUser = {
  displayName: string;
  username: string;
};

const getDisplayName = (user: ResolvedUser): string => {
  return user.displayName.trim() || user.username;
};

const isRouteActive = (currentPath: string, targetPath: string, exact = false): boolean => {
  if (exact) {
    return currentPath === targetPath;
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
};

const renderIcon = (icon: ReactNode | undefined) => {
  if (!icon) {
    return null;
  }

  if (typeof icon === 'string') {
    return <FontAwesomeIcon iconClass={icon} />;
  }

  return icon;
};

function InternalMenuItemRow({ item, currentPath }: { item: InternalAppMenuItem; currentPath: string }) {
  const hasChildren = Boolean(item.children?.length);
  const isActive = hasChildren
    ? item.children!.some((child) => isRouteActive(currentPath, child.to, child.exact ?? child.end ?? false)) || isRouteActive(currentPath, item.to, item.exact ?? item.end ?? false)
    : isRouteActive(currentPath, item.to, item.exact ?? item.end ?? false);

  return (
    <li className={`internal-nav-item${hasChildren ? ' has-children' : ''}${isActive ? ' active' : ''}`}>
      <NavLink
        to={item.to}
        end={item.exact ?? item.end ?? false}
        className={({ isActive: routeActive }) => `internal-nav-link${routeActive || isActive ? ' active' : ''}`}
      >
        <span className="internal-nav-icon">{renderIcon(item.icon)}</span>
        <span className="internal-nav-labels">
          <span className="internal-nav-label">{item.label}</span>
          {item.description ? <span className="internal-nav-description">{item.description}</span> : null}
        </span>
      </NavLink>

      {hasChildren ? (
        <ul className="internal-nav-children">
          {item.children!.map((child) => (
            <InternalMenuItemRow key={`${child.to}-${child.label}`} item={child} currentPath={currentPath} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function InternalMenuSection({ section, currentPath, showDivider }: { section: InternalAppMenuSection; currentPath: string; showDivider: boolean }) {
  return (
    <section className="internal-nav-section">
      {section.title ? <h2 className="internal-nav-section-title">{section.title}</h2> : null}
      <ul className="internal-nav-list">
        {section.items.map((item, index) => (
          <li key={`${item.to}-${item.label}`}>
            {index > 0 ? <div className="internal-nav-item-divider" aria-hidden="true" /> : null}
            <InternalMenuItemRow item={item} currentPath={currentPath} />
          </li>
        ))}
      </ul>
      {showDivider ? <div className="internal-nav-section-divider" aria-hidden="true" /> : null}
    </section>
  );
}

export default function InternalAppLayout({
  children,
  menuItems,
  moduleTitle,
  moduleSubtitle = 'Area logada',
  brandName,
  brandLogoSrc,
  brandLogoAlt,
  brandMark,
  userName,
  userProfileLabel,
  headerActions,
  showBackButton = true,
  backTo = '/dashboard',
  backLabel = 'Voltar ao Painel de Aplicativos',
  onLogout,
  contentClassName,
}: InternalAppLayoutProps) {
  const location = useLocation();
  const [resolvedUser, setResolvedUser] = useState<ResolvedUser | null>(null);
  const resolvedBrandName = brandName ?? moduleTitle;

  useEffect(() => {
    let isMounted = true;

    if (userName) {
      setResolvedUser({ displayName: userName, username: userName });
      return () => {
        isMounted = false;
      };
    }

    void fetchMe()
      .then((user) => {
        if (!isMounted) {
          return;
        }

        setResolvedUser({
          displayName: [user.first_name, user.last_name].filter(Boolean).join(' ').trim(),
          username: user.username,
        });
      })
      .catch(() => {
        if (isMounted) {
          setResolvedUser(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userName]);

  const displayName = useMemo(() => {
    if (userName) {
      return userName;
    }

    if (resolvedUser) {
      return getDisplayName(resolvedUser);
    }

    return 'Usuario autenticado';
  }, [resolvedUser, userName]);

  const profileLabel = userProfileLabel ?? 'LDAP';

  const handleLogout = () => {
    if (onLogout) {
      void onLogout();
      return;
    }

    clearToken();
    window.location.href = '/login';
  };

  const content = children ?? <Outlet />;

  return (
    <div className="internal-app-shell">
      <aside className="internal-app-sidebar">
        <div className="internal-app-sidebar-header">
          <div className="internal-app-brand">
            <div className="internal-app-brand-topline">
              <div className="internal-app-brand-badge" aria-hidden="true">
                {brandLogoSrc ? <img src={brandLogoSrc} alt={brandLogoAlt ?? resolvedBrandName} className="internal-app-brand-logo" /> : brandMark ?? <FontAwesomeIcon iconClass="fas fa-layer-group" />}
              </div>
              <div className="internal-app-brand-copy">
                <div className="internal-app-brand-title">{resolvedBrandName}</div>
              </div>
            </div>
            <div className="internal-app-brand-subtitle">{moduleSubtitle}</div>
          </div>

          {showBackButton ? (
            <>
              <div className="internal-app-sidebar-divider" aria-hidden="true" />
              <Link to={backTo} className="internal-app-back-link">
                <span className="internal-app-back-icon">
                  <FontAwesomeIcon iconClass="fas fa-arrow-left" />
                </span>
                <span className="internal-app-back-text">{backLabel}</span>
              </Link>
            </>
          ) : null}
        </div>

        <nav className="internal-app-nav" aria-label={`Navegacao do modulo ${moduleTitle}`}>
          {menuItems.map((section, index) => (
            <InternalMenuSection
              key={section.title ?? `section-${index}`}
              section={section}
              currentPath={location.pathname}
              showDivider={index < menuItems.length - 1}
            />
          ))}
        </nav>

        <div className="internal-app-sidebar-footer">
          <div className="internal-app-user-chip">
            <span className="internal-app-user-name">{displayName}</span>
            <span className="internal-app-user-profile">{profileLabel}</span>
          </div>

          <button className="internal-app-logout" type="button" onClick={handleLogout} title="Sair do sistema">
            <FontAwesomeIcon iconClass="fas fa-sign-out-alt" />
          </button>
        </div>
      </aside>

      <div className="internal-app-main">
        <header className="internal-app-header">
          <div className="internal-app-header-copy">
            <div className="internal-app-header-kicker">{moduleSubtitle}</div>
            <h1 className="internal-app-header-title">{moduleTitle}</h1>
          </div>

          <div className="internal-app-header-actions">
            {headerActions}
            <div className="internal-app-header-user">
              <div className="internal-app-header-user-name">{displayName}</div>
              <div className="internal-app-header-user-profile">{profileLabel}</div>
            </div>
          </div>
        </header>

        <main className={contentClassName ? `internal-app-content ${contentClassName}` : 'internal-app-content'}>
          {content}
        </main>
      </div>
    </div>
  );
}
