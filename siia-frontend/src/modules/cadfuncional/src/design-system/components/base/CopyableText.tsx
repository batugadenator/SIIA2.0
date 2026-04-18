import React from 'react';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';

export interface CopyableTextProps {
	value: string;
	maxWidth?: number | string;
	tooltip?: string;
	disabled?: boolean;
	onCopied?: (value: string) => void;
	onCopyError?: (error: unknown) => void;
}

export const CopyableText = ({
	value,
	maxWidth = '100%',
	tooltip = 'Copiar',
	disabled = false,
	onCopied,
	onCopyError,
}: CopyableTextProps) => {
	const handleCopy = React.useCallback(async () => {
		if (disabled) {
			return;
		}

		try {
			await navigator.clipboard.writeText(value);
			onCopied?.(value);
		} catch (error) {
			onCopyError?.(error);
		}
	}, [disabled, onCopied, onCopyError, value]);

	return (
		<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, minWidth: 0, maxWidth }}>
			<Typography
				variant="body2"
				sx={{
					whiteSpace: 'nowrap',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
				}}
			>
				{value}
			</Typography>
			<Tooltip title={tooltip}>
				<span>
					<IconButton size="small" onClick={handleCopy} disabled={disabled} aria-label="copy">
						<ContentCopyIcon fontSize="inherit" />
					</IconButton>
				</span>
			</Tooltip>
		</Box>
	);
};
