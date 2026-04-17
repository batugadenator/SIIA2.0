import React from 'react';
import { Link } from 'react-router-dom';
import '@govbr-ds/core/dist/components/breadcrumb/breadcrumb.min.css';

export interface BreadcrumbItem {
  label: string;
  to?: string;
  isLast?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  ariaLabel?: string;
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  items, 
  ariaLabel = 'Trilha de navegação',
  className = ''
}) => {
  return (
    <div className={`br-breadcrumb ${className}`} aria-label={ariaLabel}>
      <ul className="crumb-list">
        <li className="crumb home">
          <Link to="/" aria-label="Página inicial">
            <i className="fas fa-home" aria-hidden="true"></i>
            <span className="sr-only">Página inicial</span>
          </Link>
        </li>
        {items.map((item, index) => (
          <React.Fragment key={`${item.to}-${index}`}>
            <i className="icon fas fa-chevron-right" aria-hidden="true"></i>
            <li className="crumb">
              {item.isLast ? (
                <span>{item.label}</span>
              ) : item.to ? (
                <Link to={item.to}>{item.label}</Link>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          </React.Fragment>
        ))}
      </ul>
    </div>
  );
};

export default Breadcrumb;
