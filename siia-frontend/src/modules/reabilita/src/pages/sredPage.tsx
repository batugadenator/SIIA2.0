import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import {
	Button,
	Chip,
	CircularProgress,
	MenuItem,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import { jsPDF } from 'jspdf';
import { useMemo, useState } from 'react';

import { EmptyState, SectionCard, useNotify } from '../design-system';
import { listAtendimentoNotasInstrutor } from '../services/atendimentos.service';
import { useAtendimentos, useAvaliacoesFisioterapiaSRED } from '../hooks/useAtendimentos';
import { useSessoesTreinoPEF } from '../hooks/useEducacaoFisica';
import { useAvaliacoesNutricionais } from '../hooks/useNutricao';
import { useMilitares } from '../hooks/usePessoal';
import { useIntervencoesPsicopedagogicas } from '../hooks/usePsicopedagogia';
import { useAuth } from '../providers/AuthProvider';
import type { Atendimento, AvaliacaoFisioterapiaSRED, NotaCampoInstrutor } from '../types/atendimento';
import type { SessaoTreinoPEF } from '../types/educacaoFisica';
import type { AvaliacaoNutricional } from '../types/nutricao';
import type { Militar } from '../types/pessoal';
import type { IntervencaoPsicopedagogica } from '../types/psicopedagogia';

interface SredCadeteRow {
	cadete_id: number;
	id: number;
	nome_guerra: string;
	tipo: string;
	parte_lesionada: string;
	lateralidade: string;
	sred: 'Positivo' | 'Não Aplicável';
}

type SredViewFilter = 'positivo' | 'todos';

const formatDateTime = (value: string): string => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}
	return date.toLocaleString('pt-BR');
};

const normalizeText = (value: string): string =>
	value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim()
		.toLowerCase();

const mapById = <T extends { id: number }>(items: T[] | undefined): Map<number, T> => {
	const result = new Map<number, T>();
	for (const item of items ?? []) {
		result.set(item.id, item);
	}
	return result;
};

const getSredStatus = (atendimento: Atendimento): 'Positivo' | 'Não Aplicável' => {
	if (atendimento.decisao_sred === 'S-RED Positivo') {
		return 'Positivo';
	}
	return 'Não Aplicável';
};

const addPdfSectionTitle = (doc: jsPDF, text: string, y: number): number => {
	doc.setDrawColor(30, 30, 30);
	doc.setLineWidth(0.6);
	doc.line(40, y - 10, doc.internal.pageSize.getWidth() - 40, y - 10);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(12);
	doc.text(text, 40, y);
	return y + 16;
};

const addPdfLines = (doc: jsPDF, lines: string[], y: number): number => {
	const pageHeight = doc.internal.pageSize.getHeight();
	const maxWidth = doc.internal.pageSize.getWidth() - 80;
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(10);
	doc.setTextColor(25, 25, 25);

	let currentY = y;
	for (const line of lines) {
		const split = doc.splitTextToSize(line, maxWidth);
		for (const segment of split) {
			if (currentY > pageHeight - 45) {
				doc.addPage();
				currentY = 45;
			}
			doc.text(segment, 40, currentY);
			currentY += 14;
		}
	}

	return currentY + 6;
};

const drawPdfFooter = (doc: jsPDF): void => {
	const totalPages = doc.getNumberOfPages();
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();

	for (let page = 1; page <= totalPages; page += 1) {
		doc.setPage(page);
		doc.setDrawColor(170, 170, 170);
		doc.setLineWidth(0.4);
		doc.line(40, pageHeight - 32, pageWidth - 40, pageHeight - 32);
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(8);
		doc.setTextColor(90, 90, 90);
		doc.text(`Relatório Clínico S-RED | Página ${page} de ${totalPages}`, pageWidth - 40, pageHeight - 18, {
			align: 'right',
		});
	}
};

const addPdfSectionOnNewPage = (doc: jsPDF, title: string, lines: string[]): void => {
	doc.addPage();
	let y = 70;
	y = addPdfSectionTitle(doc, title, y);
	addPdfLines(doc, lines, y);
};

const composeMedicalSection = (atendimentos: Atendimento[]): string[] => {
	if (atendimentos.length === 0) {
		return ['Sem registros médicos para este cadete/aluno.'];
	}

	const lines: string[] = [];
	for (const item of atendimentos) {
		lines.push(`Atendimento #${item.id} | Data: ${formatDateTime(item.data_registro)}`);
		lines.push(`Tipo: ${item.tipo_atendimento} | Lesão: ${item.tipo_lesao} | Origem: ${item.origem_lesao || '—'}`);
		lines.push(
			`Parte lesionada: ${item.localizacao_lesao || item.estrutura_anatomica || '—'} | Lateralidade: ${item.lateralidade}`,
		);
		lines.push(`Classificação de atividade: ${item.classificacao_atividade || '—'} | Tipo de atividade: ${item.tipo_atividade || '—'}`);
		lines.push(`TFM/TAF: ${item.tfm_taf || '—'} | Modalidade esportiva: ${item.modalidade_esportiva || '—'}`);
		lines.push(`Conduta terapêutica: ${item.conduta_terapeutica || '—'} | Decisão S-RED: ${item.decisao_sred || 'Não Aplicável'}`);
		lines.push(`Exames: ${(item.exames_complementares ?? []).join(', ') || 'Nenhum'}`);
		lines.push(`Encaminhamentos: ${(item.encaminhamentos_multidisciplinares ?? []).join(', ') || 'Nenhum'}`);
		lines.push(`Disposição: ${(item.disposicao_cadete ?? []).join(', ') || 'Nenhuma'}`);
		lines.push(`Notas clínicas: ${item.notas_clinicas || '—'}`);
		lines.push('');
	}
	return lines;
};

const composeFisioterapiaSection = (avaliacoes: AvaliacaoFisioterapiaSRED[]): string[] => {
	if (avaliacoes.length === 0) {
		return ['Sem registros para este profissional.'];
	}

	const lines: string[] = [];
	for (const item of avaliacoes) {
		lines.push(`Avaliação #${item.id} | Data: ${formatDateTime(item.data_avaliacao)} | Atendimento #${item.atendimento_id}`);
		lines.push(`Fisioterapeuta: ${item.fisioterapeuta_nome || '—'} | EVA: ${item.gravidade_eva} | Reatividade: ${item.reatividade}`);
		lines.push(`Etiologia: ${item.etiologia} | Diagnóstico: ${item.diagnostico_clinico || '—'}`);
		lines.push(`Liberação para PEF: ${item.liberado_para_pef ? 'Sim' : 'Não'} | Em: ${item.liberado_para_pef_em ? formatDateTime(item.liberado_para_pef_em) : '—'}`);
		lines.push(`Plano de tratamento: ${item.plano_tratamento || '—'}`);
		lines.push('');
	}
	return lines;
};

const composePefSection = (sessoes: SessaoTreinoPEF[]): string[] => {
	if (sessoes.length === 0) {
		return ['Sem registros para este profissional.'];
	}

	const lines: string[] = [];
	for (const item of sessoes) {
		lines.push(`Sessão #${item.id} | Data: ${formatDateTime(item.criado_em)} | Atendimento #${item.atendimento_id}`);
		lines.push(`PEF: ${item.profissional_educacao_fisica_nome || '—'} | PSE: ${item.pse_paciente} | Tonelagem: ${item.volume_tonelagem}`);
		lines.push(`Reatividade: durante ${item.reatividade_durante} | 24h ${item.reatividade_24h} | 48h ${item.reatividade_48h}`);
		lines.push(`Latência da dor: ${item.latencia_dor} | Objetivo: ${item.objetivo_condicionamento || '—'}`);
		lines.push(`Observações: ${item.observacoes || '—'}`);
		lines.push('');
	}
	return lines;
};

const composePsicopedagogiaSection = (intervencoes: IntervencaoPsicopedagogica[]): string[] => {
	if (intervencoes.length === 0) {
		return ['Sem registros para este profissional.'];
	}

	const lines: string[] = [];
	for (const item of intervencoes) {
		lines.push(`Intervenção #${item.id} | Data: ${formatDateTime(item.criado_em)} | Atendimento #${item.atendimento_id}`);
		lines.push(`Psicopedagogo: ${item.psicopedagogo_nome || '—'} | Data do atendimento: ${item.data_atendimento ? formatDateTime(item.data_atendimento) : '—'}`);
		lines.push(`Motivo: ${item.motivo_atendimento || '—'}`);
		lines.push(`Encaminhamentos: ${item.encaminhamentos_realizados || '—'}`);
		lines.push(`Observações: ${item.observacoes || '—'}`);
		lines.push('');
	}
	return lines;
};

const composeNutritionSection = (avaliacoes: AvaliacaoNutricional[]): string[] => {
	if (avaliacoes.length === 0) {
		return ['Sem avaliações nutricionais registradas.'];
	}

	const lines: string[] = [];
	for (const item of avaliacoes) {
		lines.push(`Avaliação #${item.id} | Data: ${formatDateTime(item.criado_em)} | Atendimento #${item.atendimento_id}`);
		lines.push(`Percentual de gordura: ${item.percentual_gordura}% (${item.tecnica_utilizada}) | DEXA: ${item.dexa_solicitado ? 'Sim' : 'Não'}`);
		lines.push(`Peso: ${item.peso_kg} kg | Ingestão líquida ideal: ${item.ingestao_liquida_ideal_ml} ml`);
		lines.push(
			`Gasto isotônico (H/M): ${item.gasto_isotonico_estimado_homem}/${item.gasto_isotonico_estimado_mulher} | Gasto calórico atual: ${item.gasto_calorico_atual}`,
		);
		lines.push(`Ingestão hídrica atual: ${item.ingestao_hidrica_atual}`);
		lines.push(`Ajuste nutricional: ${item.tratamento_ajuste_nutricional || '—'}`);
		lines.push(`Suplementação: ${item.tratamento_suplementacao || '—'}`);
		lines.push('');
	}
	return lines;
};

const composeInstrutorSection = (notas: NotaCampoInstrutor[]): string[] => {
	if (notas.length === 0) {
		return ['Sem registros do Instrutor para este caso.'];
	}

	const lines: string[] = [];
	for (const item of notas) {
		lines.push(`Registro #${item.id} | Data: ${formatDateTime(item.criado_em)} | Atendimento #${item.atendimento_id}`);
		lines.push(`Instrutor: ${item.instrutor_username || '—'} | Situação final: ${item.situacao_final || 'Não lançada'}`);
		lines.push(`Nota de campo: ${item.nota_campo || '—'}`);
		lines.push(`Sugestão administrativa: ${item.sugestao_administrativa || '—'}`);
		lines.push('');
	}
	return lines;
};

const loadImageAsDataUrl = async (url: string): Promise<string> => {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error('Falha ao carregar imagem do cabeçalho.');
	}
	const blob = await response.blob();
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => {
			const result = reader.result;
			if (typeof result === 'string') {
				resolve(result);
				return;
			}
			reject(new Error('Falha ao converter imagem para DataURL.'));
		};
		reader.onerror = () => reject(new Error('Falha ao ler imagem de cabeçalho.'));
		reader.readAsDataURL(blob);
	});
};

export const SredPage = () => {
	const notify = useNotify();
	const { user } = useAuth();
	const [sredViewFilter, setSredViewFilter] = useState<SredViewFilter>('positivo');
	const {
		data: atendimentos,
		isLoading: isLoadingAtendimentos,
		isError: isErrorAtendimentos,
		refetch: refetchAtendimentos,
	} = useAtendimentos();
	const { data: avaliacoesFisio, isLoading: isLoadingAvaliacoesFisio } = useAvaliacoesFisioterapiaSRED();
	const { data: sessoesPef, isLoading: isLoadingSessoesPef } = useSessoesTreinoPEF();
	const { data: intervencoesPsico, isLoading: isLoadingIntervencoesPsico } = useIntervencoesPsicopedagogicas();
	const { data: avaliacoesNutricionais, isLoading: isLoadingAvaliacoes } = useAvaliacoesNutricionais();
	const { data: militares, isLoading: isLoadingMilitares } = useMilitares();

	const militaresById = useMemo(() => mapById(militares), [militares]);

	const rows = useMemo<SredCadeteRow[]>(() => {
		const latestByCadete = new Map<number, Atendimento>();
		for (const item of atendimentos ?? []) {
			const current = latestByCadete.get(item.cadete_id);
			if (!current) {
				latestByCadete.set(item.cadete_id, item);
				continue;
			}
			const currentTs = new Date(current.data_registro).getTime();
			const nextTs = new Date(item.data_registro).getTime();
			if (Number.isNaN(currentTs) || nextTs > currentTs) {
				latestByCadete.set(item.cadete_id, item);
			}
		}

		return Array.from(latestByCadete.values())
			.sort((a, b) => new Date(b.data_registro).getTime() - new Date(a.data_registro).getTime())
			.map((item) => {
				const militar = militaresById.get(item.cadete_id);
				return {
					cadete_id: item.cadete_id,
					id: militar?.id ?? item.cadete_id,
					nome_guerra: militar?.nome_guerra || militar?.nome_completo || `Cadete #${item.cadete_id}`,
					tipo: item.tipo_atendimento,
					parte_lesionada: item.localizacao_lesao || item.estrutura_anatomica || '—',
					lateralidade: item.lateralidade || '—',
					sred: getSredStatus(item),
				};
			});
	}, [atendimentos, militaresById]);

	const isLoading =
		isLoadingAtendimentos ||
		isLoadingAvaliacoesFisio ||
		isLoadingSessoesPef ||
		isLoadingIntervencoesPsico ||
		isLoadingAvaliacoes ||
		isLoadingMilitares;

	const displayedRows = useMemo(() => {
		if (sredViewFilter === 'todos') {
			return rows;
		}

		return rows.filter((item) => item.sred === 'Positivo');
	}, [rows, sredViewFilter]);

	const totalCadetes = rows.length;
	const totalPositivos = useMemo(() => rows.filter((item) => item.sred === 'Positivo').length, [rows]);

	const handleDownloadPdf = async (row: SredCadeteRow) => {
		try {
			const doc = new jsPDF({ unit: 'pt', format: 'a4' });
			const cadete = militaresById.get(row.cadete_id) as Militar | undefined;
			const pageWidth = doc.internal.pageSize.getWidth();
			const centerX = pageWidth / 2;
			const atendimentosCadete = (atendimentos ?? [])
				.filter((item) => item.cadete_id === row.cadete_id)
				.sort((a, b) => new Date(b.data_registro).getTime() - new Date(a.data_registro).getTime());
			const atendimentoIds = new Set(atendimentosCadete.map((item) => item.id));
			const avaliacoesFisioCadete = (avaliacoesFisio ?? [])
				.filter((item) => atendimentoIds.has(item.atendimento_id))
				.sort((a, b) => new Date(b.data_avaliacao).getTime() - new Date(a.data_avaliacao).getTime());
			const sessoesPefCadete = (sessoesPef ?? [])
				.filter((item) => atendimentoIds.has(item.atendimento_id))
				.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
			const intervencoesPsicoCadete = (intervencoesPsico ?? [])
				.filter((item) => atendimentoIds.has(item.atendimento_id))
				.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
			const avaliacoesCadete = (avaliacoesNutricionais ?? [])
				.filter((item) => item.cadete_id === row.cadete_id)
				.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
			const notasInstrutorPorAtendimento = await Promise.all(
				Array.from(atendimentoIds).map(async (atendimentoId) => {
					try {
						return await listAtendimentoNotasInstrutor(atendimentoId);
					} catch {
						return [] as NotaCampoInstrutor[];
					}
				}),
			);
			const notasInstrutorCadete = notasInstrutorPorAtendimento
				.flat()
				.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
			const ultimoAtendimento = atendimentosCadete[0];
			const nomeEmissor = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || user?.username || 'Sistema';
			const dataEmissao = new Date().toLocaleString('pt-BR', {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
			});
			const pageHeight = doc.internal.pageSize.getHeight();

			const logoDataUrl = await loadImageAsDataUrl('/brasao.png').catch(() => null);

			let y = 36;
			if (logoDataUrl) {
				doc.addImage(logoDataUrl, 'PNG', centerX - 34, y, 68, 68);
				y += 90;
			}

			doc.setFont('helvetica', 'bold');
			doc.setFontSize(11);
			doc.text('MINISTÉRIO DA DEFESA', centerX, y, { align: 'center' });
			y += 14;
			doc.text('EXÉRCITO BRASILEIRO', centerX, y, { align: 'center' });
			y += 14;
			doc.text('ACADEMIA MILITAR DAS AGULHAS NEGRAS', centerX, y, { align: 'center' });
			y += 14;
			doc.setFontSize(10);
			doc.text('(Academia Real Militar/ 1811)', centerX, y, { align: 'center' });
			y += 36;

			doc.setFont('helvetica', 'bold');
			doc.setFontSize(14);
			doc.setTextColor(10, 10, 10);
			doc.text('Relatório Clínico S-RED', centerX, y, { align: 'center' });
			y += 20;
			doc.setDrawColor(20, 20, 20);
			doc.setLineWidth(0.8);
			doc.line(centerX - 120, y - 6, centerX + 120, y - 6);

			doc.setFont('helvetica', 'normal');
			doc.setFontSize(9);
			doc.setTextColor(90, 90, 90);
			doc.text(`Emissão: ${dataEmissao}`, 40, pageHeight - 56);
			doc.text(`Usuário emissor: ${nomeEmissor}`, 40, pageHeight - 42);

			doc.addPage();
			y = 70;

			y = addPdfSectionTitle(doc, 'Identificação do Paciente', y);
			doc.setFont('helvetica', 'normal');
			doc.setFontSize(10);
			doc.setTextColor(25, 25, 25);
			doc.text(`Cadete/Aluno(a): ${cadete?.id ?? row.cadete_id}`, 40, y);
			y += 14;
			doc.text(`Nr: ${cadete?.nr_militar || ultimoAtendimento?.cadete_nr_militar || '—'}`, 40, y);
			y += 14;
			doc.text(`Nome de Guerra: ${cadete?.nome_guerra || row.nome_guerra || '—'}`, 40, y);
			y += 14;
			doc.text(`Nome Completo: ${cadete?.nome_completo || '—'}`, 40, y);
			y += 14;
			doc.text(`Sexo: ${cadete?.sexo || '—'}`, 40, y);
			y += 14;
			doc.text(`Ano: ${cadete?.ano || '—'}`, 40, y);
			y += 14;
			doc.text(`Companhia: ${cadete?.companhia || '—'}`, 40, y);
			y += 14;
			doc.text(`Pelotão: ${cadete?.pelotao || '—'}`, 40, y);
			y += 14;
			doc.text(`Turma: ${cadete?.turma || '—'}`, 40, y);
			y += 14;
			doc.text(`S-RED: ${row.sred}`, 40, y);
			y += 18;

			addPdfSectionOnNewPage(doc, 'Avaliação Médica', composeMedicalSection(atendimentosCadete));
			addPdfSectionOnNewPage(doc, 'Avaliação Fisioterapêutica', composeFisioterapiaSection(avaliacoesFisioCadete));
			addPdfSectionOnNewPage(doc, 'Avaliação Física (PEF)', composePefSection(sessoesPefCadete));
			addPdfSectionOnNewPage(doc, 'Avaliação Nutricional', composeNutritionSection(avaliacoesCadete));
			addPdfSectionOnNewPage(doc, 'Avaliação Psicológica', composePsicopedagogiaSection(intervencoesPsicoCadete));
			addPdfSectionOnNewPage(doc, 'Avaliação do Instrutor', composeInstrutorSection(notasInstrutorCadete));

			drawPdfFooter(doc);

			const slug = normalizeText(row.nome_guerra || `cadete-${row.cadete_id}`).replace(/\s+/g, '-');
			doc.save(`relatorio-sred-${slug}.pdf`);
		} catch {
			notify('Não foi possível gerar o relatório em PDF.', 'error');
		}
	};

	if (isLoading) {
		return (
			<Stack alignItems="center" justifyContent="center" py={8}>
				<CircularProgress />
			</Stack>
		);
	}

	if (isErrorAtendimentos) {
		return (
			<SectionCard title="Relatórios S-RED">
				<EmptyState
					title="Erro ao carregar dados"
					description="Não foi possível obter os dados dos atendimentos."
					action={<Button onClick={() => void refetchAtendimentos()}>Tentar novamente</Button>}
				/>
			</SectionCard>
		);
	}

	return (
		<Stack spacing={3} p={2}>
			<Typography variant="h5" fontWeight={600}>
				Relatórios S-RED
			</Typography>

			<SectionCard
				title="Cadetes e Alunos da Seção de Saúde"
				subtitle="Listagem consolidada por cadastro com emissão de relatório completo em PDF."
			>
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2}>
					<TextField
						select
						size="small"
						label="Filtro S-RED"
						value={sredViewFilter}
						onChange={(event) => setSredViewFilter(event.target.value as SredViewFilter)}
						sx={{ minWidth: 220 }}
					>
						<MenuItem value="positivo">Somente S-RED Positivo</MenuItem>
						<MenuItem value="todos">Todos os cadetes/alunos</MenuItem>
					</TextField>
					<Stack direction="row" spacing={1} sx={{ alignSelf: 'center', flexWrap: 'wrap' }}>
						<Chip
							size="small"
							color="error"
							label={`${totalPositivos} positivos`}
							sx={{ minHeight: 32 }}
						/>
						<Chip
							size="small"
							variant="outlined"
							label={`${totalCadetes} atendidos`}
							sx={{ minHeight: 32 }}
						/>
					</Stack>
				</Stack>

				{displayedRows.length === 0 ? (
					<EmptyState
						title="Nenhum atendimento encontrado"
						description={
							sredViewFilter === 'positivo'
								? 'Não há cadetes/alunos com S-RED Positivo no momento.'
								: 'Não há cadetes/alunos com entrada registrada no fluxo de atendimento.'
						}
					/>
				) : (
					<TableContainer sx={{ maxHeight: 560 }}>
						<Table size="small" stickyHeader>
							<TableHead>
								<TableRow>
									<TableCell colSpan={7} sx={{ backgroundColor: 'background.paper' }}>
										<Stack direction="row" spacing={1} alignItems="center">
											<Chip
												size="small"
												label="Linha destacada"
												sx={{ backgroundColor: 'rgba(211, 47, 47, 0.12)', minHeight: 28 }}
											/>
											<Typography variant="caption" color="text.secondary">
												S-RED Positivo
											</Typography>
										</Stack>
									</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>ID</TableCell>
									<TableCell>Nome de Guerra</TableCell>
									<TableCell>Tipo</TableCell>
									<TableCell>Parte Lesionada</TableCell>
									<TableCell>Lateralidade</TableCell>
									<TableCell>S-RED</TableCell>
									<TableCell align="right">Relatório</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{displayedRows.map((item) => (
									<TableRow
										key={item.cadete_id}
										hover
										sx={
											item.sred === 'Positivo'
												? {
													'& td': { backgroundColor: 'rgba(211, 47, 47, 0.06)' },
													'&:hover td': { backgroundColor: 'rgba(211, 47, 47, 0.12)' },
												}
												: undefined
										}
									>
										<TableCell>{item.id}</TableCell>
										<TableCell>{item.nome_guerra}</TableCell>
										<TableCell>{item.tipo}</TableCell>
										<TableCell>{item.parte_lesionada}</TableCell>
										<TableCell>{item.lateralidade}</TableCell>
										<TableCell>
											{item.sred === 'Positivo' ? (
												<Chip size="small" color="error" label="Positivo" />
											) : (
												<Chip size="small" variant="outlined" label="Não Aplicável" />
											)}
										</TableCell>
										<TableCell align="right">
											<Button
												variant="contained"
												startIcon={<DownloadOutlinedIcon />}
												onClick={() => void handleDownloadPdf(item)}
												sx={{ minHeight: 44, minWidth: 44 }}
											>
												PDF
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</SectionCard>

			<Typography variant="body2" color="text.secondary">
				Cada PDF inclui dados dos formulários de Médico, Fisioterapeuta, Nutricionista, Profissional de Educação Física, Psicopedagogia e Instrutor.
			</Typography>
		</Stack>
	);
};
