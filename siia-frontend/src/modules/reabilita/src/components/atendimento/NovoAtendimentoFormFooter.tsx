import { Alert, Button, Stack } from '@mui/material';

interface NovoAtendimentoFormFooterProps {
	submitError: string | null;
	isSubmitting: boolean;
	canSubmit: boolean;
	onCancel: () => void;
}

export const NovoAtendimentoFormFooter = ({
	submitError,
	isSubmitting,
	canSubmit,
	onCancel,
}: NovoAtendimentoFormFooterProps) => {
	return (
		<>
			{submitError ? <Alert severity="error">{submitError}</Alert> : null}

			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end">
				<Button
					type="button"
					variant="text"
					onClick={onCancel}
					sx={{ minHeight: 44, minWidth: 44 }}
				>
					Cancelar
				</Button>
				<Button
					type="submit"
					variant="contained"
					disabled={isSubmitting || !canSubmit}
					sx={{ minHeight: 44, minWidth: 44 }}
				>
					{isSubmitting ? 'Registrando...' : 'Registrar Atendimento'}
				</Button>
			</Stack>
		</>
	);
};
