import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                admin_login: resolve(__dirname, 'admin/index.html'),
                admin_dashboard: resolve(__dirname, 'admin/dashboard.html'),
            },
        },
    },
})
