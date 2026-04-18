import { useRef, useState } from 'react';

import {
	Alert,
	Button,
	Chip,
	CircularProgress,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import axios from 'axios';

import { SectionCard, useNotify } from '../design-system';
import { useConfirmarCSV, usePreviewCSV } from '../hooks/useImportarCSV';
import type { CSVPreviewResponse } from '../types/atendimento';

export const ImportarCSVPage = () => {
	const notify = useNotify();
	const fileRef = useRef<HTMLInputElement>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<CSVPreviewResponse | null>(null);

	const previewMutation = usePreviewCSV();
	const confirmarMutation = useConfirmarCSV();

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0] ?? null;
		setSelectedFile(file);
		setPreview(null);
	};

	const handlePreview = async () => {
		if (!selectedFile) return;
		try {
			const result = await previewMutation.mutateAsync(selectedFile);
			setPreview(result);
			if (result.total_erros > 0) {
				notify(`${result.total_erros} erro(s) detectado(s) no CSV.`, 'warning');
			} else {
				notify(`${result.total_linhas} linhas válidas para importação.`, 'success');
			}
		} catch (error) {
			const msg = axios.isAxiosError(error)
				? error.response?.data?.detail ?? 'Falha ao processar CSV.'
				: 'Erro inesperado.';
			notify(msg, 'error');
		}
	};

	const handleConfirmar = async () => {
		if (!selectedFile) return;
		try {
			const result = await confirmarMutation.mutateAsync(selectedFile);
			notify(`${result.criados} atendimentos importados com sucesso.`, 'success');
			setPreview(null);
			setSelectedFile(null);
			if (fileRef.current) fileRef.current.value = '';
		} catch (error) {
			const msg = axios.isAxiosError(error)
				? error.response?.data?.detail ?? 'Falha ao importar CSV.'
				: 'Erro inesperado.';
			notify(msg, 'error');
		}
	};

	return (
		<Stack spacing={2}>
			<Typography variant="h5">Importar Atendimentos via CSV</Typography>
			<Typography variant="body2" color="text.secondary">
				Envie um arquivo CSV (separador ; ou ,) para importar atendimentos em lote. O formato
				esperado segue o layout de <code>carga_cadetes.csv</code>.
			</Typography>

			<SectionCard title="1 · Selecionar Arquivo">
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
					<Button
						variant="outlined"
						component="label"
						sx={{ minHeight: 44, minWidth: 44 }}
					>
						Escolher CSV
						<input
							ref={fileRef}
							type="file"
							accept=".csv"
							hidden
							onChange={handleFileChange}
						/>
					</Button>
					{selectedFile && (
						<Typography variant="body2">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</Typography>
					)}
					<Button
						variant="contained"
						onClick={handlePreview}
						disabled={!selectedFile || previewMutation.isPending}
						sx={{ minHeight: 44, minWidth: 44 }}
					>
						{previewMutation.isPending ? <CircularProgress size={20} /> : 'Pré-visualizar'}
					</Button>
				</Stack>
			</SectionCard>

			{preview && (
				<>
					<SectionCard title="2 · Resumo da Validação">
						<Stack spacing={1}>
							<Stack direction="row" spacing={2}>
								<Chip label={`${preview.total_linhas} linhas`} color="info" />
								<Chip
									label={`${preview.total_erros} erro(s)`}
									color={preview.total_erros > 0 ? 'error' : 'success'}
								/>
								<Chip label={`${preview.colunas_detectadas.length} colunas`} color="default" />
							</Stack>
							{preview.erros.length > 0 && (
								<Alert severity="error" sx={{ mt: 1 }}>
									<Typography variant="subtitle2" gutterBottom>Erros encontrados:</Typography>
									<ul style={{ margin: 0, paddingLeft: 16 }}>
										{preview.erros.map((e, i) => (
											<li key={i}><Typography variant="body2">{e}</Typography></li>
										))}
									</ul>
								</Alert>
							)}
						</Stack>
					</SectionCard>

					<SectionCard title="3 · Preview (primeiras 20 linhas)">
						<TableContainer sx={{ overflowX: 'auto' }}>
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell>Linha</TableCell>
										<TableCell>Data</TableCell>
										<TableCell>Atendimento</TableCell>
										<TableCell>Lesão</TableCell>
										<TableCell>Parte do Corpo</TableCell>
										<TableCell>Parte Lesionada</TableCell>
										<TableCell>Origem</TableCell>
										<TableCell>Status</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{preview.preview.map((row) => (
										<TableRow key={row.linha}>
											<TableCell>{row.linha}</TableCell>
											<TableCell>{row.data}</TableCell>
											<TableCell>{row.atendimento}</TableCell>
											<TableCell>{row.lesao}</TableCell>
											<TableCell>{row.parte_corpo}</TableCell>
											<TableCell>{row.parte_lesionada}</TableCell>
											<TableCell>{row.origem}</TableCell>
											<TableCell>
												{row.erros.length > 0 ? (
													<Chip label="Erro" color="error" size="small" />
												) : (
													<Chip label="OK" color="success" size="small" />
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					</SectionCard>

					<SectionCard title="4 · Confirmar Importação">
						<Stack spacing={1}>
							{preview.total_erros > 0 ? (
								<Alert severity="warning">
									Corrija os erros no CSV antes de confirmar a importação.
								</Alert>
							) : (
								<>
									<Typography variant="body2">
										{preview.total_linhas} atendimentos serão criados no banco de dados.
									</Typography>
									<Button
										variant="contained"
										color="primary"
										onClick={handleConfirmar}
										disabled={confirmarMutation.isPending}
										sx={{ minHeight: 44, maxWidth: 280 }}
									>
										{confirmarMutation.isPending ? (
											<CircularProgress size={20} />
										) : (
											'Confirmar Importação'
										)}
									</Button>
								</>
							)}
						</Stack>
					</SectionCard>
				</>
			)}
		</Stack>
	);
};
