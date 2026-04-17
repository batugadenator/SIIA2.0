import { Button, Chip, Stack, Typography } from '@mui/material';

interface ProcessStep {
	id: number;
	title: string;
}

interface NovoAtendimentoProgressHeaderProps {
	currentStep: number;
	processSteps: ProcessStep[];
	stepCompletionByIndex: Record<number, boolean>;
	onPrevious: () => void;
	onNext: () => void;
}

export const NovoAtendimentoProgressHeader = ({
	currentStep,
	processSteps,
	stepCompletionByIndex,
	onPrevious,
	onNext,
}: NovoAtendimentoProgressHeaderProps) => {
	return (
		<>
			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				justifyContent="space-between"
				alignItems={{ sm: 'center' }}
				spacing={1}
			>
				<Typography variant="body2" color="text.secondary">
					Etapa {currentStep} de 5
				</Typography>
				<Stack direction="row" spacing={1}>
					<Button
						type="button"
						variant="outlined"
						onClick={onPrevious}
						disabled={currentStep === 1}
						sx={{ minHeight: 44, minWidth: 44 }}
					>
						Anterior
					</Button>
					<Button
						type="button"
						variant="outlined"
						onClick={onNext}
						disabled={currentStep === 5}
						sx={{ minHeight: 44, minWidth: 44 }}
					>
						Próxima Página
					</Button>
				</Stack>
			</Stack>

			<Typography variant="caption" color="text.secondary">
				A navegação entre etapas ocorre apenas pelos botões Anterior e Próxima Página.
			</Typography>

			<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
				{processSteps.map((stepItem) => {
					const step = stepItem.id;
					const concluida = stepCompletionByIndex[step];
					const ativa = currentStep === step;

					return (
						<Chip
							key={step}
							size="small"
							variant={ativa ? 'filled' : 'outlined'}
							color={concluida ? 'success' : ativa ? 'primary' : 'default'}
							label={`${step} · ${stepItem.title} · ${concluida ? 'Concluída' : ativa ? 'Atual' : 'Pendente'}`}
						/>
					);
				})}
			</Stack>
		</>
	);
};
