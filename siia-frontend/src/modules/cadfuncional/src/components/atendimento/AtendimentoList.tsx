import {
	Chip,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableSortLabel,
	TableRow,
	Typography,
} from '@mui/material';
import type { Atendimento } from '../../types/atendimento';

export type AtendimentoSortField = 'id' | 'data_registro' | 'decisao_sred';
export type AtendimentoSortDirection = 'asc' | 'desc';

export interface AtendimentoListProps {
	items: Atendimento[];
	orderBy: AtendimentoSortField;
	orderDir: AtendimentoSortDirection;
	onSortChange: (field: AtendimentoSortField) => void;
}

const formatDataRegistro = (value: string): string => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {
		hour: '2-digit',
		minute: '2-digit',
	})}`;
};

export const AtendimentoList = ({
	items,
	orderBy,
	orderDir,
	onSortChange,
}: AtendimentoListProps) => {
	return (
		<TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
			<Table size="small" sx={{ minWidth: 980 }}>
				<TableHead>
					<TableRow>
						<TableCell>ID</TableCell>
						<TableCell sortDirection={orderBy === 'data_registro' ? orderDir : false}>
							<TableSortLabel
								active={orderBy === 'data_registro'}
								direction={orderBy === 'data_registro' ? orderDir : 'asc'}
								onClick={() => onSortChange('data_registro')}
							>
								Data
							</TableSortLabel>
						</TableCell>
						<TableCell>Tipo</TableCell>
						<TableCell>Parte Lesionada</TableCell>
						<TableCell>Lateralidade</TableCell>
						<TableCell>S-RED</TableCell>
						<TableCell sortDirection={orderBy === 'decisao_sred' ? orderDir : false}>
							<TableSortLabel
								active={orderBy === 'decisao_sred'}
								direction={orderBy === 'decisao_sred' ? orderDir : 'asc'}
								onClick={() => onSortChange('decisao_sred')}
							>
								Decisão S-RED
							</TableSortLabel>
						</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{items.length === 0 ? (
						<TableRow>
							<TableCell colSpan={7} sx={{ py: 4 }}>
								<Typography variant="body2" color="text.secondary" textAlign="center">
									Nenhum atendimento para os filtros aplicados.
								</Typography>
							</TableCell>
						</TableRow>
					) : (
						items.map((item) => {
							const decisaoSredColor =
								item.decisao_sred === 'S-RED Positivo'
									? 'error'
									: item.decisao_sred === 'S-RED Negativo'
										? 'success'
										: 'default';

							return (
								<TableRow key={item.id}>
									<TableCell sx={{ whiteSpace: 'nowrap' }}>{item.id}</TableCell>
									<TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDataRegistro(item.data_registro)}</TableCell>
									<TableCell sx={{ whiteSpace: 'nowrap' }}>{item.tipo_lesao}</TableCell>
									<TableCell sx={{ minWidth: 180 }}>{item.estrutura_anatomica}</TableCell>
									<TableCell sx={{ whiteSpace: 'nowrap' }}>{item.lateralidade}</TableCell>
									<TableCell sx={{ whiteSpace: 'nowrap' }}>
										<Chip
											size="small"
											variant={item.flag_sred ? 'filled' : 'outlined'}
											color={item.flag_sred ? 'warning' : 'default'}
											label={item.flag_sred ? 'Sim' : 'Não'}
										/>
									</TableCell>
									<TableCell sx={{ whiteSpace: 'nowrap' }}>
										<Chip
											size="small"
											variant={item.decisao_sred ? 'filled' : 'outlined'}
											color={decisaoSredColor}
											label={item.decisao_sred || 'Não aplicável'}
										/>
									</TableCell>
								</TableRow>
							);
						})
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);
};
