import { useMemo, useState } from 'react';

import {
	Button,
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
import { Link as RouterLink } from 'react-router-dom';

import { FilterActionsRow } from '../components/common';
import { EmptyState, SectionCard } from '../design-system';
import { useMilitares } from '../hooks/usePessoal';

export const CadetesPacientesPage = () => {
	const { data, isLoading, isError, refetch } = useMilitares();
	const [busca, setBusca] = useState('');
	const [sexoFiltro, setSexoFiltro] = useState('');
	const [anoFiltro, setAnoFiltro] = useState('');
	const [companhiaFiltro, setCompanhiaFiltro] = useState('');
	const [pelotaoFiltro, setPelotaoFiltro] = useState('');
	const [turmaFiltro, setTurmaFiltro] = useState('');

	const militaresNaoInstrutor = useMemo(
		() => (data ?? []).filter((item) => !item.is_instrutor),
		[data],
	);

	const sexoOpcoes = useMemo(
		() => Array.from(new Set(militaresNaoInstrutor.map((item) => item.sexo).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
		[militaresNaoInstrutor],
	);

	const anoOpcoes = useMemo(
		() => Array.from(new Set(militaresNaoInstrutor.map((item) => item.ano).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
		[militaresNaoInstrutor],
	);

	const companhiaOpcoes = useMemo(
		() => Array.from(new Set(militaresNaoInstrutor.map((item) => item.companhia).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
		[militaresNaoInstrutor],
	);

	const pelotaoOpcoes = useMemo(
		() => Array.from(new Set(militaresNaoInstrutor.map((item) => item.pelotao).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
		[militaresNaoInstrutor],
	);

	const turmaOpcoes = useMemo(
		() => Array.from(new Set(militaresNaoInstrutor.map((item) => item.turma).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
		[militaresNaoInstrutor],
	);

	const items = useMemo(() => {
		const militares = militaresNaoInstrutor;
		const buscaNormalizada = busca.trim().toLowerCase();

		return militares.filter((item) => {
			if (sexoFiltro && item.sexo !== sexoFiltro) return false;
			if (anoFiltro && item.ano !== anoFiltro) return false;
			if (companhiaFiltro && item.companhia !== companhiaFiltro) return false;
			if (pelotaoFiltro && item.pelotao !== pelotaoFiltro) return false;
			if (turmaFiltro && item.turma !== turmaFiltro) return false;

			if (!buscaNormalizada) {
				return true;
			}

			const texto = [
				item.posto_graduacao,
				item.nr_militar,
				item.nome_guerra,
				item.sexo,
				item.ano,
				item.companhia,
				item.pelotao,
				item.turma,
			]
				.join(' ')
				.toLowerCase();

			return texto.includes(buscaNormalizada);
		});
	}, [militaresNaoInstrutor, busca, sexoFiltro, anoFiltro, companhiaFiltro, pelotaoFiltro, turmaFiltro]);

	const handleLimpar = () => {
		setBusca('');
		setSexoFiltro('');
		setAnoFiltro('');
		setCompanhiaFiltro('');
		setPelotaoFiltro('');
		setTurmaFiltro('');
	};

	if (isLoading) {
		return (
			<Stack alignItems="center" justifyContent="center" minHeight="45vh">
				<CircularProgress />
			</Stack>
		);
	}

	if (isError) {
		return (
			<EmptyState
				title="Falha ao carregar cadetes"
				description="Verifique a conexão e tente novamente."
				action={
					<Button variant="contained" onClick={() => void refetch()} sx={{ minHeight: 44, minWidth: 44 }}>
						Tentar novamente
					</Button>
				}
				height="45vh"
			/>
		);
	}

	if (!data || data.length === 0) {
		return (
			<EmptyState
				title="Nenhum cadete/aluno cadastrado"
				description="Cadastre o primeiro cadete ou aluno para começar os atendimentos clínicos."
				action={
					<Button
						variant="contained"
						component={RouterLink}
						to="/dashboard/cadfuncional/cadetes/novo"
						sx={{ minHeight: 44, minWidth: 44 }}
					>
						+ Cadastrar Cadete
					</Button>
				}
				height="45vh"
			/>
		);
	}

	return (
		<Stack spacing={2}>
			<Typography variant="h5">Cadetes / Pacientes</Typography>

			<SectionCard title="Cadastro de Cadetes e Alunos" subtitle="Consulta de cadetes e alunos cadastrados no sistema.">
				<Stack spacing={1.5}>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap">
						<TextField
							label="Buscar"
							value={busca}
							onChange={(event) => setBusca(event.target.value)}
							sx={{ minWidth: { xs: '100%', sm: 280 }, '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
						<TextField
							select
							label="Sexo"
							value={sexoFiltro}
							onChange={(event) => setSexoFiltro(event.target.value)}
							sx={{ minWidth: { xs: '100%', sm: 160 }, '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							<MenuItem value="">Todos</MenuItem>
							{sexoOpcoes.map((item) => (
								<MenuItem key={item} value={item}>{item}</MenuItem>
							))}
						</TextField>
						<TextField
							select
							label="Ano"
							value={anoFiltro}
							onChange={(event) => setAnoFiltro(event.target.value)}
							sx={{ minWidth: { xs: '100%', sm: 160 }, '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							<MenuItem value="">Todos</MenuItem>
							{anoOpcoes.map((item) => (
								<MenuItem key={item} value={item}>{item}</MenuItem>
							))}
						</TextField>
						<TextField
							select
							label="Companhia"
							value={companhiaFiltro}
							onChange={(event) => setCompanhiaFiltro(event.target.value)}
							sx={{ minWidth: { xs: '100%', sm: 180 }, '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							<MenuItem value="">Todos</MenuItem>
							{companhiaOpcoes.map((item) => (
								<MenuItem key={item} value={item}>{item}</MenuItem>
							))}
						</TextField>
						<TextField
							select
							label="Pelotão"
							value={pelotaoFiltro}
							onChange={(event) => setPelotaoFiltro(event.target.value)}
							sx={{ minWidth: { xs: '100%', sm: 180 }, '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							<MenuItem value="">Todos</MenuItem>
							{pelotaoOpcoes.map((item) => (
								<MenuItem key={item} value={item}>{item}</MenuItem>
							))}
						</TextField>
						<TextField
							select
							label="Turma"
							value={turmaFiltro}
							onChange={(event) => setTurmaFiltro(event.target.value)}
							sx={{ minWidth: { xs: '100%', sm: 160 }, '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							<MenuItem value="">Todos</MenuItem>
							{turmaOpcoes.map((item) => (
								<MenuItem key={item} value={item}>{item}</MenuItem>
							))}
						</TextField>
					</Stack>

					<FilterActionsRow
						refreshLabel="Atualizar lista"
						onRefresh={() => void refetch()}
						onClear={handleLimpar}
					/>

					<Typography variant="body2" color="text.secondary">
						Total encontrado: {items.length}
					</Typography>

					{items.length === 0 ? (
						<EmptyState
							title="Nenhum resultado"
							description="Ajuste a busca para localizar cadetes e alunos."
							height="26vh"
						/>
					) : (
						<TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
							<Table size="small" sx={{ minWidth: 1080 }}>
								<TableHead>
									<TableRow>
										<TableCell>Posto/Graduação</TableCell>
										<TableCell>Nr</TableCell>
										<TableCell>Nome de Guerra</TableCell>
										<TableCell>Sexo</TableCell>
										<TableCell>Ano</TableCell>
										<TableCell>Companhia</TableCell>
										<TableCell>Pelotão</TableCell>
										<TableCell>Turma</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{items.map((item) => (
										<TableRow key={item.id}>
											<TableCell sx={{ whiteSpace: 'nowrap' }}>{item.posto_graduacao || '-'}</TableCell>
											<TableCell sx={{ whiteSpace: 'nowrap' }}>{item.nr_militar}</TableCell>
											<TableCell sx={{ whiteSpace: 'nowrap' }}>{item.nome_guerra || '-'}</TableCell>
											<TableCell>{item.sexo || '-'}</TableCell>
											<TableCell>{item.ano || '-'}</TableCell>
											<TableCell>{item.companhia || '-'}</TableCell>
											<TableCell>{item.pelotao || '-'}</TableCell>
											<TableCell>{item.turma || '-'}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					)}
				</Stack>
			</SectionCard>
		</Stack>
	);
};
