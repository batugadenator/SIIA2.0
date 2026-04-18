import type { SystemUserProfile } from '../types/auth';

export type AuthProfile = SystemUserProfile | 'Operador';

export const PROFILE_ROUTES: Record<AuthProfile, string[]> = {
	Administrador: [
		'/dashboard',
		'/medico',
		'/instrutor',
		'/cadetes-pacientes',
		'/cadetes/novo',
		'/configuracoes-gerais',
		'/atendimentos/novo',
		'/fisioterapia',
		'/educador-fisico',
		'/nutricao',
		'/psicopedagogia',
		'/sred',
		'/minha-conta',
		'/usuarios-perfis',
		'/configuracao-ldap',
		'/importar-csv',
		'/carga-referencias',
	],
	'Médico': [
		'/dashboard',
		'/medico',
		'/configuracoes-gerais',
		'/atendimentos/novo',
		'/fisioterapia',
		'/educador-fisico',
		'/nutricao',
		'/psicopedagogia',
		'/sred',
		'/minha-conta',
	],
	Enfermeiro: [
		'/dashboard',
		'/medico',
		'/cadetes-pacientes',
		'/cadetes/novo',
		'/configuracoes-gerais',
		'/atendimentos/novo',
		'/fisioterapia',
		'/educador-fisico',
		'/nutricao',
		'/psicopedagogia',
		'/sred',
		'/minha-conta',
	],
	Consultor: ['/dashboard', '/minha-conta'],
	'Profissional de Educação Física': ['/dashboard', '/educador-fisico', '/sred', '/minha-conta'],
	Fisioterapeuta: ['/dashboard', '/fisioterapia', '/sred', '/minha-conta'],
	Nutricionista: ['/dashboard', '/nutricao', '/sred', '/minha-conta'],
	Psicopedagogo: ['/dashboard', '/psicopedagogia', '/sred', '/minha-conta'],
	Instrutor: ['/dashboard', '/instrutor', '/cadetes-pacientes', '/minha-conta'],
	Operador: ['/dashboard', '/minha-conta'],
};

export const canAccessRoute = (
	profile: AuthProfile | null | undefined,
	path: string,
): boolean => {
	if (!profile) {
		return false;
	}

	const allowed = PROFILE_ROUTES[profile] ?? [];
	// Exact match first; then prefix match for dynamic sub-routes (e.g. /fisioterapia/avaliacao-sred/:id)
	return allowed.some((route) => path === route || path.startsWith(route + '/'));
};
