import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { IconButton } from '@mui/material';
import { type VariantType, useSnackbar } from 'notistack';

export type NotifyVariant = VariantType;
export type NotifyFn = (message: string, variant?: NotifyVariant) => void;

export const useNotify = (): NotifyFn => {
	const { enqueueSnackbar, closeSnackbar } = useSnackbar();

	return (message: string, variant: NotifyVariant = 'default') => {
			enqueueSnackbar(message, {
			variant,
			action: (key) => (
				<IconButton aria-label="close" size="small" onClick={() => closeSnackbar(key)}>
					<CloseOutlinedIcon fontSize="small" />
				</IconButton>
			),
		});
	};
};
