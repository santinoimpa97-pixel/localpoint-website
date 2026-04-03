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
                privacy_policy: resolve(__dirname, 'privacy-policy.html'),
                admin_login: resolve(__dirname, 'admin/index.html'),
                admin_dashboard: resolve(__dirname, 'admin/dashboard.html'),
                admin_partner_portal: resolve(__dirname, 'admin/partner-portal.html'),
                admin_partners: resolve(__dirname, 'admin/partners.html'),
                admin_reset_password: resolve(__dirname, 'admin/reset-password.html'),
                admin_print_kit: resolve(__dirname, 'admin/print-kit.html'),
                admin_poster_settings: resolve(__dirname, 'admin/poster-settings.html'),
            },
        },
    },
})
