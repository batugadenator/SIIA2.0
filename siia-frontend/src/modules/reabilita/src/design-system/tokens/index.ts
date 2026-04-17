import rawTokens from './colors.module.scss';

export type ColorTokens = Record<string, string>;

export const colorTokens: ColorTokens = rawTokens as ColorTokens;

export const getColorToken = (tokenName: string, fallback = ''): string => colorTokens[tokenName] ?? fallback;
