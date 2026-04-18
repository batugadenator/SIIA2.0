import { alpha, type Components, type Theme } from '@mui/material/styles';

import type { ThemeOption } from './types';

export const createComponentOverrides = (theme: ThemeOption): Components<Theme> => {
	const isDarkMode = theme.mode === 'dark';
	const darkPrimaryMain = theme.colors.darkPrimaryMain ?? theme.colors.primaryMain;
	const bgColor = theme.mode === 'dark' ? theme.colors.darkLevel1 : theme.colors.grey50;
	const inputBorderColor =
		theme.mode === 'dark'
			? theme.colors.darkTextSecondary
			: theme.colors.grey400 ?? theme.colors.grey300;
	const inputHoverBorderColor =
		theme.mode === 'dark' ? theme.colors.primary200 : theme.colors.primaryLight;
	const chipDefaultBackground = alpha(theme.colors.darkTextSecondary, 0.18);
	const chipDefaultBorder = alpha(theme.colors.darkTextSecondary, 0.65);
	const chipSuccessBackground = alpha(theme.colors.successMain, 0.28);
	const chipWarningBackground = alpha(theme.colors.warningMain, 0.28);
	const chipErrorBackground = alpha(theme.colors.errorMain, 0.3);
	const chipInfoBackground = alpha(darkPrimaryMain, 0.3);
	const alertDefaultBorder = alpha(theme.colors.darkTextSecondary, 0.45);
	const alertWarningBorder = alpha(theme.colors.warningMain, 0.6);
	const alertErrorBorder = alpha(theme.colors.errorMain, 0.65);
	const alertSuccessBorder = alpha(theme.colors.successMain, 0.55);
	const alertInfoBorder = alpha(theme.colors.primary200, 0.55);
	const alertWarningBackground = alpha(theme.colors.warningMain, 0.18);
	const alertErrorBackground = alpha(theme.colors.errorMain, 0.2);
	const alertSuccessBackground = alpha(theme.colors.successMain, 0.18);
	const alertInfoBackground = alpha(theme.colors.primary200, 0.2);

	return {
		MuiCssBaseline: {
			styleOverrides: {
				body: {
					transition: 'background-color 160ms ease, color 160ms ease',
				},
			},
		},
		MuiButton: {
			styleOverrides: {
				root: {
					fontWeight: 500,
					borderRadius: '10px',
					...(theme.mode === 'dark'
						? {
							'&.MuiButton-text': {
								color: theme.colors.darkTextTitle,
							},
							'&.MuiButton-text:hover': {
								backgroundColor: theme.colors.darkLevel2,
							},
							'&.MuiButton-contained': {
								backgroundColor: darkPrimaryMain,
								color: '#ffffff',
								'&:hover': {
									backgroundColor: alpha(darkPrimaryMain, 0.85),
								},
								'&.Mui-disabled': {
									backgroundColor: alpha(darkPrimaryMain, 0.35),
									color: alpha('#ffffff', 0.5),
								},
							},
							'&.MuiButton-outlined': {
								color: darkPrimaryMain,
								borderColor: darkPrimaryMain,
								'&:hover': {
									backgroundColor: alpha(darkPrimaryMain, 0.08),
									borderColor: darkPrimaryMain,
								},
							},
						}
						: {}),
				},
			},
		},
		MuiFormLabel: {
			styleOverrides: {
				root: {
					...(theme.mode === 'dark'
						? {
							color: theme.colors.darkTextSecondary,
							'&.Mui-focused': {
								color: theme.colors.darkTextTitle,
							},
						}
						: {}),
				},
			},
		},
		MuiPaper: {
			defaultProps: {
				elevation: 0,
			},
			styleOverrides: {
				root: {
					backgroundImage: 'none',
					backgroundColor: theme.paper,
				},
				rounded: {
					borderRadius: '8px',
				},
			},
		},
		MuiCardHeader: {
			styleOverrides: {
				root: {
					color: theme.textDark,
					padding: '24px',
				},
				title: {
					fontSize: '1.4rem',
					paddingBottom: '4px',
				},
			},
		},
		MuiCardContent: {
			styleOverrides: {
				root: {
					padding: '24px',
				},
			},
		},
		MuiCardActions: {
			styleOverrides: {
				root: {
					padding: '24px',
				},
			},
		},
		MuiListItemButton: {
			styleOverrides: {
				root: {
					color: theme.darkTextPrimary,
					paddingTop: '10px',
					paddingBottom: '10px',
					'&.Mui-selected': {
						color: theme.menuSelected,
						backgroundColor: theme.menuSelectedBack,
						'&:hover': {
							backgroundColor: theme.menuSelectedBack,
						},
						'& .MuiListItemIcon-root': {
							color: theme.menuSelected,
						},
					},
					'&:hover': {
						backgroundColor: theme.menuSelectedBack,
						color: theme.menuSelected,
						'& .MuiListItemIcon-root': {
							color: theme.menuSelected,
						},
					},
				},
			},
		},
		MuiListItemIcon: {
			styleOverrides: {
				root: {
					color: theme.darkTextPrimary,
					minWidth: '36px',
				},
			},
		},
		MuiInputBase: {
			styleOverrides: {
				input: {
					color: theme.textDark,
					'&::placeholder': {
						color: theme.darkTextSecondary,
						fontSize: '0.875rem',
					},
				},
			},
		},
		MuiOutlinedInput: {
			styleOverrides: {
				root: {
					background: bgColor,
					borderRadius: '8px',
					'& .MuiOutlinedInput-notchedOutline': {
						borderColor: inputBorderColor,
					},
					'&:hover .MuiOutlinedInput-notchedOutline': {
						borderColor: inputHoverBorderColor,
					},
					'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
						borderColor: inputHoverBorderColor,
					},
					'&.MuiInputBase-multiline': {
						padding: 1,
					},
				},
				input: {
					fontWeight: 500,
					background: bgColor,
					padding: '15.5px 14px',
					borderRadius: '8px',
					'&.MuiInputBase-inputSizeSmall': {
						padding: '10px 14px',
						'&.MuiInputBase-inputAdornedStart': {
							paddingLeft: 0,
						},
					},
				},
				inputAdornedStart: {
					paddingLeft: 4,
				},
				notchedOutline: {
					borderRadius: '8px',
				},
			},
		},
		MuiDivider: {
			styleOverrides: {
				root: {
					borderColor: theme.divider,
					opacity: 1,
				},
			},
		},
		MuiTableContainer: {
			styleOverrides: {
				root: {
					...(theme.mode === 'dark'
						? {
							backgroundColor: theme.colors.darkLevel1,
							borderRadius: 8,
							border: `1px solid ${theme.colors.darkLevel2}`,
						}
						: {}),
				},
			},
		},
		MuiTableHead: {
			styleOverrides: {
				root: {
					...(theme.mode === 'dark'
						? {
							backgroundColor: theme.colors.darkLevel2,
						}
						: {}),
				},
			},
		},
		MuiTableCell: {
			styleOverrides: {
				head: {
					fontWeight: 700,
					...(theme.mode === 'dark'
						? {
							color: theme.colors.darkTextTitle,
							borderBottomColor: theme.colors.darkLevel2,
						}
						: {}),
				},
				body: {
					...(theme.mode === 'dark'
						? {
							color: theme.colors.darkTextPrimary,
							borderBottomColor: theme.colors.darkLevel2,
						}
						: {}),
				},
			},
		},
		MuiTableRow: {
			styleOverrides: {
				root: {
					...(theme.mode === 'dark'
						? {
							'&:hover': {
								backgroundColor: theme.colors.darkLevel2,
							},
						}
						: {}),
				},
			},
		},
		MuiChip: {
			styleOverrides: {
				root: {
					...(isDarkMode
						? {
							color: theme.colors.darkTextTitle,
							backgroundColor: chipDefaultBackground,
							'& .MuiChip-icon': {
								color: 'inherit',
							},
							'& .MuiChip-deleteIcon': {
								color: theme.colors.darkTextSecondary,
								'&:hover': {
									color: theme.colors.darkTextTitle,
								},
							},
							'&.MuiChip-outlined': {
								backgroundColor: 'transparent',
								borderColor: chipDefaultBorder,
							},
							'&.MuiChip-colorSuccess': {
								backgroundColor: chipSuccessBackground,
							},
							'&.MuiChip-colorWarning': {
								backgroundColor: chipWarningBackground,
							},
							'&.MuiChip-colorError': {
								backgroundColor: chipErrorBackground,
							},
							'&.MuiChip-colorInfo': {
								backgroundColor: chipInfoBackground,
							},
							'&.MuiChip-colorSuccess.MuiChip-outlined': {
								color: theme.colors.success200,
								borderColor: alpha(theme.colors.success200, 0.8),
							},
							'&.MuiChip-colorWarning.MuiChip-outlined': {
								color: theme.colors.warningMain,
								borderColor: alpha(theme.colors.warningMain, 0.8),
							},
							'&.MuiChip-colorError.MuiChip-outlined': {
								color: theme.colors.errorLight,
								borderColor: alpha(theme.colors.errorMain, 0.8),
							},
							'&.MuiChip-colorInfo.MuiChip-outlined': {
								color: theme.colors.primary200,
								borderColor: alpha(theme.colors.primary200, 0.8),
							},
						}
						: {}),
				},
			},
		},
		MuiAlert: {
			styleOverrides: {
				root: {
					...(isDarkMode
						? {
							color: theme.colors.darkTextTitle,
							border: `1px solid ${alertDefaultBorder}`,
							'& .MuiAlert-message': {
								color: 'inherit',
							},
						}
						: {}),
				},
				action: {
					...(isDarkMode
						? {
							color: theme.colors.darkTextTitle,
							'& .MuiButton-root': {
								color: 'inherit',
							},
						}
						: {}),
				},
				icon: {
					...(isDarkMode
						? {
							opacity: 1,
						}
						: {}),
				},
				standardWarning: {
					...(isDarkMode
						? {
							backgroundColor: alertWarningBackground,
							borderColor: alertWarningBorder,
							'& .MuiAlert-icon': {
								color: theme.colors.warningMain,
							},
						}
						: {}),
				},
				standardError: {
					...(isDarkMode
						? {
							backgroundColor: alertErrorBackground,
							borderColor: alertErrorBorder,
							'& .MuiAlert-icon': {
								color: theme.colors.errorLight,
							},
						}
						: {}),
				},
				standardSuccess: {
					...(isDarkMode
						? {
							backgroundColor: alertSuccessBackground,
							borderColor: alertSuccessBorder,
							'& .MuiAlert-icon': {
								color: theme.colors.success200,
							},
						}
						: {}),
				},
				standardInfo: {
					...(isDarkMode
						? {
							backgroundColor: alertInfoBackground,
							borderColor: alertInfoBorder,
							'& .MuiAlert-icon': {
								color: theme.colors.primary200,
							},
						}
						: {}),
				},
				outlinedWarning: {
					...(isDarkMode
						? {
							borderColor: alertWarningBorder,
							'& .MuiAlert-icon': {
								color: theme.colors.warningMain,
							},
						}
						: {}),
				},
				outlinedError: {
					...(isDarkMode
						? {
							borderColor: alertErrorBorder,
							'& .MuiAlert-icon': {
								color: theme.colors.errorLight,
							},
						}
						: {}),
				},
				outlinedSuccess: {
					...(isDarkMode
						? {
							borderColor: alertSuccessBorder,
							'& .MuiAlert-icon': {
								color: theme.colors.success200,
							},
						}
						: {}),
				},
				outlinedInfo: {
					...(isDarkMode
						? {
							borderColor: alertInfoBorder,
							'& .MuiAlert-icon': {
								color: theme.colors.primary200,
							},
						}
						: {}),
				},
				filledWarning: {
					...(isDarkMode
						? {
							backgroundColor: theme.colors.warningDark,
							color: theme.colors.grey900,
						}
						: {}),
				},
				filledError: {
					...(isDarkMode
						? {
							backgroundColor: theme.colors.errorDark,
							color: theme.colors.darkTextTitle,
						}
						: {}),
				},
				filledSuccess: {
					...(isDarkMode
						? {
							backgroundColor: theme.colors.successDark,
							color: theme.colors.grey900,
						}
						: {}),
				},
				filledInfo: {
					...(isDarkMode
						? {
							backgroundColor: darkPrimaryMain,
							color: theme.colors.darkTextTitle,
						}
						: {}),
				},
			},
		},
		MuiAvatar: {
			styleOverrides: {
				root: {
					color: theme.colors.primaryDark,
					background: theme.colors.primary200,
				},
			},
		},
		MuiTooltip: {
			styleOverrides: {
				tooltip: {
					color: theme.paper,
					background: theme.colors.grey700,
				},
			},
		},
	};
};
