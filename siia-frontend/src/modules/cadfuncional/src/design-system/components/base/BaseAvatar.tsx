import React from 'react';

import { Avatar, type AvatarProps } from '@mui/material';

export interface BaseAvatarProps extends Omit<AvatarProps, 'children'> {
	name?: string | null;
	fallbackText?: string;
}

const getInitials = (name?: string | null, fallbackText = 'U') => {
	if (!name?.trim()) {
		return fallbackText;
	}

	const words = name.trim().split(/\s+/).filter(Boolean);
	if (words.length === 1) {
		return words[0][0].toUpperCase();
	}

	return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

export const BaseAvatar = ({ name, fallbackText = 'U', ...props }: BaseAvatarProps) => {
	const initials = React.useMemo(() => getInitials(name, fallbackText), [name, fallbackText]);

	return <Avatar {...props}>{initials}</Avatar>;
};
