import type { ReactNode } from 'react';

import { Stack, Typography } from '@mui/material';

export interface EmptyStateProps {
	title?: ReactNode;
	description?: ReactNode;
	icon?: ReactNode;
	action?: ReactNode;
	height?: number | string;
}

export const EmptyState = ({
	title = 'Nada por aqui',
	description = 'Não há itens para exibir no momento.',
	icon,
	action,
	height = '100%',
}: EmptyStateProps) => {
	return (
		<Stack
			alignItems="center"
			justifyContent="center"
			height={height}
			gap={1}
			px={2}
			textAlign="center"
		>
			{icon}
			<Typography variant="h6">{title}</Typography>
			<Typography variant="body2" color="text.secondary">
				{description}
			</Typography>
			{action}
		</Stack>
	);
};
