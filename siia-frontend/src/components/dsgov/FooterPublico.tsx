import { CmsConfiguracao } from "../../services/cms";

const isDev = import.meta.env.DEV;
const fallbackNextcloudPublico = isDev ? "/" : "https://nextcloud.exemplo.gov.br/publico";

type FooterPublicoProps = {
  config: CmsConfiguracao | null;
};

export default function FooterPublico({ config }: FooterPublicoProps) {
  const nextcloudPublico = config?.nextcloud_publico || fallbackNextcloudPublico;

  return (
    <footer className="gov-footer">
      <span>Portal institucional do ecossistema SIIA.</span>
      <a href={nextcloudPublico} target="_blank" rel="noreferrer">
        Diretorio publico
      </a>
    </footer>
  );
}
