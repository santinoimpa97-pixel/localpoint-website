import { supabase } from '../../src/supabaseClient.js'

// ── Elements ──
const loginForm   = document.getElementById('login-form')
const forgotPanel = document.getElementById('forgot-panel')
const errorMsg    = document.getElementById('error-msg')
const errorText   = document.getElementById('error-text')
const submitBtn   = document.getElementById('submit-btn')
const btnIcon     = document.getElementById('btn-icon')
const btnText     = document.getElementById('btn-text')
const loginCard   = document.getElementById('login-card')
const cardTitle   = document.getElementById('card-title')
const cardSub     = document.getElementById('card-sub')
const rememberMe  = document.getElementById('remember-me')

// ── Helpers ──
function setLoading(btn, iconEl, textEl, on, idleIcon, idleText) {
    btn.disabled = on
    if (on) {
        iconEl.className = 'fa-solid fa-spinner fa-spin'
        textEl.textContent = 'Attendere...'
    } else {
        iconEl.className = idleIcon
        textEl.textContent = idleText
    }
}

function showError(msg) {
    errorText.textContent = msg
    errorMsg.classList.add('visible')
    loginCard.classList.remove('shake')
    void loginCard.offsetWidth
    loginCard.classList.add('shake')
    loginCard.addEventListener('animationend', () => loginCard.classList.remove('shake'), { once: true })
}

// ── Toggle password visibility ──
document.getElementById('toggle-pw')?.addEventListener('click', () => {
    const input = document.getElementById('password')
    const icon  = document.getElementById('pw-icon')
    if (input.type === 'password') {
        input.type = 'text'
        icon.className = 'fa-regular fa-eye-slash'
    } else {
        input.type = 'password'
        icon.className = 'fa-regular fa-eye'
    }
})

// ── Show/hide forgot panel ──
document.getElementById('show-forgot')?.addEventListener('click', () => {
    loginForm.style.display = 'none'
    forgotPanel.classList.add('visible')
    document.getElementById('reset-success').classList.remove('visible')
    cardTitle.textContent = 'Recupera password'
    cardSub.textContent   = 'Inserisci la tua email per ricevere il link di reset'
    errorMsg.classList.remove('visible')
})

document.getElementById('back-to-login')?.addEventListener('click', () => {
    forgotPanel.classList.remove('visible')
    loginForm.style.display = 'flex'
    cardTitle.textContent = 'Bentornato'
    cardSub.textContent   = 'Accedi al pannello di amministrazione'
})

// ── Login ──
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        errorMsg.classList.remove('visible')

        const email    = document.getElementById('email').value.trim()
        const password = document.getElementById('password').value
        const remember = rememberMe?.checked !== false

        setLoading(submitBtn, btnIcon, btnText, true)
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error

            // Ricordami: se non spuntato, segniamo la sessione come temporanea
            if (!remember) sessionStorage.setItem('lp_no_persist', '1')
            else sessionStorage.removeItem('lp_no_persist')

            window.location.href = '/admin/dashboard.html'
        } catch {
            setLoading(submitBtn, btnIcon, btnText, false, 'fa-solid fa-arrow-right-to-bracket', 'Accedi')
            showError('Email o password non corretti. Riprova.')
        }
    })
}

// ── Reset password ──
document.getElementById('reset-btn')?.addEventListener('click', async () => {
    const email      = document.getElementById('reset-email').value.trim()
    const resetIcon  = document.getElementById('reset-icon')
    const resetText  = document.getElementById('reset-text')
    const resetBtn   = document.getElementById('reset-btn')
    const successEl  = document.getElementById('reset-success')

    if (!email) {
        document.getElementById('reset-email').focus()
        return
    }

    resetBtn.disabled = true
    resetIcon.className = 'fa-solid fa-spinner fa-spin'
    resetText.textContent = 'Invio in corso...'

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/admin/reset-password.html'
    })

    resetBtn.disabled = false
    resetIcon.className = 'fa-solid fa-paper-plane'
    resetText.textContent = 'Invia link di reset'

    if (error) {
        alert('Errore: ' + error.message)
    } else {
        successEl.classList.add('visible')
        document.getElementById('reset-email').value = ''
    }
})

// ── Se già loggato → dashboard ──
// Se "no persist", disconnetti quando il tab si chiude
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) window.location.href = '/admin/dashboard.html'
}

// Gestisci "Ricordami = NO": disconnetti alla chiusura del tab
if (sessionStorage.getItem('lp_no_persist')) {
    window.addEventListener('beforeunload', () => supabase.auth.signOut())
}

checkAuth()
