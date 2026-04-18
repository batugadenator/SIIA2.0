export interface AuthUser {
	id: number;
	username: string;
	first_name: string;
	last_name: string;
	is_staff: boolean;
	perfil: SystemUserProfile | 'Operador';
}

export interface AuthSession {
	is_authenticated: boolean;
	user: AuthUser | null;
}

export interface LoginPayload {
	username: string;
	password: string;
}

export type SystemUserProfile =
	| 'Administrador'
	| 'Consultor'
	| 'Profissional de Educação Física'
	| 'Enfermeiro'
	| 'Fisioterapeuta'
	| 'Instrutor'
	| 'Médico'
	| 'Nutricionista'
	| 'Psicopedagogo';

export type EspecialidadeMedica = 'Ortopedista' | 'Clínico Geral';

export type FuncaoInstrutor =
	| 'Comandante do Corpo de Cadetes'
	| 'Subcomandante do Corpo de Cadetes'
	| 'S1-CC'
	| 'Comandante de Curso'
	| 'Comandante de Subunidade'
	| 'Comandante de Pelotão';

export interface CreateSystemUserPayload {
	nome_completo: string;
	cpf: string;
	perfil: SystemUserProfile;
	especialidade_medica?: EspecialidadeMedica | '';
	funcao_instrutor?: FuncaoInstrutor | '';
	posto_graduacao?: string;
	nome_guerra?: string;
	setor?: string;
	fracao?: string;
	senha_inicial: string;
	confirmar_senha_inicial: string;
	usuario_ativo: boolean;
}

export interface SystemUserResponse {
	id: number;
	username: string;
	cpf: string;
	nome_completo: string;
	perfil: SystemUserProfile;
	especialidade_medica: string;
	funcao_instrutor: string;
	posto_graduacao: string;
	nome_guerra: string;
	setor: string;
	fracao: string;
	is_active: boolean;
	is_staff: boolean;
}

export interface SystemUserDetail {
	id: number;
	username: string;
	cpf: string;
	first_name: string;
	last_name: string;
	perfil: SystemUserProfile;
	especialidade_medica: string;
	funcao_instrutor: string;
	posto_graduacao: string;
	nome_guerra: string;
	setor: string;
	fracao: string;
	is_active: boolean;
	is_staff: boolean;
}

export interface UpdateUserPayload {
	cpf?: string;
	perfil?: SystemUserProfile;
	especialidade_medica?: EspecialidadeMedica | '';
	funcao_instrutor?: FuncaoInstrutor | '';
	posto_graduacao?: string;
	nome_guerra?: string;
	setor?: string;
	fracao?: string;
	usuario_ativo?: boolean;
}

export interface ChangePasswordPayload {
	senha_atual: string;
	senha_nova: string;
	confirmar_senha_nova: string;
}

export interface PasswordResetRequestPayload {
	cpf: string;
}

export interface LdapConfigStatus {
	id: number;
	enabled: boolean;
	server_uri: string;
	bind_dn: string;
	bind_password_configured: boolean;
	user_search_base_dn: string;
	user_search_filter: string;
	start_tls: boolean;
	always_update_user: boolean;
	mirror_groups: boolean;
	cache_timeout: number;
	attr_first_name: string;
	attr_last_name: string;
	attr_email: string;
	group_search_base_dn: string;
	group_search_filter: string;
	group_type: string;
	posix_member_attr: string;
	admin_group_dn: string;
	updated_at: string;
	updated_by_username: string;
}

export interface LdapConfigUpdate {
	enabled?: boolean;
	server_uri?: string;
	bind_dn?: string;
	/** Send only when changing; omit to keep existing password. */
	bind_password?: string;
	user_search_base_dn?: string;
	user_search_filter?: string;
	start_tls?: boolean;
	always_update_user?: boolean;
	mirror_groups?: boolean;
	cache_timeout?: number;
	attr_first_name?: string;
	attr_last_name?: string;
	attr_email?: string;
	group_search_base_dn?: string;
	group_search_filter?: string;
	group_type?: string;
	posix_member_attr?: string;
	admin_group_dn?: string;
}
