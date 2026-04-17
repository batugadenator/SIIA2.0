import { Button, Stack, TextField } from '@mui/material';

export interface PaginationControlsRowProps {
	canGoPrevious: boolean;
	canGoNext: boolean;
	onGoPrevious: () => void;
	onGoNext: () => void;
	pageInput: string;
	onPageInputChange: (value: string) => void;
	onGoToPage: () => void;
	isBusy?: boolean;
	disableGo?: boolean;
	previousLabel?: string;
	nextLabel?: string;
	pageInputLabel?: string;
	goLabel?: string;
}

export const PaginationControlsRow = ({
	canGoPrevious,
	canGoNext,
	onGoPrevious,
	onGoNext,
	pageInput,
	onPageInputChange,
	onGoToPage,
	isBusy = false,
	disableGo = false,
	previousLabel = 'Página anterior',
	nextLabel = 'Próxima página',
	pageInputLabel = 'Ir para página',
	goLabel = 'Ir',
}: PaginationControlsRowProps) => {
	return (
		<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
			<Button
				variant="outlined"
				onClick={onGoPrevious}
				disabled={!canGoPrevious || isBusy}
				sx={{ minHeight: 44, minWidth: 44 }}
			>
				{previousLabel}
			</Button>
			<Button
				variant="outlined"
				onClick={onGoNext}
				disabled={!canGoNext || isBusy}
				sx={{ minHeight: 44, minWidth: 44 }}
			>
				{nextLabel}
			</Button>
			<TextField
				label={pageInputLabel}
				type="number"
				value={pageInput}
				onChange={(event) => onPageInputChange(event.target.value)}
				onKeyDown={(event) => {
					if (event.key === 'Enter') {
						event.preventDefault();
						onGoToPage();
					}
				}}
				inputProps={{ min: 1 }}
				sx={{ minWidth: { xs: '100%', sm: 180 }, '& .MuiInputBase-root': { minHeight: 44 } }}
			/>
			<Button
				variant="contained"
				onClick={onGoToPage}
				disabled={disableGo || isBusy}
				sx={{ minHeight: 44, minWidth: 44 }}
			>
				{goLabel}
			</Button>
		</Stack>
	);
};
