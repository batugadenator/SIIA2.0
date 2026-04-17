import React from 'react';

import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { IconButton } from '@mui/material';
import {
	SnackbarKey,
	SnackbarProvider as NotistackProvider,
	type SnackbarProviderProps,
	closeSnackbar,
} from 'notistack';

export interface NotificationProviderProps extends Omit<SnackbarProviderProps, 'children'> {
	children: React.ReactNode;
}

export const NotificationProvider = ({
	children,
	maxSnack = 4,
	autoHideDuration = 3500,
	anchorOrigin = { vertical: 'top', horizontal: 'right' },
	action,
	...props
}: NotificationProviderProps) => {
	const fallbackAction = React.useCallback((key: SnackbarKey) => {
		return (
			<IconButton aria-label="close" color="inherit" size="small" onClick={() => closeSnackbar(key)}>
				<CloseOutlinedIcon fontSize="small" />
			</IconButton>
		);
	}, []);

	return (
		<NotistackProvider
			maxSnack={maxSnack}
			autoHideDuration={autoHideDuration}
			anchorOrigin={anchorOrigin}
			action={action ?? fallbackAction}
			{...props}
		>
			{children}
		</NotistackProvider>
	);
};
