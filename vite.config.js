import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                tourist_services: resolve(__dirname, 'tourist-services.html'),
                service_details: resolve(__dirname, 'service-details.html'),
                become_partner: resolve(__dirname, 'become-partner.html'),
                admin_login: resolve(__dirname, 'admin/index.html'),
                admin_dashboard: resolve(__dirname, 'admin/dashboard.html'),
            },
        },
    },
})
