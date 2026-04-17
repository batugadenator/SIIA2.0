import React from 'react';

interface FontAwesomeIconProps {
  className?: string;
  iconClass: string; // e.g., "fas fa-newspaper"
}

/**
 * FontAwesome icon wrapper component.
 * Este componente substitui os ícones MUI removidos para resolver conflitos CommonJS/ESM.
 */
export const FontAwesomeIcon: React.FC<FontAwesomeIconProps> = ({
  className = '',
  iconClass,
}) => {
  const [icon, ...classes] = iconClass.split(' ');
  const allClasses = ['fa', icon, ...classes, className].filter(Boolean).join(' ');
  return <i className={allClasses}></i>;
};

export default FontAwesomeIcon;
