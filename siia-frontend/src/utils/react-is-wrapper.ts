// ESM wrapper para react-is (CommonJS)
// Evita erro "does not provide an export named 'ForwardRef'"
import reactIs from 'react-is';

export const ForwardRef = reactIs.ForwardRef;
export const Memo = reactIs.Memo;
export const Fragment = reactIs.Fragment;
export const Profiler = reactIs.Profiler;
export const StrictMode = reactIs.StrictMode;
export const Suspense = reactIs.Suspense;
export const YieldComponent = (reactIs as any).YieldComponent;
export const isAsyncMode = reactIs.isAsyncMode;
export const isContextConsumer = reactIs.isContextConsumer;
export const isContextProvider = reactIs.isContextProvider;
export const isElement = reactIs.isElement;
export const isForwardRef = reactIs.isForwardRef;
export const isFragment = reactIs.isFragment;
export const isFunctionComponent = (reactIs as any).isFunctionComponent;
export const isLazy = reactIs.isLazy;
export const isMemo = reactIs.isMemo;
export const isProfiler = reactIs.isProfiler;
export const isStrictMode = reactIs.isStrictMode;
export const isSuspense = reactIs.isSuspense;
export const isValidElementType = reactIs.isValidElementType;

export default reactIs;
