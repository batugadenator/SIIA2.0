var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(function (_a) {
    var _b;
    var mode = _a.mode;
    var env = loadEnv(mode, '.', '');
    var proxyTarget = (_b = env.VITE_PROXY_TARGET) !== null && _b !== void 0 ? _b : 'http://127.0.0.1:8000';
    var authHeader = env.VITE_API_BASIC_AUTH_HEADER;
    return {
        plugins: [react()],
        server: {
            port: 5173,
            proxy: {
                '/api': __assign({ target: proxyTarget, changeOrigin: true, secure: false }, (authHeader ? { headers: { Authorization: authHeader } } : {})),
            },
        },
    };
});
