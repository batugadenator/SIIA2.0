import React from 'react';

import { NotificationProvider, type NotificationProviderProps } from './NotificationProvider';
import { ThemeProvider, type ThemeProviderProps } from './ThemeProvider';

type NotificationOptions = Omit<NotificationProviderProps, 'children'>;

export interface DesignSystemProviderProps extends Omit<ThemeProviderProps, 'children'> {
	children: React.ReactNode;
	enableNotifications?: boolean;
	notificationOptions?: NotificationOptions;
}

export const DesignSystemProvider = ({
	children,
	enableNotifications = true,
	notificationOptions,
	...themeProps
}: DesignSystemProviderProps) => {
	if (!enableNotifications) {
		return <ThemeProvider {...themeProps}>{children}</ThemeProvider>;
	}

	return (
		<ThemeProvider {...themeProps}>
			<NotificationProvider {...notificationOptions}>{children}</NotificationProvider>
		</ThemeProvider>
	);
};
