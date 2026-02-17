import { supabase } from '../../src/supabaseClient.js'

const loginForm = document.getElementById('login-form')
const errorMsg = document.getElementById('error-msg')

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            window.location.href = './dashboard.html'
        } catch (error) {
            errorMsg.textContent = "Errore: " + error.message
            errorMsg.classList.remove('hidden')
        }
    })
}

// Check session on page load
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    const path = window.location.pathname

    // Se siamo nella pagina di login/index e l'utente è loggato -> vai alla dashboard
    if (session && (path.endsWith('/') || path.includes('index.html') || path.includes('login.html'))) {
        window.location.href = './dashboard.html'
    }

    // Se siamo in una pagina protetta (dashboard, ecc) e l'utente NON è loggato -> vai al login
    if (!session && !path.includes('index.html') && !path.includes('login.html') && !path.endsWith('/')) {
        window.location.href = './index.html'
    }
}

checkAuth()
