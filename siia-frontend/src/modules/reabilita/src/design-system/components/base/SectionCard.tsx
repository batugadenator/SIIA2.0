import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, Divider, type SxProps, type Theme } from '@mui/material';

export interface SectionCardProps {
	title?: ReactNode;
	subtitle?: ReactNode;
	action?: ReactNode;
	children: ReactNode;
	contentSx?: SxProps<Theme>;
	sx?: SxProps<Theme>;
}

export const SectionCard = ({
	title,
	subtitle,
	action,
	children,
	contentSx,
	sx,
}: SectionCardProps) => {
	return (
		<Card sx={sx}>
			{title || subtitle || action ? <CardHeader title={title} subheader={subtitle} action={action} /> : null}
			{title || subtitle || action ? <Divider /> : null}
			<CardContent sx={contentSx}>{children}</CardContent>
		</Card>
	);
};
