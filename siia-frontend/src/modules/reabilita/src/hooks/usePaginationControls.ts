import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';

export interface UsePaginationControlsOptions {
	currentPage: number;
	totalPages: number;
	setCurrentPage: Dispatch<SetStateAction<number>>;
	isReady?: boolean;
	onInvalidInput?: () => void;
	onInputClamped?: (maxPage: number) => void;
}

export interface UsePaginationControlsResult {
	pageInput: string;
	setPageInput: Dispatch<SetStateAction<string>>;
	effectivePage: number;
	canGoPrevious: boolean;
	canGoNext: boolean;
	goPrevious: () => void;
	goNext: () => void;
	goToInputPage: () => void;
}

const parsePositiveInt = (value: string): number | null => {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1) {
		return null;
	}

	return parsed;
};

export const usePaginationControls = ({
	currentPage,
	totalPages,
	setCurrentPage,
	isReady = true,
	onInvalidInput,
	onInputClamped,
}: UsePaginationControlsOptions): UsePaginationControlsResult => {
	const [pageInput, setPageInput] = useState(String(currentPage));

	const effectivePage = useMemo(() => {
		if (totalPages <= 0) {
			return 1;
		}

		return Math.min(Math.max(1, currentPage), totalPages);
	}, [currentPage, totalPages]);

	const canGoPrevious = effectivePage > 1;
	const canGoNext = totalPages > 0 && effectivePage < totalPages;

	useEffect(() => {
		setPageInput(String(currentPage));
	}, [currentPage]);

	useEffect(() => {
		if (!isReady) {
			return;
		}

		if (totalPages === 0 && currentPage !== 1) {
			setCurrentPage(1);
			return;
		}

		if (totalPages > 0 && currentPage > totalPages) {
			setCurrentPage(totalPages);
		}
	}, [isReady, currentPage, totalPages, setCurrentPage]);

	const goPrevious = () => {
		if (!canGoPrevious) {
			return;
		}

		setCurrentPage((value) => Math.max(1, value - 1));
	};

	const goNext = () => {
		if (!canGoNext) {
			return;
		}

		const maxPage = totalPages > 0 ? totalPages : 1;
		setCurrentPage((value) => Math.min(maxPage, value + 1));
	};

	const goToInputPage = () => {
		const parsed = parsePositiveInt(pageInput);
		if (!parsed) {
			setPageInput(String(effectivePage));
			onInvalidInput?.();
			return;
		}

		const maxPage = totalPages > 0 ? totalPages : 1;
		const nextPage = Math.min(parsed, maxPage);

		if (nextPage !== parsed) {
			onInputClamped?.(maxPage);
		}

		setCurrentPage(nextPage);
	};

	return {
		pageInput,
		setPageInput,
		effectivePage,
		canGoPrevious,
		canGoNext,
		goPrevious,
		goNext,
		goToInputPage,
	};
};