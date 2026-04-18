import { Button, Stack } from '@mui/material';

export interface FilterActionsRowProps {
	refreshLabel: string;
	onRefresh: () => void | Promise<void>;
	refreshDisabled?: boolean;
	onClear: () => void;
	clearLabel?: string;
}

export const FilterActionsRow = ({
	refreshLabel,
	onRefresh,
	refreshDisabled = false,
	onClear,
	clearLabel = 'Limpar filtros',
}: FilterActionsRowProps) => {
	return (
		<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
			<Button
				variant="outlined"
				onClick={() => void onRefresh()}
				disabled={refreshDisabled}
				sx={{ minHeight: 44, minWidth: 44 }}
			>
				{refreshLabel}
			</Button>
			<Button variant="text" onClick={onClear} sx={{ minHeight: 44, minWidth: 44 }}>
				{clearLabel}
			</Button>
		</Stack>
	);
};
