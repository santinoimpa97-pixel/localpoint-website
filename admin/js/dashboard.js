import { supabase } from '../../src/supabaseClient.js'
import emailjs from '@emailjs/browser'

// --- EMAILJS CONFIG ---
const EMAILJS_SERVICE_ID = 'service_dmf1g2a'
const EMAILJS_TEMPLATE_ID = 'template_ihapitu'
const EMAILJS_PUBLIC_KEY = '0nPf665f0pWsHFx1j'
emailjs.init(EMAILJS_PUBLIC_KEY)

// --- DEBUG OVERLAY REMOVED ---

// --- GOOGLE REVIEW LINK ---
const GOOGLE_REVIEW_URL = 'https://g.page/r/CQSpCw3gaeKjEAE/review'

// --- AUTH & INIT ---
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        window.location.href = '/admin/index.html'
    }
}
checkAuth()
// checkAuth() // BYPASS FOR DEBUGGING REVERTED

// --- NAVIGATION ---
const views = {
    dashboard: document.getElementById('view-dashboard'),
    luggage: document.getElementById('view-luggage'),
    accounting: document.getElementById('view-accounting'),
    reservations: document.getElementById('view-reservations'),
    shipping: document.getElementById('view-shipping')
}

const navBtns = {
    dashboard: document.getElementById('nav-dashboard'),
    luggage: document.getElementById('nav-luggage'),
    accounting: document.getElementById('nav-accounting'),
    reservations: document.getElementById('nav-reservations'),
    shipping: document.getElementById('nav-shipping')
}

// Global Shipping Refs
let shippingList, shippingForm

function switchView(viewName) {
    // Hide all views
    Object.values(views).forEach(el => el.classList.add('hidden'))
    // Show selected
    views[viewName].classList.remove('hidden')

    // Update nav styles
    Object.values(navBtns).forEach(btn => {
        btn.classList.remove('bg-blue-50', 'text-blue-700')
        btn.classList.add('text-gray-600', 'hover:bg-gray-50')
    })
    navBtns[viewName].classList.remove('text-gray-600', 'hover:bg-gray-50')
    navBtns[viewName].classList.add('bg-blue-50', 'text-blue-700')

    // Load data if needed
    if (viewName === 'dashboard') {
        loadDashboardHome()
    }
    if (viewName === 'luggage') {
        loadLuggage()
        loadReturnedLuggage()

    }
    if (viewName === 'accounting') {
        loadAccounting()
    }
    if (viewName === 'reservations') {
        loadReservations()
    }
    if (viewName === 'shipping') {
        loadShipping()
    }
}

// Bind clicks
Object.keys(navBtns).forEach(key => {
    navBtns[key].addEventListener('click', () => switchView(key))
})
window.switchView = switchView

// Logout
document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await supabase.auth.signOut()
    window.location.href = '/admin/index.html'
})


// --- MOBILE MENU ---
const mobileMenuBtn = document.getElementById('mobile-menu-btn')
const sidebar = document.getElementById('sidebar')

if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('hidden')
        sidebar.classList.toggle('flex') // Ensure it shows as flex
    })
}

// Close sidebar when clicking a nav item on mobile
document.querySelectorAll('aside nav button').forEach(btn => {
    btn.addEventListener('click', () => {
        if (window.innerWidth < 768) { // Only on mobile
            sidebar.classList.add('hidden')
            sidebar.classList.remove('flex')
        }
    })
})

// --- LUGGAGE FEATURE ---
const PRICE_PER_BAG_PER_DAY = 4.00
const luggageList = document.getElementById('luggage-list')
const luggageForm = document.getElementById('luggage-form')
const luggageCount = document.getElementById('luggage-count')
const luggagePrice = document.getElementById('luggage-price')
const luggageDatetime = document.getElementById('luggage-datetime')
const luggageDatetimeEnd = document.getElementById('luggage-datetime-end')
const daysInfo = document.getElementById('days-info')

// Calculate days between two dates (minimum 1)
function calcDays() {
    if (!luggageDatetime?.value || !luggageDatetimeEnd?.value) return 1
    const start = new Date(luggageDatetime.value)
    const end = new Date(luggageDatetimeEnd.value)
    const diffMs = end - start
    if (diffMs <= 0) return 1
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24)) // round up to full days
}

// Recalculate total price
function recalcPrice() {
    const count = parseInt(luggageCount?.value) || 1
    const days = calcDays()
    const total = count * days * PRICE_PER_BAG_PER_DAY
    if (luggagePrice) luggagePrice.value = `€ ${total.toFixed(2).replace('.', ',')}`
    if (daysInfo) daysInfo.textContent = `Durata: ${days} giorn${days === 1 ? 'o' : 'i'} — ${count} bagagli — ${days} gg — €4 = €${total.toFixed(2).replace('.', ',')}`
}

// Bind recalculation to all relevant inputs
if (luggageCount) luggageCount.addEventListener('input', recalcPrice)
if (luggageDatetime) luggageDatetime.addEventListener('input', recalcPrice)
if (luggageDatetimeEnd) luggageDatetimeEnd.addEventListener('input', recalcPrice)

// Set default dates (start = now, end = tomorrow same time)
function setDefaultDatetime() {
    const now = new Date()
    const offset = now.getTimezoneOffset()
    const local = new Date(now.getTime() - offset * 60000)
    const tomorrow = new Date(local.getTime() + 24 * 60 * 60000)
    if (luggageDatetime) luggageDatetime.value = local.toISOString().slice(0, 16)
    if (luggageDatetimeEnd) luggageDatetimeEnd.value = tomorrow.toISOString().slice(0, 16)
    recalcPrice()
}
setDefaultDatetime()

// Store loaded tickets for client-side search
let allLuggageTickets = []
const luggageSearch = document.getElementById('luggage-search')

// Search filter
if (luggageSearch) {
    luggageSearch.addEventListener('input', () => {
        const q = luggageSearch.value.trim().toLowerCase().replace('#', '')
        if (!q) {
            renderLuggageList(allLuggageTickets)
            return
        }
        const filtered = allLuggageTickets.filter(t =>
            t.id.slice(0, 8).toLowerCase().includes(q) ||
            t.customer_name.toLowerCase().includes(q)
        )
        renderLuggageList(filtered)
    })
}

async function loadLuggage() {
    const { data, error } = await supabase
        .from('luggage_tickets')
        .select('*')
        .eq('status', 'stored')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error loading luggage:', error)
        return
    }

    allLuggageTickets = data || []
    renderLuggageList(allLuggageTickets)
    allLuggageTickets = data || []
    renderLuggageList(allLuggageTickets)
    const statsEl = document.getElementById('stats-luggage-dash')
    if (statsEl) statsEl.innerText = allLuggageTickets.length
}

// Helper: format elapsed time
function formatElapsed(ms) {
    if (ms < 0) ms = 0
    const totalMin = Math.floor(ms / 60000)
    const hours = Math.floor(totalMin / 60)
    const mins = totalMin % 60
    if (hours >= 24) {
        const days = Math.floor(hours / 24)
        const remHours = hours % 24
        return `${days}g ${remHours}h`
    }
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`
}

// Helper: get status color class based on expected_end
function getRowStatus(ticket) {
    if (!ticket.expected_end) return { bg: '', label: '', badge: '' }
    const now = new Date()
    const end = new Date(ticket.expected_end)
    const diffMs = end - now
    const twoHours = 2 * 60 * 60 * 1000

    if (diffMs < 0) {
        return { bg: 'bg-red-50 border-l-4 border-red-400', label: '⏰ SCADUTO', badge: 'bg-red-100 text-red-700' }
    } else if (diffMs < twoHours) {
        return { bg: 'bg-yellow-50 border-l-4 border-yellow-400', label: '⚠️ In scadenza', badge: 'bg-yellow-100 text-yellow-700' }
    }
    return { bg: '', label: '✅ OK', badge: 'bg-green-100 text-green-700' }
}

function renderLuggageList(tickets) {
    luggageList.innerHTML = ''
    if (tickets.length === 0) {
        luggageList.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">Nessun bagaglio trovato</td></tr>'
        return
    }

    const now = new Date()

    tickets.forEach(ticket => {
        const shortId = ticket.id.slice(0, 8).toUpperCase()
        const notes = ticket.notes || '—'
        const elapsed = formatElapsed(now - new Date(ticket.created_at))
        const status = getRowStatus(ticket)
        const endDateStr = ticket.expected_end ? new Date(ticket.expected_end).toLocaleString('it-IT') : '—'

        const row = document.createElement('tr')
        row.className = status.bg
        row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
          #${shortId}
        </span>
        ${status.label ? `<span class="ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.badge}">${status.label}</span>` : ''}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">${ticket.customer_name}</div>
        <div class="text-sm text-gray-500">${ticket.customer_email || ''}</div>
        ${ticket.customer_phone ? `<div class="text-sm text-gray-400">📞 ${ticket.customer_phone}</div>` : ''}
      </td>
      <td class="px-6 py-4">
        <div class="text-sm text-gray-900">${ticket.bag_count} bagagli — € ${ticket.price}</div>
        <div class="text-xs text-gray-500">Inizio: ${new Date(ticket.created_at).toLocaleString('it-IT')}</div>
        <div class="text-xs text-gray-500">Fine: ${endDateStr}</div>
        <div class="text-xs font-medium text-blue-600 mt-1">⌛ In deposito da: ${elapsed}</div>
      </td>
      <td class="px-6 py-4">
        <div class="text-sm text-gray-600 max-w-xs truncate" title="${notes}">${notes}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-y-1">
        <button class="text-gray-600 hover:text-gray-900 block w-full text-right" onclick="window.printLuggageLabels('${ticket.customer_name}', '${shortId}', ${ticket.bag_count}, '${new Date(ticket.created_at).toLocaleString('it-IT')}')">🖨️ Stampa</button>
        <button class="text-blue-600 hover:text-blue-900 block w-full text-right" onclick="window.editLuggage('${ticket.id}')">✏️ Modifica</button>
        <button class="text-red-600 hover:text-red-900 block w-full text-right" onclick="window.returnLuggage('${ticket.id}')">✅ Restituisci</button>
        <button class="text-gray-400 hover:text-red-600 block w-full text-right text-xs" onclick="window.deleteActiveLuggage('${ticket.id}')">🗑️ Elimina</button>
      </td>
    `
        luggageList.appendChild(row)
    })
}

// Refresh timer every 60 seconds
setInterval(() => {
    if (allLuggageTickets.length > 0) renderLuggageList(allLuggageTickets)
}, 60000)

// Add global function for button click
window.returnLuggage = async (id) => {
    if (!confirm('Confermi la restituzione dei bagagli?')) return

    // Fetch full ticket data for the email
    const { data: ticket, error: fetchErr } = await supabase
        .from('luggage_tickets')
        .select('*')
        .eq('id', id)
        .single()

    if (fetchErr || !ticket) {
        alert('Errore: ticket non trovato')
        return
    }

    const checkoutAt = new Date().toISOString()
    const { error } = await supabase
        .from('luggage_tickets')
        .update({ status: 'returned', checkout_at: checkoutAt })
        .eq('id', id)

    if (error) {
        alert('Errore aggiornamento: ' + error.message)
    } else {
        // Send return confirmation email
        if (ticket.customer_email) {
            const langChoice = prompt('Lingua email restituzione:\nit = Italiano\nen = English\nde = Deutsch\nfr = Français\nes = Español', 'it')
            const lang = ['it', 'en', 'de', 'fr', 'es'].includes(langChoice) ? langChoice : 'it'
            const shortId = ticket.id.slice(0, 8).toUpperCase()
            sendReturnEmail({
                to_email: ticket.customer_email,
                customer_name: ticket.customer_name,
                code: shortId,
                bag_count: ticket.bag_count,
                price: ticket.price,
                start_date: new Date(ticket.created_at).toLocaleString('it-IT'),
                return_date: new Date(checkoutAt).toLocaleString('it-IT'),
                lang: lang
            })
        }
        loadLuggage()
        loadReturnedLuggage()
    }
}

// --- RETURNED LUGGAGE HISTORY ---
const returnedList = document.getElementById('luggage-returned-list')
let allReturnedTickets = []
const returnedSearch = document.getElementById('returned-search')

// Search filter for returned luggage
if (returnedSearch) {
    returnedSearch.addEventListener('input', () => {
        const q = returnedSearch.value.trim().toLowerCase().replace('#', '')
        if (!q) {
            renderReturnedList(allReturnedTickets)
            return
        }
        const filtered = allReturnedTickets.filter(t =>
            t.id.slice(0, 8).toLowerCase().includes(q) ||
            t.customer_name.toLowerCase().includes(q)
        )
        renderReturnedList(filtered)
    })
}

async function loadReturnedLuggage() {
    const { data, error } = await supabase
        .from('luggage_tickets')
        .select('*')
        .eq('status', 'returned')
        .order('checkout_at', { ascending: false })

    if (error) {
        console.error('Error loading returned luggage:', error)
        return
    }

    allReturnedTickets = data || []
    renderReturnedList(allReturnedTickets)
}

function renderReturnedList(tickets) {
    if (!returnedList) return
    returnedList.innerHTML = ''
    const selectAll = document.getElementById('returned-select-all')
    const bulkBar = document.getElementById('returned-bulk-bar')
    const selectedCount = document.getElementById('returned-selected-count')
    if (selectAll) selectAll.checked = false
    if (bulkBar) bulkBar.classList.add('hidden')

    if (tickets.length === 0) {
        returnedList.innerHTML = '<tr><td colspan="8" class="px-4 py-4 text-center text-sm text-gray-500">Nessuna restituzione registrata</td></tr>'
        return
    }

    tickets.forEach(ticket => {
        const shortId = ticket.id.slice(0, 8).toUpperCase()
        const notes = ticket.notes || '—'
        const depositDate = new Date(ticket.created_at).toLocaleString('it-IT')
        const returnDate = ticket.checkout_at ? new Date(ticket.checkout_at).toLocaleString('it-IT') : '—'
        const row = document.createElement('tr')
        row.className = 'hover:bg-gray-50'
        row.innerHTML = `
      <td class="px-4 py-3">
        <input type="checkbox" class="returned-row-check rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" data-id="${ticket.id}">
      </td>
      <td class="px-4 py-3 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-600">
          #${shortId}
        </span>
      </td>
      <td class="px-4 py-3 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">${ticket.customer_name}</div>
        <div class="text-sm text-gray-500">${ticket.customer_email || '-'}</div>
      </td>
      <td class="px-4 py-3 whitespace-nowrap">
        <div class="text-sm text-gray-900">${ticket.bag_count} bagagli — € ${ticket.price}</div>
      </td>
      <td class="px-4 py-3 whitespace-nowrap">
        <div class="text-sm text-gray-600">${depositDate}</div>
      </td>
      <td class="px-4 py-3 whitespace-nowrap">
        <div class="text-sm text-green-700 font-medium">${returnDate}</div>
      </td>
      <td class="px-4 py-3">
        <div class="text-sm text-gray-600 max-w-xs truncate" title="${notes}">${notes}</div>
      </td>
      <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
        <button class="text-red-500 hover:text-red-800" onclick="window.deleteLuggage('${ticket.id}')">🗑️ Elimina</button>
      </td>
    `
        returnedList.appendChild(row)
    })

    // Update bulk bar when checkboxes change
    updateReturnedBulkBar()
    returnedList.querySelectorAll('.returned-row-check').forEach(cb => {
        cb.addEventListener('change', updateReturnedBulkBar)
    })
}

function updateReturnedBulkBar() {
    const checks = returnedList.querySelectorAll('.returned-row-check')
    const checked = returnedList.querySelectorAll('.returned-row-check:checked')
    const bulkBar = document.getElementById('returned-bulk-bar')
    const selectedCount = document.getElementById('returned-selected-count')
    const selectAll = document.getElementById('returned-select-all')

    if (checked.length > 0) {
        bulkBar?.classList.remove('hidden')
        if (selectedCount) selectedCount.textContent = checked.length
    } else {
        bulkBar?.classList.add('hidden')
    }
    if (selectAll) selectAll.checked = checks.length > 0 && checks.length === checked.length
}

// Select all toggle
document.getElementById('returned-select-all')?.addEventListener('change', (e) => {
    const checks = returnedList.querySelectorAll('.returned-row-check')
    checks.forEach(cb => cb.checked = e.target.checked)
    updateReturnedBulkBar()
})

// Bulk delete
document.getElementById('returned-bulk-delete')?.addEventListener('click', async () => {
    const checked = returnedList.querySelectorAll('.returned-row-check:checked')
    const ids = Array.from(checked).map(cb => cb.dataset.id)
    if (ids.length === 0) return

    if (!confirm(`⚠️ Eliminare definitivamente ${ids.length} record?\nQuesta azione non può essere annullata.`)) return

    let errors = 0
    for (const id of ids) {
        const { error } = await supabase
            .from('luggage_tickets')
            .delete()
            .eq('id', id)
        if (error) errors++
    }

    if (errors > 0) {
        alert(`${errors} errori durante l'eliminazione`)
    }
    loadReturnedLuggage()
})

// Soft-delete luggage ticket (move to trash)
window.deleteLuggage = async (id) => {
    if (!confirm('Spostare questo record nel cestino?')) return
    const { error } = await supabase.from('luggage_tickets').update({ status: 'deleted' }).eq('id', id)
    if (error) alert('Errore: ' + error.message)
    else { loadReturnedLuggage() }
}

// Soft-delete active luggage (move to trash)
window.deleteActiveLuggage = async (id) => {
    if (!confirm('⚠️ Spostare questo deposito nel cestino?')) return
    const { error } = await supabase.from('luggage_tickets').update({ status: 'deleted' }).eq('id', id)
    if (error) alert('Errore: ' + error.message)
    else { loadLuggage() }
}






// Handle Form Submit
if (luggageForm) {
    luggageForm.addEventListener('submit', async (e) => {
        e.preventDefault()

        const name = document.getElementById('luggage-name').value
        const email = document.getElementById('luggage-email').value
        const phone = document.getElementById('luggage-phone')?.value || ''
        const count = parseInt(document.getElementById('luggage-count').value) || 1
        const days = calcDays()
        const price = count * days * PRICE_PER_BAG_PER_DAY
        const notes = document.getElementById('luggage-notes')?.value || ''
        const startDate = document.getElementById('luggage-datetime')?.value || null
        const endDate = document.getElementById('luggage-datetime-end')?.value || null
        const paymentMethod = document.getElementById('luggage-payment-method')?.value || 'cash'

        const { data, error } = await supabase
            .from('luggage_tickets')
            .insert([
                {
                    customer_name: name,
                    customer_email: email,
                    customer_phone: phone,
                    bag_count: parseInt(count),
                    price: parseFloat(price),
                    notes: notes,
                    expected_end: endDate ? new Date(endDate).toISOString() : null,
                    status: 'stored',
                    payment_method: paymentMethod
                }
            ])
            .select()

        if (error) {
            alert('Errore salvataggio: ' + error.message)
        } else {
            const shortId = data[0].id.slice(0, 8).toUpperCase()
            const bagCount = data[0].bag_count
            const customerName = data[0].customer_name
            const customerEmail = data[0].customer_email
            const dateStr = new Date(data[0].created_at).toLocaleString('it-IT')
            const endDateStr = endDate ? new Date(endDate).toLocaleString('it-IT') : '—'
            const lang = document.getElementById('luggage-lang')?.value || 'it'

            // Send email if email provided
            if (customerEmail) {
                sendDepositEmail({
                    to_email: customerEmail,
                    customer_name: customerName,
                    code: shortId,
                    bag_count: bagCount,
                    price: price,
                    start_date: dateStr,
                    end_date: endDateStr,
                    lang: lang
                })
            }

            // Auto-create accounting transaction for luggage income at deposit time
            await supabase.from('transactions').insert([{
                type: 'income',
                category: 'Deposito Bagagli',
                amount: parseFloat(price),
                description: `Deposito #${shortId} — ${customerName} (${bagCount} bagagli)`,
                date: new Date().toISOString().slice(0, 10),
                payment_method: paymentMethod,
                status: 'active'
            }])

            luggageForm.reset()
            setDefaultDatetime()
            loadLuggage()
            const doPrint = confirm(`Deposito registrato!\nCODICE PRENOTAZIONE: #${shortId}${customerEmail ? '\n📧 Email di conferma inviata!' : ''}\n\nVuoi stampare le etichette per i bagagli?`)
            if (doPrint) {
                printLuggageLabels(customerName, shortId, bagCount, dateStr)
            }
        }
    })
}

// Initial Load
async function loadDashStats() {
    // 1. Active Luggage
    const { count: luggageCount } = await supabase
        .from('luggage_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'stored')

    const statsEl = document.getElementById('stats-luggage') // This logic seems to be for another view?
    // Note: 'stats-luggage' doesn't seem to exist in dashboard.html home view, maybe in luggage view title?
    // Let's ensure we update home counters if they exist
    const homeLuggage = document.getElementById('home-luggage')
    if (homeLuggage) homeLuggage.innerText = luggageCount || 0


    // 2. Active Reservations
    const { data: activeRes, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('status', 'confirmed')
        .order('reservation_date', { ascending: true })

    const resCountEl = document.getElementById('home-reservations-count')
    const resKpiEl = document.getElementById('home-reservations-kpi')
    const resListEl = document.getElementById('home-active-reservations-list')

    if (resCountEl) resCountEl.innerText = activeRes?.length || 0
    if (resKpiEl) resKpiEl.innerText = activeRes?.length || 0

    if (resListEl && activeRes) {
        if (activeRes.length === 0) {
            resListEl.innerHTML = '<p class="text-sm text-gray-400 text-center py-4">Nessuna prenotazione attiva</p>'
        } else {
            resListEl.innerHTML = activeRes.map(r => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                        <p class="font-medium text-gray-800 text-sm">${r.customer_name}</p>
                        <p class="text-xs text-gray-500">${new Date(r.date).toLocaleDateString()} - ${r.service_type}</p>
                    </div>
                     <span class="text-xs font-bold text-purple-600 px-2 py-1 bg-purple-100 rounded-full">#${r.id.slice(0, 4)}</span>
                </div>
            `).join('')
        }
    }
}
loadDashStats()

// --- EDIT MODAL LOGIC ---
const editModal = document.getElementById('edit-luggage-modal')
const editId = document.getElementById('edit-luggage-id')
const editName = document.getElementById('edit-luggage-name')
const editCount = document.getElementById('edit-luggage-count')
const editEnd = document.getElementById('edit-luggage-end')
const editNotes = document.getElementById('edit-luggage-notes')
const editPrice = document.getElementById('edit-luggage-price')
const editPricePreview = document.getElementById('edit-price-preview')
let editOriginalCreatedAt = null

function openEditModal(ticket) {
    editId.value = ticket.id
    editName.value = ticket.customer_name
    editCount.value = ticket.bag_count
    editNotes.value = ticket.notes || ''
    editPrice.value = ticket.price
    editOriginalCreatedAt = ticket.created_at

    // Set end date
    if (ticket.expected_end) {
        const end = new Date(ticket.expected_end)
        const offset = end.getTimezoneOffset()
        const local = new Date(end.getTime() - offset * 60000)
        editEnd.value = local.toISOString().slice(0, 16)
    } else {
        editEnd.value = ''
    }

    updateEditPricePreview()
    editModal.classList.remove('hidden')
}

const EXTRA_RATE = 1    // €1
const EXTRA_BLOCK_H = 6 // every 6 hours

function updateEditPricePreview() {
    const count = parseInt(editCount.value) || 1
    let days = 1
    if (editEnd.value && editOriginalCreatedAt) {
        const start = new Date(editOriginalCreatedAt)
        const end = new Date(editEnd.value)
        const diffMs = end - start
        if (diffMs > 0) days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    }
    const basePrice = count * days * PRICE_PER_BAG_PER_DAY

    // Check for extra hours past expected_end
    let extraCharge = 0
    let extraInfo = ''
    if (editEnd.value) {
        const now = new Date()
        const end = new Date(editEnd.value)
        const overMs = now - end
        if (overMs > 0) {
            const extraHours = Math.ceil(overMs / (1000 * 60 * 60))
            const blocks = Math.ceil(extraHours / EXTRA_BLOCK_H)
            extraCharge = blocks * EXTRA_RATE * count
            extraInfo = `\n⚠️ Ritardo: ${extraHours}h oltre scadenza ➡️ ${blocks} blocchi — €${EXTRA_RATE} — ${count} bag = +€${extraCharge.toFixed(2).replace('.', ',')}`
        }
    }

    const suggestedTotal = basePrice + extraCharge
    editPrice.value = suggestedTotal.toFixed(2)

    let previewText = `Base: ${count} bag — ${days} gg — €4 = €${basePrice.toFixed(2).replace('.', ',')}`
    if (extraCharge > 0) {
        previewText += extraInfo
        previewText += `\nTotale suggerito: €${suggestedTotal.toFixed(2).replace('.', ',')} (modificabile)`
        editPricePreview.className = 'text-sm font-medium text-red-700 bg-red-50 rounded-lg p-2 text-center whitespace-pre-line'
    } else {
        previewText += `\nTotale: €${suggestedTotal.toFixed(2).replace('.', ',')} (modificabile)`
        editPricePreview.className = 'text-sm font-medium text-green-700 bg-green-50 rounded-lg p-2 text-center whitespace-pre-line'
    }
    editPricePreview.textContent = previewText
}

if (editCount) editCount.addEventListener('input', updateEditPricePreview)
if (editEnd) editEnd.addEventListener('input', updateEditPricePreview)

// Open edit
window.editLuggage = (id) => {
    const ticket = allLuggageTickets.find(t => t.id === id)
    if (ticket) openEditModal(ticket)
}

// Cancel edit
document.getElementById('edit-luggage-cancel')?.addEventListener('click', () => {
    editModal.classList.add('hidden')
})

// Close on backdrop click
editModal?.addEventListener('click', (e) => {
    if (e.target === editModal) editModal.classList.add('hidden')
})

// Save edit — uses the manually entered price
document.getElementById('edit-luggage-save')?.addEventListener('click', async () => {
    const id = editId.value
    const count = parseInt(editCount.value) || 1
    const endVal = editEnd.value ? new Date(editEnd.value).toISOString() : null
    const finalPrice = parseFloat(editPrice.value) || 0

    const { error } = await supabase
        .from('luggage_tickets')
        .update({
            customer_name: editName.value,
            bag_count: count,
            price: finalPrice,
            expected_end: endVal,
            notes: editNotes.value
        })
        .eq('id', id)

    if (error) {
        alert('Errore aggiornamento: ' + error.message)
    } else {
        editModal.classList.add('hidden')
        loadLuggage()
    }
})

// --- PRINT LUGGAGE LABELS ---
function printLuggageLabels(customerName, code, bagCount, dateStr) {
    let labelsHtml = ''

    for (let i = 1; i <= bagCount; i++) {
        labelsHtml += `
        <div class="label">
            <div class="header">
                <div class="brand">LOCAL POINT</div>
                <div class="subtitle">Deposito Bagagli — Milazzo</div>
            </div>
            <div class="divider"></div>
            <div class="code">#${code}</div>
            <div class="details">
                <div class="detail-row">👤 ${customerName}</div>
                <div class="detail-row">🧳 Bagaglio ${i} di ${bagCount}</div>
                <div class="detail-row">📅 ${dateStr}</div>
            </div>
            <div class="divider"></div>
            <div class="footer">www.local-point.it</div>
        </div>
        `
    }

    const printWindow = window.open('', '_blank', 'width=600,height=700')
    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Etichette Bagagli — #${code}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Segoe UI', Arial, sans-serif;
                padding: 10px;
                background: #f5f5f5;
            }
            .labels-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                max-width: 21cm;
                margin: 0 auto;
            }
            .label {
                width: 9cm;
                height: 5cm;
                border: 1.5px dashed #333;
                border-radius: 8px;
                padding: 10px 14px;
                background: white;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            .header { text-align: center; margin-bottom: 4px; }
            .brand {
                font-size: 14px;
                font-weight: 800;
                color: #1a1a1a;
                letter-spacing: 1px;
                text-transform: uppercase;
            }
            .subtitle {
                font-size: 8px;
                color: #888;
                margin-top: 1px;
            }
            .divider {
                border-top: 1px solid #ddd;
                margin: 4px 0;
            }
            .code {
                text-align: center;
                font-size: 24px;
                font-weight: 900;
                font-family: 'Courier New', monospace;
                color: #1a56db;
                letter-spacing: 2px;
                margin: 4px 0;
            }
            .details { margin: 2px 0; }
            .detail-row {
                font-size: 11px;
                padding: 1px 0;
                color: #333;
            }
            .footer {
                text-align: center;
                font-size: 8px;
                color: #aaa;
            }
            @media print {
                body { padding: 0; background: white; }
                .labels-grid { gap: 5mm; }
                .label { border: 1.5px dashed #000; }
                .no-print { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align:center; margin: 10px 0;">
            <button onclick="window.print()" style="background:#1a56db; color:white; border:none; padding:10px 30px; border-radius:8px; font-size:16px; cursor:pointer; font-weight:600;">
                🖨️ Stampa Etichette
            </button>
            <p style="margin-top:8px; font-size:12px; color:#888;">${bagCount} etichett${bagCount === 1 ? 'a' : 'e'} per ${customerName}</p>
        </div>
        <div class="labels-grid">
            ${labelsHtml}
        </div>
    </body>
    </html>
    `)
    printWindow.document.close()
}

// Make it available globally for onclick
window.printLuggageLabels = printLuggageLabels

// --- EMAIL SENDING ---
const emailTranslations = {
    it: {
        subject: 'Conferma Deposito Bagagli — Local Point Milazzo',
        greeting: 'Gentile',
        intro: 'Il tuo deposito bagagli è stato registrato con successo!',
        code: 'Codice Prenotazione',
        bags: 'Numero Bagagli',
        start: 'Inizio Deposito',
        end: 'Fine Deposito Prevista',
        price: 'Totale',
        note: 'Presenta questo codice al momento del ritiro dei tuoi bagagli.',
        extra: 'Oltre la data prevista verrà applicato un supplemento di €1 ogni 6 ore per bagaglio.',
        review: 'Lascia una Recensione ⭐',
        thanks: 'Grazie per aver scelto Local Point!',
        team: 'Il Team Local Point — Milazzo'
    },
    en: {
        subject: 'Luggage Storage Confirmation — Local Point Milazzo',
        greeting: 'Dear',
        intro: 'Your luggage storage has been successfully registered!',
        code: 'Reservation Code',
        bags: 'Number of Bags',
        start: 'Storage Start',
        end: 'Expected End',
        price: 'Total',
        note: 'Please show this code when picking up your luggage.',
        extra: 'A surcharge of €1 per 6 hours per bag will apply after the expected end date.',
        review: 'Leave a Review ⭐',
        thanks: 'Thank you for choosing Local Point!',
        team: 'The Local Point Team — Milazzo'
    },
    de: {
        subject: 'Bestätigung Gepäckaufbewahrung — Local Point Milazzo',
        greeting: 'Sehr geehrte/r',
        intro: 'Ihre Gepäckaufbewahrung wurde erfolgreich registriert!',
        code: 'Reservierungscode',
        bags: 'Anzahl Gepäckst¼cke',
        start: 'Beginn der Aufbewahrung',
        end: 'Voraussichtliches Ende',
        price: 'Gesamt',
        note: 'Bitte zeigen Sie diesen Code bei der Abholung Ihres Gepäcks vor.',
        extra: 'Nach dem voraussichtlichen Enddatum wird ein Zuschlag von 1€ pro 6 Stunden pro Gepäckst¼ck erhoben.',
        review: 'Bewertung hinterlassen ⭐',
        thanks: 'Vielen Dank, dass Sie sich f¼r Local Point entschieden haben!',
        team: 'Das Local Point Team — Milazzo'
    },
    fr: {
        subject: 'Confirmation Consigne Bagages — Local Point Milazzo',
        greeting: 'Cher/Chère',
        intro: 'Votre consigne de bagages a été enregistrée avec succès !',
        code: 'Code de Réservation',
        bags: 'Nombre de Bagages',
        start: 'Début de la Consigne',
        end: 'Fin Prévue',
        price: 'Total',
        note: 'Veuillez présenter ce code lors du retrait de vos bagages.',
        extra: 'Un supplément de 1€ par tranche de 6 heures par bagage sera appliqué après la date prévue.',
        review: 'Laisser un Avis ⭐',
        thanks: 'Merci d\'avoir choisi Local Point !',
        team: 'L\'équipe Local Point — Milazzo'
    },
    es: {
        subject: 'Confirmación Consigna de Equipaje — Local Point Milazzo',
        greeting: 'Estimado/a',
        intro: '¡Tu consigna de equipaje ha sido registrada con éxito!',
        code: 'Código de Reserva',
        bags: 'Nºmero de Maletas',
        start: 'Inicio del Depósito',
        end: 'Fin Previsto',
        price: 'Total',
        note: 'Presenta este código al momento de recoger tu equipaje.',
        extra: 'Se aplicará un suplemento de 1€ por cada 6 horas por maleta después de la fecha prevista.',
        review: 'Dejar una Reseña ⭐',
        thanks: '¡Gracias por elegir Local Point!',
        team: 'El equipo Local Point — Milazzo'
    }
}

function buildEmailHtml({ customer_name, code, bag_count, price, start_date, end_date, lang }) {
    const t = emailTranslations[lang] || emailTranslations['it']
    return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f0f4f3; padding: 20px;">
        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(27,58,92,0.12);">
            <!-- Header with logo -->
            <div style="background: linear-gradient(135deg, #1B3A5C 0%, #2A9D8F 100%); padding: 28px 24px; text-align: center;">
                <img src="https://local-point.it/logo.png" alt="LocalPoint" style="max-width: 180px; height: auto; margin-bottom: 8px;">
                <p style="color: #b8e6df; margin: 0; font-size: 13px; letter-spacing: 0.5px;">Milazzo</p>
            </div>
            <!-- Body -->
            <div style="padding: 28px 24px;">
                <p style="color: #1B3A5C; font-size: 16px; margin: 0 0 6px;">${t.greeting} <strong>${customer_name}</strong>,</p>
                <p style="color: #4a5568; font-size: 14px; line-height: 1.5; margin: 0 0 20px;">${t.intro}</p>
                <!-- Reservation Code Box -->
                <div style="background: linear-gradient(135deg, #e6f7f4 0%, #edf6ff 100%); border: 2px solid #2A9D8F; border-radius: 14px; padding: 20px; text-align: center; margin: 0 0 20px;">
                    <p style="color: #2A9D8F; font-size: 11px; margin: 0 0 6px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">${t.code}</p>
                    <p style="color: #1B3A5C; font-size: 34px; font-weight: 900; font-family: 'Courier New', monospace; letter-spacing: 4px; margin: 0;">#${code}</p>
                </div>
                <!-- Details Table -->
                <table style="width: 100%; border-collapse: collapse; margin: 0 0 20px;">
                    <tr style="border-bottom: 1px solid #e8eeec;">
                        <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">🧳 ${t.bags}</td>
                        <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #1B3A5C; font-size: 15px;">${bag_count}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e8eeec;">
                        <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">📅 ${t.start}</td>
                        <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #1B3A5C; font-size: 14px;">${start_date}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e8eeec;">
                        <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">📅 ${t.end}</td>
                        <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #1B3A5C; font-size: 14px;">${end_date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; color: #6b7280; font-size: 13px;">💵 ${t.price}</td>
                        <td style="padding: 12px 0; text-align: right; font-weight: 800; color: #7BC142; font-size: 20px;">€ ${parseFloat(price).toFixed(2).replace('.', ',')}</td>
                    </tr>
                </table>
                <!-- Note -->
                <div style="background: #fef9e7; border-left: 4px solid #2A9D8F; border-radius: 0 8px 8px 0; padding: 12px 16px; margin: 0 0 16px;">
                    <p style="color: #1B3A5C; font-size: 13px; margin: 0; font-weight: 500;">ℹ️ ${t.note}</p>
                </div>
                <p style="color: #a0aec0; font-size: 11px; margin: 0; line-height: 1.4;">${t.extra}</p>
                <div style="text-align: center; margin-top: 16px;">
                    <a href="${GOOGLE_REVIEW_URL}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2A9D8F, #7BC142); color: white; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 13px; font-weight: 600;">${t.review}</a>
                </div>
            </div>
            <!-- Footer -->
            <div style="border-top: 3px solid #7BC142; background: #f7faf8; padding: 20px 24px; text-align: center;">
                <p style="color: #1B3A5C; font-size: 14px; margin: 0 0 4px; font-weight: 700;">${t.thanks}</p>
                <p style="color: #2A9D8F; font-size: 12px; margin: 0 0 8px;">${t.team}</p>
                <p style="color: #a0aec0; font-size: 11px; margin: 0;">www.local-point.it</p>
            </div>
        </div>
    </div>`
}

async function sendDepositEmail(params) {
    const t = emailTranslations[params.lang] || emailTranslations['it']
    const htmlBody = buildEmailHtml(params)

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: params.to_email,
            subject: t.subject,
            message: htmlBody
        })
        console.log('✅ Email inviata a:', params.to_email)
    } catch (err) {
        console.error('❌ Errore invio email:', err)
        alert('Deposito salvato, ma errore nell\'invio dell\'email: ' + (err?.text || err))
    }
}

// --- RETURN EMAIL ---
const returnEmailTranslations = {
    it: {
        subject: 'Conferma Restituzione Bagagli — Local Point Milazzo',
        greeting: 'Gentile',
        intro: 'I tuoi bagagli sono stati restituiti con successo!',
        code: 'Codice Prenotazione',
        bags: 'Bagagli Restituiti',
        start: 'Data Deposito',
        returned: 'Data Restituzione',
        price: 'Totale Pagato',
        note: 'Ti ringraziamo per aver utilizzato il nostro servizio di deposito bagagli.',
        review: 'Lascia una recensione ⭐ Clicca qui!',
        thanks: 'A presto!',
        team: 'Il Team Local Point — Milazzo'
    },
    en: {
        subject: 'Luggage Return Confirmation — Local Point Milazzo',
        greeting: 'Dear',
        intro: 'Your luggage has been successfully returned!',
        code: 'Reservation Code',
        bags: 'Bags Returned',
        start: 'Deposit Date',
        returned: 'Return Date',
        price: 'Total Paid',
        note: 'Thank you for using our luggage storage service.',
        review: 'Leave us a review ⭐ Click here!',
        thanks: 'See you soon!',
        team: 'The Local Point Team — Milazzo'
    },
    de: {
        subject: 'Bestätigung Gepäckr¼ckgabe — Local Point Milazzo',
        greeting: 'Sehr geehrte/r',
        intro: 'Ihr Gepäck wurde erfolgreich zurückgegeben!',
        code: 'Reservierungscode',
        bags: 'Zur¼ckgegebenes Gepäck',
        start: 'Aufbewahrungsdatum',
        returned: 'Rückgabedatum',
        price: 'Gesamtbetrag',
        note: 'Vielen Dank f¼r die Nutzung unseres Gepäckaufbewahrungsservices.',
        review: 'Bewertung hinterlassen ⭐ Hier klicken!',
        thanks: 'Bis bald!',
        team: 'Das Local Point Team — Milazzo'
    },
    fr: {
        subject: 'Confirmation Retrait Bagages — Local Point Milazzo',
        greeting: 'Cher/Chère',
        intro: 'Vos bagages ont été restitués avec succès !',
        code: 'Code de Réservation',
        bags: 'Bagages Restitués',
        start: 'Date de Dépôt',
        returned: 'Date de Retrait',
        price: 'Total Payé',
        note: 'Merci d\'avoir utilisé notre service de consigne de bagages.',
        review: 'Laissez un avis ⭐ Cliquez ici !',
        thanks: 'À bientôt !',
        team: 'L\'équipe Local Point — Milazzo'
    },
    es: {
        subject: 'Confirmación Devolución Equipaje — Local Point Milazzo',
        greeting: 'Estimado/a',
        intro: '¡Tu equipaje ha sido devuelto con éxito!',
        code: 'Código de Reserva',
        bags: 'Maletas Devueltas',
        start: 'Fecha de Depósito',
        returned: 'Fecha de Devolución',
        price: 'Total Pagado',
        note: 'Gracias por utilizar nuestro servicio de consigna de equipaje.',
        review: 'Déjanos una rese±a ⭐ ¡Haz clic aqu­!',
        thanks: '¡Hasta pronto!',
        team: 'El equipo Local Point — Milazzo'
    }
}

function buildReturnEmailHtml({ customer_name, code, bag_count, price, start_date, return_date, lang }) {
    const t = returnEmailTranslations[lang] || returnEmailTranslations['it']
    return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f0f4f3; padding: 20px;">
        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(27,58,92,0.12);">
            <!-- Header with logo -->
            <div style="background: linear-gradient(135deg, #2A9D8F 0%, #7BC142 100%); padding: 28px 24px; text-align: center;">
                <img src="https://local-point.it/logo.png" alt="LocalPoint" style="max-width: 180px; height: auto; margin-bottom: 8px;">
                <div style="background: rgba(255,255,255,0.2); border-radius: 20px; display: inline-block; padding: 6px 20px; margin-top: 8px;">
                    <span style="color: white; font-size: 16px; font-weight: 700;">✅ ${t.intro}</span>
                </div>
            </div>
            <!-- Body -->
            <div style="padding: 28px 24px;">
                <p style="color: #1B3A5C; font-size: 16px; margin: 0 0 20px;">${t.greeting} <strong>${customer_name}</strong>,</p>
                <!-- Code Box -->
                <div style="background: #f0faf7; border: 2px solid #7BC142; border-radius: 14px; padding: 20px; text-align: center; margin: 0 0 20px;">
                    <p style="color: #2A9D8F; font-size: 11px; margin: 0 0 6px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">${t.code}</p>
                    <p style="color: #1B3A5C; font-size: 34px; font-weight: 900; font-family: 'Courier New', monospace; letter-spacing: 4px; margin: 0;">#${code}</p>
                </div>
                <!-- Details -->
                <table style="width: 100%; border-collapse: collapse; margin: 0 0 20px;">
                    <tr style="border-bottom: 1px solid #e8eeec;">
                        <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">🧳 ${t.bags}</td>
                        <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #1B3A5C; font-size: 15px;">${bag_count}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e8eeec;">
                        <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">📅 ${t.start}</td>
                        <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #1B3A5C; font-size: 14px;">${start_date}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e8eeec;">
                        <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">✅ ${t.returned}</td>
                        <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #7BC142; font-size: 14px;">${return_date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; color: #6b7280; font-size: 13px;">💵 ${t.price}</td>
                        <td style="padding: 12px 0; text-align: right; font-weight: 800; color: #7BC142; font-size: 20px;">€ ${parseFloat(price).toFixed(2).replace('.', ',')}</td>
                    </tr>
                </table>
                <!-- Thank you note -->
                <div style="background: #f0faf7; border-left: 4px solid #7BC142; border-radius: 0 8px 8px 0; padding: 12px 16px; margin: 0 0 12px;">
                    <p style="color: #1B3A5C; font-size: 13px; margin: 0; font-weight: 500;">’🚕${t.note}</p>
                </div>
                <a href="${GOOGLE_REVIEW_URL}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2A9D8F, #7BC142); color: white; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-top: 4px;">⭐ ${t.review}</a>
            </div>
            <!-- Footer -->
            <div style="border-top: 3px solid #7BC142; background: #f7faf8; padding: 20px 24px; text-align: center;">
                <p style="color: #1B3A5C; font-size: 14px; margin: 0 0 4px; font-weight: 700;">${t.thanks}</p>
                <p style="color: #2A9D8F; font-size: 12px; margin: 0 0 8px;">${t.team}</p>
                <p style="color: #a0aec0; font-size: 11px; margin: 0;">www.local-point.it</p>
            </div>
        </div>
    </div>`
}

async function sendReturnEmail(params) {
    const t = returnEmailTranslations[params.lang] || returnEmailTranslations['it']
    const htmlBody = buildReturnEmailHtml(params)

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: params.to_email,
            subject: t.subject,
            message: htmlBody
        })
        console.log('✅ Email restituzione inviata a:', params.to_email)
    } catch (err) {
        console.error('❌ Errore invio email restituzione:', err)
    }
}

// ========================
// --- ACCOUNTING MODULE ---
// ========================

const TRANSACTION_CATEGORIES = {
    income: [
        'Deposito Bagagli', 'Spedizioni', 'Tour/Escursioni',
        'Servizi Digitali', 'Ricariche', 'Noleggio', 'Pagamenti/Bollettini', 'Altro'
    ],
    expense: [
        'Affitto', 'Stipendi', 'Utenze', 'Forniture', 'Tasse', 'Marketing', 'Manutenzione',
        'Rimborso Santino', 'Rimborso Giovanni', 'Altro'
    ]
}

// DOM Elements (assigned in init)
let accList, accForm, accPaymentMethodSelect, accTypeSelect, accPaidByContainer, accPaidBySelect, accCategorySelect
let accFilterType, accFilterCategory, accFilterPaymentMethod, accFilterFrom, accFilterTo, accFilterAllTimeBtn, accSearch, accDateInput, accApplyFiltersBtn
let accTrashList
let editAccModal // Global modal ref

// Mode: 'month' or 'year' (Legacy, kept for structure)
let accMode = 'month'
let allTransactions = []
let filteredTransactions = []
let mainChart = null
let catChart = null

// --- Init ---
async function initAccounting() {
    console.log('🚀 initAccounting started')

    // Select ALL Elements Safely
    accList = document.getElementById('acc-list')
    accForm = document.getElementById('acc-form')
    accPaymentMethodSelect = document.getElementById('acc-payment-method')
    accTypeSelect = document.getElementById('acc-type')
    accPaidByContainer = document.getElementById('acc-paid-by-container')
    accPaidBySelect = document.getElementById('acc-paid-by')
    accCategorySelect = document.getElementById('acc-category')

    accFilterType = document.getElementById('acc-filter-type')
    accFilterCategory = document.getElementById('acc-filter-category')
    accFilterPaymentMethod = document.getElementById('acc-filter-payment-method')
    accFilterFrom = document.getElementById('acc-filter-from')
    accFilterTo = document.getElementById('acc-filter-to')
    accFilterAllTimeBtn = document.getElementById('acc-filter-all-time')
    accSearch = document.getElementById('acc-search')
    accDateInput = document.getElementById('acc-date')
    accApplyFiltersBtn = document.getElementById('acc-apply-filters')
    accTrashList = document.getElementById('acc-trash-list')
    editAccModal = document.getElementById('edit-acc-modal')

    // Initial Date Defaults
    const now = new Date()
    const toLocalISO = (date) => {
        const offset = date.getTimezoneOffset()
        const local = new Date(date.getTime() - (offset * 60 * 1000))
        return local.toISOString().slice(0, 10)
    }

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startStr = toLocalISO(startOfMonth)
    const todayStr = toLocalISO(now)

    if (accFilterFrom && !accFilterFrom.value) accFilterFrom.value = startStr
    if (accFilterTo && !accFilterTo.value) accFilterTo.value = todayStr

    updateFormCategories()
    populateFilterCategories()

    // Reactive Listeners
    accFilterFrom?.addEventListener('change', () => { console.log('📅 Date From changed'); applyFilters() })
    accFilterTo?.addEventListener('change', () => { console.log('📅 Date To changed'); applyFilters() })
    accFilterType?.addEventListener('change', () => { console.log('🏷️ Type changed'); applyFilters() })
    accFilterCategory?.addEventListener('change', () => { console.log('🏷️ Category changed'); applyFilters() })
    accFilterPaymentMethod?.addEventListener('change', () => { console.log('💳 Method changed'); applyFilters() })
    accSearch?.addEventListener('input', () => { console.log('🔍 Search changed'); applyFilters() })

    // New Transaction Type Listener
    accTypeSelect?.addEventListener('change', () => {
        console.log('📝 New Transaction Type changed')
        updateFormCategories()
        const type = accTypeSelect.value
        if (accPaidByContainer) {
            if (type === 'expense') accPaidByContainer.classList.remove('hidden')
            else accPaidByContainer.classList.add('hidden')
        }
    })

    // All Time Button
    accFilterAllTimeBtn?.addEventListener('click', () => {
        if (!allTransactions || allTransactions.length === 0) return
        // Find min date
        const dates = allTransactions.map(t => t.date).filter(Boolean).sort()
        if (dates.length > 0) {
            accFilterFrom.value = dates[0].slice(0, 10)
            accFilterTo.value = new Date().toISOString().slice(0, 10) // Today
            applyFilters()
        }
    })

    // Load Data
    console.log('🔄 Calling loadAccounting...')
    await loadAccounting()
    console.log('✅ loadAccounting finished')

    // --- Form Submit (Create) ---
    console.log('🔗 Attaching accForm submit listener')
    accForm?.addEventListener('submit', async (e) => {
        console.log('📤 Form submit detected!')
        e.preventDefault()
        const type = accTypeSelect.value
        const amount = parseFloat(document.getElementById('acc-amount').value)
        const category = accCategorySelect.value
        const description = document.getElementById('acc-description')?.value || ''
        const date = accDateInput.value
        const payment_method = accPaymentMethodSelect?.value || 'cash'
        const paid_by = document.getElementById('acc-paid-by')?.value || 'shop'

        const { error } = await supabase.from('transactions').insert([{
            type, amount, category, description, date, paid_by, payment_method, status: 'active'
        }])

        if (error) {
            console.error('❌ Supabase Insert Error:', error)
            alert('Errore salvataggio: ' + error.message)
        } else {
            console.log('🎉 Transaction saved successfully!')
            accForm.reset()
            accDateInput.value = new Date().toISOString().slice(0, 10)
            updateFormCategories()
            loadAccounting()
        }
    })
    console.log('🚀 initAccounting fully completed')


    // CSV Export
    document.getElementById('acc-export-csv')?.addEventListener('click', () => {
        if (filteredTransactions.length === 0) {
            alert('Nessuna transazione da esportare')
            return
        }

        let csv = 'Data,Tipo,Categoria,Descrizione,Importo\n'
        filteredTransactions.forEach(tx => {
            const date = new Date(tx.date).toLocaleDateString('it-IT')
            const type = tx.type === 'income' ? 'Entrata' : 'Uscita'
            const desc = (tx.description || '').replace(/"/g, '""')
            const amount = parseFloat(tx.amount).toFixed(2).replace('.', ',')
            csv += `${date},"${type}","${tx.category}","${desc}","${tx.type === 'income' ? '+' : '-'}€${amount}"\n`
        })

        // Add totals
        const income = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
        const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
        csv += `\n,,,"Totale Entrate","€${income.toFixed(2).replace('.', ',')}"\n`
        csv += `,,,"Totale Uscite","€${expenses.toFixed(2).replace('.', ',')}"\n`
        csv += `,,,"Bilancio Netto","€${(income - expenses).toFixed(2).replace('.', ',')}"\n`

        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `LocalPoint_Contabilita_${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    })
}

// Helper to sync the Action Bar dates to the selected Month/Year
function filterByPeriod() {
    // Deprecated but kept safe
    applyFilters()
}

// --- Dynamic categories based on type ---
function updateFormCategories() {
    if (!accCategorySelect || !accTypeSelect) return
    const type = accTypeSelect.value
    const cats = type === 'income' ? TRANSACTION_CATEGORIES.income : TRANSACTION_CATEGORIES.expense
    accCategorySelect.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('')

    // Toggle Paid By visibility
    const pbContainer = document.getElementById('acc-paid-by-container')
    if (pbContainer) {
        if (type === 'expense') pbContainer.classList.remove('hidden')
        else pbContainer.classList.add('hidden')
    }
}


// --- Populate filter category dropdown ---
function populateFilterCategories() {
    if (!accFilterCategory) return
    const allCats = [...new Set([...TRANSACTION_CATEGORIES.income, ...TRANSACTION_CATEGORIES.expense])].sort()
    accFilterCategory.innerHTML = '<option value="all">Tutte le categorie</option>' +
        allCats.map(c => `<option value="${c}">${c}</option>`).join('')
}

// --- Load Transactions ---
async function loadAccounting() {
    console.log('📥 Loading transactions...')
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .neq('status', 'deleted')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error loading transactions:', error)
        alert('Errore caricamento contabilità: ' + error.message)
        return
    }

    allTransactions = data || []
    console.log(`✅ Loaded: ${allTransactions.length}`)

    // 2. Sync UI and Filter
    applyFilters()
}

// --- Apply filters ---
function applyFilters() {
    if (!allTransactions) return

    let list = [...allTransactions]

    // 1. Date Range
    const dateFrom = accFilterFrom?.value
    const dateTo = accFilterTo?.value

    if (dateFrom && dateTo) {
        list = list.filter(t => {
            if (!t.date) return false
            const tDate = t.date.slice(0, 10) // Ensure YYYY-MM-DD
            return tDate >= dateFrom && tDate <= dateTo
        })
    }

    // 2. Type filter
    const typeFilter = accFilterType?.value || 'all'
    if (typeFilter !== 'all') {
        list = list.filter(t => t.type === typeFilter)
    }

    // 3. Payment Method filter
    const payMethod = accFilterPaymentMethod?.value || 'all'
    if (payMethod !== 'all') {
        list = list.filter(t => t.payment_method === payMethod)
    }

    // 4. Category Filter
    const catFilter = accFilterCategory?.value || 'all'
    if (catFilter !== 'all') {
        list = list.filter(t => t.category === catFilter)
    }

    // 5. Search
    const q = (accSearch?.value || '').trim().toLowerCase()
    if (q) {
        list = list.filter(t =>
            (t.description || '').toLowerCase().includes(q) ||
            (t.category || '').toLowerCase().includes(q) ||
            String(t.amount || '').includes(q)
        )
    }

    filteredTransactions = list
    console.log(`🎯 Filtered Count: ${list.length}`)

    // Update EVERYTHING in sync
    renderAccountingSummary(list)
    try {
        renderCharts(list)
    } catch (e) { console.error('RenderCharts Error:', e) }

    // renderCategoryProgress(list) - check if function exists?
    if (typeof renderCategoryProgress === 'function') renderCategoryProgress(list)

    renderTransactionList()
}



// --- Render Summary Cards ---
function renderAccountingSummary(data) {
    const source = data || filteredTransactions // fallback
    const income = source.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
    const expenses = source.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
    const balance = income - expenses

    const fmt = n => `€ ${n.toFixed(2).replace('.', ',')}`
    const incEl = document.getElementById('acc-income')
    const expEl = document.getElementById('acc-expenses')
    const balEl = document.getElementById('acc-balance')

    if (incEl) incEl.textContent = fmt(income)
    if (expEl) expEl.textContent = fmt(expenses)
    if (balEl) {
        balEl.textContent = fmt(balance)
        balEl.className = `text-2xl font-bold mt-1 ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`
    }

    // Partner Stats
    const expShop = source.filter(t => t.type === 'expense' && (t.paid_by === 'shop' || !t.paid_by)).reduce((s, t) => s + parseFloat(t.amount), 0)

    // Expenses paid by Santino MINUS Reimbursements to Santino
    const expensesBySantino = source.filter(t => t.type === 'expense' && t.paid_by === 'santino').reduce((s, t) => s + parseFloat(t.amount), 0)
    const reimbursementsToSantino = source.filter(t => t.type === 'expense' && t.category === 'Rimborso Santino').reduce((s, t) => s + parseFloat(t.amount), 0)
    const netDebtSantino = expensesBySantino - reimbursementsToSantino

    // Expenses paid by Giovanni MINUS Reimbursements to Giovanni
    const expensesByGiovanni = source.filter(t => t.type === 'expense' && t.paid_by === 'giovanni').reduce((s, t) => s + parseFloat(t.amount), 0)
    const reimbursementsToGiovanni = source.filter(t => t.type === 'expense' && t.category === 'Rimborso Giovanni').reduce((s, t) => s + parseFloat(t.amount), 0)
    const netDebtGiovanni = expensesByGiovanni - reimbursementsToGiovanni

    // Real Cash = Income (Cash) - Shop Expenses (Cash)
    // We assume old transactions (null payment_method) are CASH for safety, unless we migrate them.
    // Ideally user manually sets them. For now: if (payment_method == 'cash' OR null) -> Cash

    // Helper to check if is cash
    const isCash = t => t.payment_method === 'cash' || !t.payment_method

    // Income Cash
    const incomeCash = source.filter(t => t.type === 'income' && isCash(t)).reduce((s, t) => s + parseFloat(t.amount), 0)

    // Expenses Cash (Paid by Shop)
    const expensesCashShop = source.filter(t =>
        t.type === 'expense' &&
        isCash(t) &&
        (t.paid_by === 'shop' || !t.paid_by)
    ).reduce((s, t) => s + parseFloat(t.amount), 0)

    const realCash = incomeCash - expensesCashShop

    // Digital Cash (Conto Corrente)
    // Income Card - Expenses Card (Paid by Shop)
    const isCard = t => t.payment_method === 'card' || t.payment_method === 'transfer' // Treat old transfers as card/digital

    const incomeDigital = source.filter(t => t.type === 'income' && isCard(t)).reduce((s, t) => s + parseFloat(t.amount), 0)

    // Expenses Digital (Paid by Shop)
    const expensesDigitalShop = source.filter(t =>
        t.type === 'expense' &&
        isCard(t) &&
        (t.paid_by === 'shop' || !t.paid_by)
    ).reduce((s, t) => s + parseFloat(t.amount), 0)

    const digitalCash = incomeDigital - expensesDigitalShop

    const debtSanEl = document.getElementById('debt-santino')
    const debtGioEl = document.getElementById('debt-giovanni')
    const realCashEl = document.getElementById('acc-real-cash')
    const digitalCashEl = document.getElementById('acc-digital-cash')

    if (debtSanEl) debtSanEl.textContent = fmt(netDebtSantino)
    if (debtGioEl) debtGioEl.textContent = fmt(netDebtGiovanni)
    if (realCashEl) {
        realCashEl.textContent = fmt(realCash)
        realCashEl.className = `text-2xl font-bold mt-1 ${realCash >= 0 ? 'text-green-600' : 'text-red-600'}`
    }
    if (digitalCashEl) {
        digitalCashEl.textContent = fmt(digitalCash)
        digitalCashEl.className = `text-2xl font-bold mt-1 ${digitalCash >= 0 ? 'text-indigo-600' : 'text-red-600'}`
    }
}

// --- CTS: Charts ---
function renderCharts(transactions) {
    transactions = transactions || filteredTransactions
    // 1. Main Chart (Bar: Income vs Expense per unit)
    const ctxMain = document.getElementById('acc-main-chart')?.getContext('2d')
    if (ctxMain) {
        if (mainChart) mainChart.destroy()

        let labels = []
        let dataInc = []
        let dataExp = []

        if (accFilterFrom && accFilterTo) {
            // Determine range duration
            const start = new Date(accFilterFrom.value)
            const end = new Date(accFilterTo.value)
            const diffTime = Math.abs(end - start)
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            // If > 62 days (approx 2 months), group by month
            // Else group by day
            const groupByMonth = diffDays > 62

            if (!groupByMonth) {
                // DAILY VIEW
                // Generate labels for every day in range
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dayStr = d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) // DD/MM
                    const iso = d.toISOString().slice(0, 10)
                    labels.push(dayStr)

                    // Sum
                    const inc = transactions.filter(t => t.type === 'income' && t.date === iso).reduce((s, t) => s + parseFloat(t.amount || 0), 0)
                    const exp = transactions.filter(t => t.type === 'expense' && t.date === iso).reduce((s, t) => s + parseFloat(t.amount || 0), 0)
                    dataInc.push(inc)
                    dataExp.push(exp)
                }
            } else {
                // MONTHLY VIEW
                // Iterate months
                let d = new Date(start)
                d.setDate(1) // Snap to first of month
                while (d <= end) {
                    const mStr = d.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }) // Gen 24
                    const mIso = d.toISOString().slice(0, 7) // YYYY-MM
                    labels.push(mStr)

                    const inc = transactions.filter(t => t.type === 'income' && t.date && t.date.startsWith(mIso)).reduce((s, t) => s + parseFloat(t.amount || 0), 0)
                    const exp = transactions.filter(t => t.type === 'expense' && t.date && t.date.startsWith(mIso)).reduce((s, t) => s + parseFloat(t.amount || 0), 0)
                    dataInc.push(inc)
                    dataExp.push(exp)

                    d.setMonth(d.getMonth() + 1)
                }
            }

        }

        mainChart = new Chart(ctxMain, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Entrate', data: dataInc, backgroundColor: '#10B981', borderRadius: 4 },
                    { label: 'Uscite', data: dataExp, backgroundColor: '#EF4444', borderRadius: 4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
        })
    }

    // 2. Best Sellers Doughnut Chart (Income)
    const ctxBest = document.getElementById('acc-best-seller-chart')?.getContext('2d')
    if (ctxBest) {
        if (catChart) catChart.destroy()

        const incomeTx = filteredTransactions.filter(t => t.type === 'income')
        const catMap = {}
        incomeTx.forEach(t => {
            const cat = t.category || 'Altro'
            catMap[cat] = (catMap[cat] || 0) + t.amount
        })

        // Sort by value desc
        const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1])

        const labels = sorted.map(s => s[0])
        const data = sorted.map(s => s[1])

        const colors = [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
            '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'
        ]

        catChart = new Chart(ctxBest, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { boxWidth: 12, font: { size: 11 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                const value = context.parsed;
                                const total = context.chart._metasets[context.datasetIndex].total;
                                const percentage = ((value / total) * 100).toFixed(1) + '%';

                                if (value !== null) {
                                    label += new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
                                    label += ` (${percentage})`;
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        })
    }
}

// --- Category Progress ---
function renderCategoryProgress() {
    const container = document.getElementById('acc-cat-progress')
    if (!container) return
    container.innerHTML = ''

    const expenses = filteredTransactions.filter(t => t.type === 'expense')
    const totalExp = expenses.reduce((s, t) => s + t.amount, 0) || 1 // avoid div/0
    const catMap = {}
    expenses.forEach(t => catMap[t.category] = (catMap[t.category] || 0) + t.amount)

    Object.entries(catMap).sort((a, b) => b[1] - a[1]).forEach(([cat, amt]) => {
        const pct = Math.round((amt / totalExp) * 100)
        const div = document.createElement('div')
        div.className = 'w-full'
        div.innerHTML = `
        <div class="flex justify-between text-sm mb-1">
            <span class="text-gray-700">${cat}</span>
            <span class="font-medium">€ ${amt.toFixed(2)} (${pct}%)</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-red-500 h-2 rounded-full" style="width: ${pct}%"></div>
        </div>
       `
        container.appendChild(div)
    })
}


// --- Render Transaction List ---
// --- Render Transaction List ---
function renderTransactionList() {
    console.log('🎨 Rendering list...')
    if (!accList) return console.warn('accList not found')
    accList.innerHTML = ''

    // Reset bulk UI
    const selectAll = document.getElementById('acc-select-all')
    const bulkBar = document.getElementById('acc-bulk-bar')
    if (selectAll) selectAll.checked = false
    if (bulkBar) bulkBar.classList.add('hidden')
    const countEl = document.getElementById('acc-selected-count')
    if (countEl) countEl.textContent = '0'

    if (filteredTransactions.length === 0) {
        accList.innerHTML = '<tr><td colspan="7" class="px-4 py-4 text-center text-sm text-gray-500">Nessuna transazione trovata</td></tr>'
        return
    }

    filteredTransactions.forEach(tx => {
        const isIncome = tx.type === 'income'
        const row = document.createElement('tr')
        row.className = 'hover:bg-gray-50'
        row.innerHTML = `
      <td class="px-4 py-3">
        <input type="checkbox" class="acc-row-check rounded border-gray-300 text-blue-600 cursor-pointer" data-id="${tx.id}">
      </td>
      <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">${tx.date ? new Date(tx.date).toLocaleDateString('it-IT') : '-'}</td>
      <td class="px-4 py-3 whitespace-nowrap">
        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isIncome ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
          ${isIncome ? '💵 Entrata' : '💸 Uscita'}
        </span>
        <span class="ml-1 text-xs text-gray-400" title="${tx.payment_method}">
            ${tx.payment_method === 'card' ? '💳' : '💵'}
        </span>
      </td>
      <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
        <div>${tx.category}</div>
        ${tx.paid_by && tx.paid_by !== 'shop' ? `<div class="text-xs font-bold text-orange-600">👤 ${tx.paid_by.charAt(0).toUpperCase() + tx.paid_by.slice(1)}</div>` : ''}
      </td>
      <td class="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title="${tx.description || ''}">${tx.description || '—'}</td>
      <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}">
        ${isIncome ? '+' : '-'} € ${parseFloat(tx.amount).toFixed(2).replace('.', ',')}
      </td>
      <td class="px-4 py-3 whitespace-nowrap text-right text-sm flex gap-2 justify-end">
        <button type="button" class="acc-btn-edit text-blue-500 hover:text-blue-800" onclick="window.editTransaction('${tx.id}')">✏️</button>
        <button type="button" class="acc-btn-delete text-red-500 hover:text-red-800" onclick="window.deleteTransaction('${tx.id}')">🗑️</button>
      </td>
    `
        accList.appendChild(row)
    })

    // Bind checkboxes for bulk actions
    accList.querySelectorAll('.acc-row-check').forEach(cb => {
        cb.addEventListener('change', updateAccBulkBar)
    })
}

// --- Bulk bar ---
function updateAccBulkBar() {
    const checks = accList.querySelectorAll('.acc-row-check')
    const checked = accList.querySelectorAll('.acc-row-check:checked')
    const bulkBar = document.getElementById('acc-bulk-bar')
    const countEl = document.getElementById('acc-selected-count')
    const selectAll = document.getElementById('acc-select-all')

    if (checked.length > 0) {
        bulkBar?.classList.remove('hidden')
        if (countEl) countEl.textContent = checked.length
    } else {
        bulkBar?.classList.add('hidden')
    }
    if (selectAll) selectAll.checked = checks.length > 0 && checks.length === checked.length
}

document.getElementById('acc-select-all')?.addEventListener('change', (e) => {
    accList.querySelectorAll('.acc-row-check').forEach(cb => cb.checked = e.target.checked)
    updateAccBulkBar()
})

document.getElementById('acc-bulk-delete')?.addEventListener('click', async () => {
    const checked = accList.querySelectorAll('.acc-row-check:checked')
    const ids = Array.from(checked).map(cb => cb.dataset.id)
    if (ids.length === 0) return
    if (!confirm(`⚠️ Spostare nel cestino ${ids.length} transazioni?`)) return

    let errors = 0
    for (const id of ids) {
        const { error } = await supabase.from('transactions').update({ status: 'deleted' }).eq('id', id)
        if (error) errors++
    }
    if (errors > 0) alert(`${errors} errori durante l'eliminazione`)
    loadAccounting()
})

// --- Single delete (Soft) ---
window.deleteTransaction = async (id) => {
    // Soft delete
    if (!confirm('Spostare questa transazione nel cestino?')) return
    const { error } = await supabase.from('transactions').update({ status: 'deleted' }).eq('id', id)
    if (error) {
        alert('Errore: ' + error.message)
    } else {
        loadAccounting()
    }
}

// --- ACCOUNTING TRASH ---







// --- EDIT TRANSACTION ---
// Assigned to window to work with inline onclick
window.editTransaction = (id) => {
    // Re-select modal just in case if global is not set
    if (!editAccModal) editAccModal = document.getElementById('edit-acc-modal')

    console.log('✏️ window.editTransaction called with ID:', id)
    // ... search logic ...
    const tx = allTransactions.find(t => t.id == id)
    if (!tx) {
        console.error('❌ Transaction not found with ID:', id)
        return
    }

    if (!editAccModal) {
        console.error('❌ Modal element #edit-acc-modal not found!')
        return
    }

    document.getElementById('edit-acc-id').value = tx.id
    document.getElementById('edit-acc-type').value = tx.type
    document.getElementById('edit-acc-amount').value = tx.amount
    document.getElementById('edit-acc-desc').value = tx.description || ''
    document.getElementById('edit-acc-date').value = tx.date

    // Paid By
    const paidByContainer = document.getElementById('edit-acc-paid-by-container')
    const paidBySelect = document.getElementById('edit-acc-paid-by')
    if (paidByContainer) {
        if (tx.type === 'expense') paidByContainer.classList.remove('hidden')
        else paidByContainer.classList.add('hidden')
    }
    if (paidBySelect) paidBySelect.value = tx.paid_by || 'shop'

    // Payment Method
    const pmSelect = document.getElementById('edit-acc-payment-method')
    if (pmSelect) pmSelect.value = tx.payment_method || 'cash'

    // Categories
    const cats = tx.type === 'income' ? TRANSACTION_CATEGORIES.income : TRANSACTION_CATEGORIES.expense
    const catSel = document.getElementById('edit-acc-category')
    catSel.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('')
    catSel.value = tx.category

    editAccModal.classList.remove('hidden')
}

// Bind Type change in edit modal
document.getElementById('edit-acc-type')?.addEventListener('change', (e) => {
    // ... same logic ...
    const type = e.target.value
    const cats = type === 'income' ? TRANSACTION_CATEGORIES.income : TRANSACTION_CATEGORIES.expense
    const catSel = document.getElementById('edit-acc-category')
    catSel.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('')

    const startPaidBy = document.getElementById('edit-acc-paid-by-container')
    if (startPaidBy) {
        if (type === 'expense') startPaidBy.classList.remove('hidden')
        else startPaidBy.classList.add('hidden')
    }
})

// Bind Type change in New Form
accTypeSelect?.addEventListener('change', (e) => {
    updateFormCategories()
    const type = e.target.value
    if (accPaidByContainer) {
        if (type === 'expense') accPaidByContainer.classList.remove('hidden')
        else accPaidByContainer.classList.add('hidden')
    }
})

document.getElementById('edit-acc-cancel')?.addEventListener('click', () => {
    if (editAccModal) editAccModal.classList.add('hidden')
})
document.getElementById('edit-acc-save')?.addEventListener('click', async () => {
    const id = document.getElementById('edit-acc-id').value
    const type = document.getElementById('edit-acc-type').value
    const amount = parseFloat(document.getElementById('edit-acc-amount').value)
    const category = document.getElementById('edit-acc-category').value
    const description = document.getElementById('edit-acc-desc').value
    const date = document.getElementById('edit-acc-date').value
    const payment_method = document.getElementById('edit-acc-payment-method').value
    const paid_by = document.getElementById('edit-acc-paid-by').value

    const { error } = await supabase.from('transactions').update({
        type, amount, category, description, date, paid_by, payment_method
    }).eq('id', id)

    if (error) {
        alert('Errore aggiornamento: ' + error.message)
    } else {
        if (editAccModal) editAccModal.classList.add('hidden')
        loadAccounting()
    }
})


// ============================
// --- RESERVATIONS MODULE ---
// ============================

const serviceTypes = [
    { value: 'noleggio_barca', label: '🚤 Noleggio Barca' },
    { value: 'noleggio_bici', label: '🚲 Noleggio Bici' },
    { value: 'noleggio_auto', label: '🚗 Noleggio Auto' },
    { value: 'noleggio_scooter', label: '🛵 Noleggio Scooter' },
    { value: 'escursione_vulcano', label: '🌋 Escursione Vulcano' },
    { value: 'tour_isole', label: '🏝️ Tour Isole' },
    { value: 'transfer', label: '🚕 Transfer' }
]

const statusMap = {
    confirmed: { label: '✅ Confermata', bg: 'bg-green-100 text-green-800' },
    pending: { label: '⏳ In attesa', bg: 'bg-yellow-100 text-yellow-800' },
    completed: { label: '✅ Completata', bg: 'bg-blue-100 text-blue-800' },
    cancelled: { label: '❌ Annullata', bg: 'bg-red-100 text-red-800' }
}

const resList = document.getElementById('res-list')
const resForm = document.getElementById('res-form')
const resFilterFrom = document.getElementById('res-filter-from')
const resFilterTo = document.getElementById('res-filter-to')
const resFilterType = document.getElementById('res-filter-type')
const resFilterStatus = document.getElementById('res-filter-status')
const resSearchInput = document.getElementById('res-search')

let allReservations = []
let filteredReservations = []

// --- Init service type dropdowns ---
function initReservations() {
    const formSelect = document.getElementById('res-service-type')
    const filterSelect = document.getElementById('res-filter-type')
    if (formSelect) {
        formSelect.innerHTML = serviceTypes.map(s => `<option value="${s.value}">${s.label}</option>`).join('')
    }
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="all">Tutti i servizi</option>' +
            serviceTypes.map(s => `<option value="${s.value}">${s.label}</option>`).join('')
    }
    // Default date filters: this month
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    if (resFilterFrom) resFilterFrom.value = firstDay.toISOString().slice(0, 10)
    if (resFilterTo) resFilterTo.value = lastDay.toISOString().slice(0, 10)
}
initReservations()

// --- Load reservations ---
async function loadReservations() {
    const from = resFilterFrom?.value
    const to = resFilterTo?.value

    let query = supabase.from('reservations').select('*').neq('status', 'deleted').order('reservation_date', { ascending: false })

    if (from) query = query.gte('reservation_date', from)
    if (to) query = query.lte('reservation_date', to + 'T23:59:59')

    const { data, error } = await query
    if (error) {
        console.error('Error loading reservations:', error)
        return
    }

    allReservations = data || []
    applyResFilters()
}

// --- Apply filters ---
function applyResFilters() {
    let list = [...allReservations]

    const typeF = resFilterType?.value || 'all'
    if (typeF !== 'all') list = list.filter(r => r.service_type === typeF)

    const statusF = resFilterStatus?.value || 'all'
    if (statusF !== 'all') list = list.filter(r => r.status === statusF)

    const q = (resSearchInput?.value || '').trim().toLowerCase()
    if (q) {
        list = list.filter(r =>
            r.customer_name.toLowerCase().includes(q) ||
            (r.customer_phone || '').toLowerCase().includes(q) ||
            (r.customer_email || '').toLowerCase().includes(q) ||
            (r.supplier_name || '').toLowerCase().includes(q) ||
            (r.notes || '').toLowerCase().includes(q) ||
            (r.id || '').slice(0, 8).toLowerCase().includes(q.replace('#', ''))
        )
    }

    filteredReservations = list
    const countEl = document.getElementById('res-results-count')
    if (countEl) countEl.textContent = `${list.length} di ${allReservations.length} prenotazioni`
    renderResSummary()
    renderResList()
}

// Bind filters
resFilterFrom?.addEventListener('change', loadReservations)
resFilterTo?.addEventListener('change', loadReservations)
resFilterType?.addEventListener('change', applyResFilters)
resFilterStatus?.addEventListener('change', applyResFilters)
resSearchInput?.addEventListener('input', applyResFilters)

// --- Summary cards ---
function renderResSummary() {
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date()
    const weekEnd = new Date(now)
    weekEnd.setDate(now.getDate() + (7 - now.getDay()))
    const weekEndStr = weekEnd.toISOString().slice(0, 10)

    const active = allReservations.filter(r => r.status !== 'cancelled')
    const todayCount = active.filter(r => r.reservation_date?.slice(0, 10) === today).length
    const weekCount = active.filter(r => {
        const d = r.reservation_date?.slice(0, 10) || ''
        return d >= today && d <= weekEndStr
    }).length
    const pendingCount = allReservations.filter(r => r.status === 'pending').length
    const revenue = active.reduce((s, r) => s + parseFloat(r.total_price || 0), 0)

    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val }
    el('res-today', todayCount)
    el('res-week', weekCount)
    el('res-pending', pendingCount)
    el('res-revenue', `€ ${revenue.toFixed(2).replace('.', ',')}`)
}

// --- Render table ---
function renderResList() {
    if (!resList) return
    resList.innerHTML = ''
    const selectAll = document.getElementById('res-select-all')
    const bulkBar = document.getElementById('res-bulk-bar')
    if (selectAll) selectAll.checked = false
    if (bulkBar) bulkBar.classList.add('hidden')

    if (filteredReservations.length === 0) {
        resList.innerHTML = '<tr><td colspan="10" class="px-4 py-4 text-center text-sm text-gray-500">Nessuna prenotazione trovata</td></tr>'
        return
    }

    filteredReservations.forEach(res => {
        const sType = serviceTypes.find(s => s.value === res.service_type)
        const sLabel = sType ? sType.label : res.service_type
        const st = statusMap[res.status] || statusMap.pending
        const startDate = res.reservation_date ? new Date(res.reservation_date).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'
        const endDate = res.end_date ? new Date(res.end_date).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''
        const deposit = parseFloat(res.deposit || 0)
        const total = parseFloat(res.total_price || 0)
        const remaining = total - deposit
        const bookingCode = res.id.slice(0, 8).toUpperCase()

        const row = document.createElement('tr')
        row.className = 'hover:bg-gray-50'
        row.innerHTML = `
      <td class="px-3 py-3">
        <input type="checkbox" class="res-row-check rounded border-gray-300 text-blue-600 cursor-pointer" data-id="${res.id}">
      </td>
      <td class="px-3 py-3 whitespace-nowrap">
        <span class="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">#${bookingCode}</span>
      </td>
      <td class="px-3 py-3 whitespace-nowrap text-sm font-medium">${sLabel}</td>
      <td class="px-3 py-3">
        <div class="text-sm font-medium text-gray-900">${res.customer_name}</div>
        ${res.customer_phone ? `<div class="text-xs text-gray-400">📞 ${res.customer_phone}</div>` : ''}
        ${res.customer_email ? `<div class="text-xs text-gray-400">📧 ${res.customer_email}</div>` : ''}
        ${res.notes ? `<div class="text-xs text-gray-400 truncate max-w-[150px]" title="${res.notes}">📝 ${res.notes}</div>` : ''}
      </td>
      <td class="px-3 py-3 whitespace-nowrap">
        <div class="text-sm text-gray-700">${startDate}</div>
        ${endDate ? `<div class="text-xs text-gray-400">➡️ ${endDate}</div>` : ''}
      </td>
      <td class="px-3 py-3 text-sm text-center">${res.people_count}</td>
      <td class="px-3 py-3 whitespace-nowrap">
        <div class="text-sm font-bold text-gray-900">€ ${total.toFixed(2)}</div>
        ${deposit > 0 ? `<div class="text-xs text-green-600">Acconto: € ${deposit.toFixed(2)}</div><div class="text-xs text-orange-600">Saldo: € ${remaining.toFixed(2)}</div>` : ''}
      </td>
      <td class="px-3 py-3 text-sm text-gray-600">${res.supplier_name || '—'}</td>
      <td class="px-3 py-3 whitespace-nowrap">
        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${st.bg}">${st.label}</span>
      </td>
      <td class="px-3 py-3 whitespace-nowrap text-right text-sm space-y-1">
        ${res.status === 'confirmed' || res.status === 'pending' ? `<button class="text-green-600 hover:text-green-800 block w-full text-right" onclick="window.completeReservation('${res.id}')">✅ Completa</button>` : ''}
        ${res.status !== 'cancelled' && res.status !== 'completed' ? `<button class="text-yellow-600 hover:text-yellow-800 block w-full text-right" onclick="window.cancelReservation('${res.id}')">❌ Annulla</button>` : ''}
        <button class="text-red-400 hover:text-red-700 block w-full text-right text-xs" onclick="window.deleteReservation('${res.id}')">🗑️ Elimina</button>
      </td>
    `
        resList.appendChild(row)
    })

    updateResBulkBar()
    resList.querySelectorAll('.res-row-check').forEach(cb => {
        cb.addEventListener('change', updateResBulkBar)
    })
}

// --- Bulk bar ---
function updateResBulkBar() {
    const checks = resList.querySelectorAll('.res-row-check')
    const checked = resList.querySelectorAll('.res-row-check:checked')
    const bulkBar = document.getElementById('res-bulk-bar')
    const countEl = document.getElementById('res-selected-count')
    const selectAll = document.getElementById('res-select-all')

    if (checked.length > 0) {
        bulkBar?.classList.remove('hidden')
        if (countEl) countEl.textContent = checked.length
    } else {
        bulkBar?.classList.add('hidden')
    }
    if (selectAll) selectAll.checked = checks.length > 0 && checks.length === checked.length
}

document.getElementById('res-select-all')?.addEventListener('change', (e) => {
    resList.querySelectorAll('.res-row-check').forEach(cb => cb.checked = e.target.checked)
    updateResBulkBar()
})

document.getElementById('res-bulk-delete')?.addEventListener('click', async () => {
    const checked = resList.querySelectorAll('.res-row-check:checked')
    const ids = Array.from(checked).map(cb => cb.dataset.id)
    if (ids.length === 0) return
    if (!confirm(`⚠️ Spostare ${ids.length} prenotazioni nel cestino?`)) return

    let errors = 0
    for (const id of ids) {
        const { error } = await supabase.from('reservations').update({ status: 'deleted' }).eq('id', id)
        if (error) errors++
    }
    if (errors > 0) alert(`${errors} errori durante l'eliminazione`)
    loadReservations()

})

// --- Single soft-delete ---
window.deleteReservation = async (id) => {
    if (!confirm('Spostare questa prenotazione nel cestino?')) return
    const { error } = await supabase.from('reservations').update({ status: 'deleted' }).eq('id', id)
    if (error) alert('Errore: ' + error.message)
    else { loadReservations() }
}

// --- Cancel reservation ---
window.cancelReservation = async (id) => {
    if (!confirm('Annullare questa prenotazione?')) return
    const { error } = await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', id)
    if (error) alert('Errore: ' + error.message)
    else loadReservations()
}

// --- RESERVATION TRASH ---
const resTrashList = document.getElementById('res-trash-list')





// --- Complete reservation (+ auto accounting) ---
window.completeReservation = async (id) => {
    if (!confirm('Segnare come completata? Verrà creata una transazione in contabilità per il SALDO RIMANENTE.')) return

    // Fetch reservation data
    const { data: res, error: fetchErr } = await supabase.from('reservations').select('*').eq('id', id).single()
    if (fetchErr || !res) {
        alert('Errore: prenotazione non trovata')
        return
    }

    const { error } = await supabase.from('reservations').update({ status: 'completed' }).eq('id', id)
    if (error) {
        alert('Errore: ' + error.message)
        return
    }

    // Auto-create accounting transaction for the BALANCE (Total - Deposit)
    const balance = res.total_price - (res.deposit || 0)

    if (balance > 0) {
        const sType = serviceTypes.find(s => s.value === res.service_type)
        const sLabel = sType ? sType.label.replace(/^[^\s]+ /, '') : res.service_type

        let category = 'Altro'
        if ((res.service_type || '').startsWith('noleggio_')) category = 'Noleggio'
        else if (['tour_isole', 'escursione_vulcano', 'escursione'].includes(res.service_type)) category = 'Tour/Escursioni'
        else if (res.service_type === 'deposito_bagagli') category = 'Deposito Bagagli'
        else if (res.service_type === 'spedizioni') category = 'Spedizioni'
        else if (res.service_type === 'transfer') category = 'Noleggio' // Or Altro? Grouping transfer with Noleggio/Transport for now

        await supabase.from('transactions').insert([{
            type: 'income',
            category: category,
            amount: parseFloat(balance),
            description: `SALDO: ${sLabel} — ${res.customer_name}`,
            date: new Date().toISOString().slice(0, 10),
            payment_method: res.payment_method || 'cash',
            status: 'active'
        }])
    }

    loadReservations()
    // Reload accounting if acceptable, but we might be in res view
}

// --- Form Submit ---
resForm?.addEventListener('submit', async (e) => {
    e.preventDefault()

    const data = {
        service_type: document.getElementById('res-service-type').value,
        customer_name: document.getElementById('res-customer-name').value,
        customer_phone: document.getElementById('res-customer-phone')?.value || null,
        customer_email: document.getElementById('res-customer-email')?.value || null,
        reservation_date: document.getElementById('res-start-date').value,
        end_date: document.getElementById('res-end-date')?.value || null,
        people_count: parseInt(document.getElementById('res-people')?.value) || 1,
        deposit: parseFloat(document.getElementById('res-deposit')?.value) || 0,
        total_price: parseFloat(document.getElementById('res-total').value),
        supplier_name: document.getElementById('res-supplier')?.value || null,
        notes: document.getElementById('res-notes')?.value || null,
        status: document.getElementById('res-status')?.value || 'confirmed',
        status: document.getElementById('res-status')?.value || 'confirmed',
        payment_method: document.getElementById('res-deposit-payment-method')?.value || document.getElementById('res-payment-method')?.value || 'cash'
    }
    console.log('📦 SUBMIT RESERVATION DATA:', data)

    const { data: newRes, error } = await supabase.from('reservations').insert([data]).select()
    if (error) {
        alert('Errore salvataggio: ' + error.message)
    } else {
        // 1. Send confirmation email if email is provided
        if (data.customer_email) {
            const lang = document.getElementById('res-lang')?.value || 'it'
            const sType = serviceTypes.find(s => s.value === data.service_type)
            const sLabel = sType ? sType.label : data.service_type

            sendReservationEmail({
                booking_code: (newRes && newRes[0]) ? newRes[0].id.slice(0, 8).toUpperCase() : '???',
                to_email: data.customer_email,
                customer_name: data.customer_name,
                service_type: sLabel,
                start_date: new Date(data.reservation_date).toLocaleString('it-IT'),
                end_date: data.end_date ? new Date(data.end_date).toLocaleString('it-IT') : null,
                people_count: data.people_count,
                deposit: data.deposit,
                total_price: data.total_price,
                supplier_name: data.supplier_name,
                notes: data.notes,
                status: data.status,
                lang
            })
        }

        // 2. Create Transaction for DEPOSIT if > 0
        if (data.deposit > 0) {
            const sType = serviceTypes.find(s => s.value === data.service_type)
            const sLabel = sType ? sType.label.replace(/^[^\s]+ /, '') : data.service_type

            let category = 'Altro'
            if ((data.service_type || '').startsWith('noleggio_') || data.service_type === 'transfer') category = 'Noleggio'
            else if (['tour_isole', 'escursione_vulcano', 'escursione'].includes(data.service_type)) category = 'Tour/Escursioni'
            else if (data.service_type === 'deposito_bagagli') category = 'Deposito Bagagli'
            else if (data.service_type === 'spedizioni') category = 'Spedizioni'

            await supabase.from('transactions').insert([{
                type: 'income',
                category: category,
                amount: parseFloat(data.deposit),
                description: `ACCONTO: ${sLabel} — ${data.customer_name}`,
                date: new Date().toISOString().slice(0, 10),
                payment_method: data.payment_method,
                status: 'active'
            }])
        }

        resForm.reset()
        if (document.getElementById('res-people')) document.getElementById('res-people').value = 1
        if (document.getElementById('res-deposit')) document.getElementById('res-deposit').value = 0
        loadReservations()
        alert('Prenotazione salvata! ' + (data.deposit > 0 ? 'Transazione acconto creata.' : ''))
    }
})

// ===================================
// --- RESERVATION EMAIL TEMPLATES ---
// ===================================

const resEmailTranslations = {
    it: {
        subject: 'Conferma Prenotazione — Local Point Milazzo',
        greeting: 'Gentile',
        intro: 'La tua prenotazione è stata registrata con successo!',
        service: 'Servizio',
        date: 'Data e Ora',
        end: 'Fino a',
        people: 'Persone',
        deposit: 'Acconto Versato',
        balance: 'Saldo da Pagare',
        total: 'Totale',
        supplier: 'Organizzato da',
        notes: 'Note',
        status_confirmed: 'Prenotazione Confermata ✅',
        status_pending: 'In Attesa di Conferma ⏳',
        note: 'Presenta questa email al momento del servizio.',
        review: 'Lascia una Recensione ⭐',
        thanks: 'Grazie per aver scelto Local Point!',
        team: 'Il Team Local Point — Milazzo'
    },
    en: {
        subject: 'Booking Confirmation — Local Point Milazzo',
        greeting: 'Dear',
        intro: 'Your booking has been successfully registered!',
        service: 'Service',
        date: 'Date & Time',
        end: 'Until',
        people: 'People',
        deposit: 'Deposit Paid',
        balance: 'Balance Due',
        total: 'Total',
        supplier: 'Organized by',
        notes: 'Notes',
        status_confirmed: 'Booking Confirmed ✅',
        status_pending: 'Awaiting Confirmation ⏳',
        note: 'Please show this email at the time of service.',
        review: 'Leave a Review ⭐',
        thanks: 'Thank you for choosing Local Point!',
        team: 'The Local Point Team — Milazzo'
    },
    de: {
        subject: 'Buchungsbestätigung — Local Point Milazzo',
        greeting: 'Sehr geehrte/r',
        intro: 'Ihre Buchung wurde erfolgreich registriert!',
        service: 'Service',
        date: 'Datum & Uhrzeit',
        end: 'Bis',
        people: 'Personen',
        deposit: 'Anzahlung',
        balance: 'Restbetrag',
        total: 'Gesamt',
        supplier: 'Organisiert von',
        notes: 'Anmerkungen',
        status_confirmed: 'Buchung Bestätigt ✅',
        status_pending: 'Warten auf Bestätigung ⏳',
        note: 'Bitte zeigen Sie diese E-Mail beim Service vor.',
        review: 'Bewertung hinterlassen ⭐',
        thanks: 'Vielen Dank, dass Sie Local Point gewählt haben!',
        team: 'Das Local Point Team — Milazzo'
    },
    fr: {
        subject: 'Confirmation de Réservation — Local Point Milazzo',
        greeting: 'Cher/Chère',
        intro: 'Votre réservation a été enregistrée avec succès !',
        service: 'Service',
        date: 'Date et Heure',
        end: "Jusqu'à",
        people: 'Personnes',
        deposit: 'Acompte Versé',
        balance: 'Solde à Payer',
        total: 'Total',
        supplier: 'Organisé par',
        notes: 'Notes',
        status_confirmed: 'Réservation Confirmée ✅',
        status_pending: 'En Attente de Confirmation ⏳',
        note: 'Veuillez présenter cet email lors du service.',
        review: 'Laisser un Avis ⭐',
        thanks: 'Merci d\'avoir choisi Local Point !',
        team: 'L\'équipe Local Point — Milazzo'
    },
    es: {
        subject: 'Confirmación de Reserva — Local Point Milazzo',
        greeting: 'Estimado/a',
        intro: '¡Tu reserva ha sido registrada con éxito!',
        service: 'Servicio',
        date: 'Fecha y Hora',
        end: 'Hasta',
        people: 'Personas',
        deposit: 'Anticipo Pagado',
        balance: 'Saldo a Pagar',
        total: 'Total',
        supplier: 'Organizado por',
        notes: 'Notas',
        status_confirmed: 'Reserva Confirmada ✅',
        status_pending: 'Pendiente de Confirmación ⏳',
        note: 'Presenta este email en el momento del servicio.',
        review: 'Dejar una Reseña ⭐',
        thanks: '¡Gracias por elegir Local Point!',
        team: 'El equipo Local Point — Milazzo'
    }
}

function buildReservationEmailHtml(params) {
    const t = resEmailTranslations[params.lang] || resEmailTranslations['it']
    const deposit = parseFloat(params.deposit || 0)
    const total = parseFloat(params.total_price || 0)
    const balance = total - deposit
    const statusLabel = params.status === 'confirmed' ? t.status_confirmed : t.status_pending

    let detailRows = `
        <tr style="border-bottom: 1px solid #e8eeec;">
            <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">🔖 Codice</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #1B3A5C; font-size: 15px;">#${params.booking_code}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e8eeec;">
            <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">🛠️ ${t.service}</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #1B3A5C; font-size: 15px;">${params.service_type}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e8eeec;">
            <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">📅 ${t.date}</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #1B3A5C; font-size: 14px;">${params.start_date}</td>
        </tr>`

    if (params.end_date) {
        detailRows += `
        <tr style="border-bottom: 1px solid #e8eeec;">
            <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">📅 ${t.end}</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #1B3A5C; font-size: 14px;">${params.end_date}</td>
        </tr>`
    }

    detailRows += `
        <tr style="border-bottom: 1px solid #e8eeec;">
            <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">👥 ${t.people}</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #1B3A5C; font-size: 15px;">${params.people_count}</td>
        </tr>`

    if (deposit > 0) {
        detailRows += `
        <tr style="border-bottom: 1px solid #e8eeec;">
            <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">💰 ${t.deposit}</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #2A9D8F; font-size: 14px;">€ ${deposit.toFixed(2).replace('.', ',')}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e8eeec;">
            <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">✨ ${t.balance}</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #e67e22; font-size: 15px;">€ ${balance.toFixed(2).replace('.', ',')}</td>
        </tr>`
    }

    detailRows += `
        <tr>
            <td style="padding: 12px 0; color: #6b7280; font-size: 13px;">💵 ${t.total}</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 800; color: #7BC142; font-size: 20px;">€ ${total.toFixed(2).replace('.', ',')}</td>
        </tr>`

    let extraInfo = ''
    if (params.supplier_name) {
        extraInfo += `<p style="color: #4a5568; font-size: 13px; margin: 0 0 6px;">🤝 <strong>${t.supplier}:</strong> ${params.supplier_name}</p>`
    }
    if (params.notes) {
        extraInfo += `<p style="color: #4a5568; font-size: 13px; margin: 0 0 6px;">📝 <strong>${t.notes}:</strong> ${params.notes}</p>`
    }

    return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f0f4f3; padding: 20px;">
        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(27,58,92,0.12);">
            <!-- Header with logo -->
            <div style="background: linear-gradient(135deg, #1B3A5C 0%, #2A9D8F 100%); padding: 28px 24px; text-align: center;">
                <img src="https://local-point.it/logo.png" alt="LocalPoint" style="max-width: 180px; height: auto; margin-bottom: 8px;">
                <p style="color: #b8e6df; margin: 0; font-size: 13px; letter-spacing: 0.5px;">Milazzo</p>
            </div>
            <!-- Status Banner -->
            <div style="background: ${params.status === 'confirmed' ? '#e6f7f4' : '#fef9e7'}; padding: 12px 24px; text-align: center; border-bottom: 1px solid #e8eeec;">
                <p style="color: ${params.status === 'confirmed' ? '#2A9D8F' : '#e67e22'}; font-size: 14px; font-weight: 700; margin: 0;">${statusLabel}</p>
            </div>
            <!-- Body -->
            <div style="padding: 28px 24px;">
                <p style="color: #1B3A5C; font-size: 16px; margin: 0 0 6px;">${t.greeting} <strong>${params.customer_name}</strong>,</p>
                <p style="color: #4a5568; font-size: 14px; line-height: 1.5; margin: 0 0 20px;">${t.intro}</p>
                <!-- Details Table -->
                <table style="width: 100%; border-collapse: collapse; margin: 0 0 20px;">
                    ${detailRows}
                </table>
                ${extraInfo ? `<div style="margin: 0 0 16px;">${extraInfo}</div>` : ''}
                <!-- Note -->
                <div style="background: #fef9e7; border-left: 4px solid #2A9D8F; border-radius: 0 8px 8px 0; padding: 12px 16px; margin: 0 0 16px;">
                    <p style="color: #1B3A5C; font-size: 13px; margin: 0; font-weight: 500;">ℹ️ ${t.note}</p>
                </div>
                <div style="text-align: center; margin-top: 16px;">
                    <a href="${GOOGLE_REVIEW_URL}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2A9D8F, #7BC142); color: white; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 13px; font-weight: 600;">${t.review}</a>
                </div>
            </div>
            <!-- Footer -->
            <div style="border-top: 3px solid #7BC142; background: #f7faf8; padding: 20px 24px; text-align: center;">
                <p style="color: #1B3A5C; font-size: 14px; margin: 0 0 4px; font-weight: 700;">${t.thanks}</p>
                <p style="color: #2A9D8F; font-size: 12px; margin: 0 0 8px;">${t.team}</p>
                <p style="color: #a0aec0; font-size: 11px; margin: 0;">www.local-point.it</p>
            </div>
        </div>
    </div>`
}

async function sendReservationEmail(params) {
    const t = resEmailTranslations[params.lang] || resEmailTranslations['it']
    const htmlBody = buildReservationEmailHtml(params)

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: params.to_email,
            subject: t.subject,
            message: htmlBody
        })
        console.log('✅ Email prenotazione inviata a:', params.to_email)
    } catch (err) {
        console.error('❌ Errore invio email prenotazione:', err)
        alert('Prenotazione salvata, ma errore nell\'invio dell\'email: ' + (err?.text || err))
    }
}

// ==============================
// --- DASHBOARD HOME MODULE ---
// ==============================

let homeChart = null

async function loadDashboardHome() {
    const now = new Date()
    // Set date display
    const dateEl = document.getElementById('home-date')
    if (dateEl) dateEl.textContent = now.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    // 1. Fetch ALL data needed (Activities + Transactions)
    const [luggageRes, reservationsRes, txRes] = await Promise.all([
        supabase.from('luggage_tickets').select('*').eq('status', 'stored').order('created_at', { ascending: false }),
        supabase.from('reservations').select('*').in('status', ['confirmed', 'pending']).order('reservation_date', { ascending: true }),
        supabase.from('transactions').select('*').neq('status', 'deleted').order('date', { ascending: false })
    ])

    const activeLuggage = luggageRes.data || []
    const activeRes = reservationsRes.data || []
    const allTx = txRes.data || []

    // 2. Calculate KPIs in Memory
    const todayStr = now.toISOString().slice(0, 10)
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Filter for Today & Month
    const todayTx = allTx.filter(t => t.date.startsWith(todayStr))
    const monthTx = allTx.filter(t => {
        const d = new Date(t.date)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })

    // Calculate Totals
    const todayIncome = todayTx.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    const monthIncome = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    const monthExpenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    const netBalance = monthIncome - monthExpenses

    // Luggage pending (not yet paid/returned? Actually usually paid on deposit now. 
    // If paid on deposit, it's in transactions. If we want to show established value of stored bags, we can.)
    // Note: The new logic creates transaction on deposit. So usually it's already income.

    const totalBags = activeLuggage.reduce((s, t) => s + (parseInt(t.bag_count) || 1), 0)

    // Update DOM
    const fmt = n => `€ ${n.toFixed(2).replace('.', ',')}`
    const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val }

    setEl('home-luggage', totalBags)
    setEl('home-today-income', fmt(todayIncome))
    setEl('home-month-income', fmt(monthIncome))
    setEl('home-month-expenses', fmt(monthExpenses))
    setEl('home-reservations', activeRes.length)

    const netEl = document.getElementById('home-net')
    if (netEl) {
        netEl.textContent = fmt(netBalance)
        netEl.className = `text-2xl font-bold mt-1 ${netBalance >= 0 ? 'text-indigo-600' : 'text-red-600'}`
    }

    // --- Active Luggage List ---
    const luggageContainer = document.getElementById('home-active-luggage')
    if (luggageContainer) {
        if (activeLuggage.length === 0) {
            luggageContainer.innerHTML = '<p class="text-sm text-gray-400 text-center py-4">Nessun bagaglio in deposito</p>'
        } else {
            luggageContainer.innerHTML = activeLuggage.map(t => {
                const elapsed = Math.floor((now - new Date(t.created_at)) / 3600000)
                const hrs = elapsed % 24
                const days = Math.floor(elapsed / 24)
                const timeStr = days > 0 ? `${days}g ${hrs}h` : `${hrs}h`
                return `<div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div>
                        <p class="text-sm font-semibold text-gray-800">${t.customer_name}</p>
                        <p class="text-xs text-gray-500">${t.bag_count} bagagli — € ${parseFloat(t.price).toFixed(2)}</p>
                    </div>
                    <span class="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">🕒 ${timeStr}</span>
                </div>`
            }).join('')
        }
    }

    // --- Today's Reservations ---
    const todayResList = activeRes.filter(r => (r.reservation_date || '').slice(0, 10) === todayStr)
    const resTodayContainer = document.getElementById('home-today-reservations')
    if (resTodayContainer) {
        if (todayResList.length === 0) {
            resTodayContainer.innerHTML = '<p class="text-sm text-gray-400 text-center py-4">Nessuna prenotazione oggi</p>'
        } else {
            resTodayContainer.innerHTML = todayResList.map(r => {
                // Use global serviceTypes if available, else simple check
                const sType = (typeof serviceTypes !== 'undefined' ? serviceTypes : []).find(s => s.value === r.service_type)
                const sLabel = sType ? sType.label : r.service_type
                const time = new Date(r.reservation_date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
                const st = statusMap[r.status] || statusMap.pending
                return `<div class="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <div>
                        <p class="text-sm font-semibold text-gray-800">${sLabel}</p>
                        <p class="text-xs text-gray-500">${r.customer_name} — ${r.people_count} pers.</p>
                    </div>
                    <div class="text-right">
                        <span class="text-xs font-bold text-purple-600">• ${time}</span>
                        <span class="block text-xs px-2 py-0.5 rounded-full mt-1 ${st.bg}">${st.label}</span>
                    </div>
                </div>`
            }).join('')
        }
    }

    // --- Today Activity Summary ---
    const todayContainer = document.getElementById('home-today-list')
    if (todayContainer) {
        const items = []
        if (activeLuggage.length > 0) items.push(`🧳 ${totalBags} bagagli in deposito`)
        if (todayResList.length > 0) items.push(`📅 ${todayResList.length} prenotazioni oggi`)
        if (todayIncome > 0) items.push(`💵 ${fmt(todayIncome)} incassati oggi`)
        const pendingRes = activeRes.filter(r => r.status === 'pending')
        if (pendingRes.length > 0) items.push(`⏳ ${pendingRes.length} prenotazioni in attesa`)

        // Shipping items (optional, could add if desired)
        // const todayShips = (allShipments || []).filter(s => s.created_at.startsWith(new Date().toISOString().slice(0,10)))
        // if (todayShips.length > 0) items.push(`📦 ${todayShips.length} spedizioni oggi`)

        if (items.length === 0) {
            todayContainer.innerHTML = '<p class="text-sm text-gray-400 text-center py-4">Nessuna attività oggi</p>'
        } else {
            todayContainer.innerHTML = items.map(i =>
                `<div class="p-2 bg-gray-50 rounded-lg text-sm text-gray-700">${i}</div>`
            ).join('')
        }
    }

    // --- Render Chart ---
    renderHomeChart(allTx)
}

// Chart rendering using in-memory data
function renderHomeChart(allTransactions) {
    const canvas = document.getElementById('home-chart')
    if (!canvas) return
    const now = new Date()

    // Get last 6 months data
    const months = []
    const incomeData = []
    const expenseData = []
    const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

    for (let i = 5; i >= 0; i--) {
        // Calculate target month/year
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const m = d.getMonth()
        const y = d.getFullYear()

        months.push(monthNames[m] + ' ' + y)

        // Filter transactions for this specific month/year
        const monthlyTx = allTransactions.filter(t => {
            const td = new Date(t.date)
            return td.getMonth() === m && td.getFullYear() === y
        })

        const inc = monthlyTx.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
        const exp = monthlyTx.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0)

        incomeData.push(inc)
        expenseData.push(exp)
    }

    if (homeChart) homeChart.destroy()

    homeChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                { label: 'Entrate', data: incomeData, borderColor: '#10B981', backgroundColor: '#10B981', tension: 0.3 },
                { label: 'Uscite', data: expenseData, borderColor: '#EF4444', backgroundColor: '#EF4444', tension: 0.3 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            scales: { y: { beginAtZero: true } }
        }
    })
}

initAccounting().catch(err => {
    console.error('Init Accounting Failed:', err)
    alert('Errore inizializzazione contabilità: ' + err.message)
})

// ========================
// --- SHIPPING MODULE ---
// ========================

async function initShipping() {
    console.log('📦 Initializing Shipping...')
    shippingList = document.getElementById('shipping-list')
    shippingForm = document.getElementById('shipping-form')

    // Search input listener
    document.getElementById('ship-search')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase()
        filterShipments(query)
    })

    // Select All listener
    document.getElementById('select-all-shipments')?.addEventListener('change', (e) => {
        const checkboxes = shippingList.querySelectorAll('input[type="checkbox"]')
        checkboxes.forEach(cb => cb.checked = e.target.checked)
        updateBulkDeleteButton()
    })

    shippingForm?.addEventListener('submit', async (e) => {
        e.preventDefault()
        const customer_name = document.getElementById('ship-name').value
        const customer_email = document.getElementById('ship-email').value
        const customer_phone = document.getElementById('ship-phone').value
        const courier = document.getElementById('ship-courier').value
        const tracking_number = document.getElementById('ship-tracking').value
        const notes = document.getElementById('ship-notes').value
        const amount = parseFloat(document.getElementById('ship-amount').value || 0)
        const payment_method = document.getElementById('ship-payment-method').value

        const { error } = await supabase.from('shipments').insert([{
            customer_name, customer_email, customer_phone, courier, tracking_number, notes,
            amount, payment_method, status: 'pending'
        }])

        if (error) {
            alert('Errore salvataggio: ' + error.message)
        } else {
            // Register accounting transaction
            await supabase.from('transactions').insert([{
                type: 'income',
                amount: amount,
                category: 'Spedizioni',
                description: tracking_number,
                date: new Date().toISOString().slice(0, 10),
                payment_method: payment_method,
                paid_by: 'shop',
                status: 'active'
            }])

            alert('Spedizione salvata e transazione registrata correttamente!')
            shippingForm.reset()
            loadShipping()
            if (typeof loadAccounting === 'function') loadAccounting()

            // Send Email
            sendShippingEmail({
                customer_name,
                customer_email,
                courier,
                tracking_number,
                notes
            })
        }
    })
}

// Global scope functions for UI events
window.updateBulkDeleteButton = function () {
    const shippingList = document.getElementById('shipping-list')
    if (!shippingList) return
    const selected = shippingList.querySelectorAll('input[type="checkbox"]:checked')
    const btn = document.getElementById('btn-bulk-delete')
    if (btn) {
        if (selected.length > 0) btn.classList.remove('hidden')
        else btn.classList.add('hidden')
    }
}

window.deleteSelectedShipments = async () => {
    const shippingList = document.getElementById('shipping-list')
    const selected = Array.from(shippingList.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value)
    if (selected.length === 0) return
    if (!confirm(`Eliminare ${selected.length} spedizioni selezionate?`)) return

    const { error } = await supabase.from('shipments').delete().in('id', selected)
    if (!error) {
        loadShipping()
        const selectAll = document.getElementById('select-all-shipments')
        if (selectAll) selectAll.checked = false
        window.updateBulkDeleteButton()
        showNotification('Spedizioni eliminate con successo')
    } else {
        alert('Errore eliminazione: ' + error.message)
    }
}

let allShipments = []

async function loadShipping() {
    const { data, error } = await supabase.from('shipments').select('*').order('created_at', { ascending: false })
    if (!error) {
        allShipments = data
        renderShippingList(data)
    }
}

function filterShipments(query) {
    const filtered = allShipments.filter(s =>
        s.customer_name?.toLowerCase().includes(query) ||
        s.customer_email?.toLowerCase().includes(query) ||
        s.tracking_number?.toLowerCase().includes(query) ||
        s.courier?.toLowerCase().includes(query) ||
        s.notes?.toLowerCase().includes(query)
    )
    renderShippingList(filtered)
}

// Functions moved to global scope above

function showNotification(msg) {
    const toast = document.createElement('div')
    toast.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-xl z-50 transform transition-all duration-300 translate-y-20'
    toast.innerHTML = `<div class="flex items-center gap-2"><div class="w-2 h-2 bg-green-500 rounded-full"></div><span>${msg}</span></div>`
    document.body.appendChild(toast)

    setTimeout(() => toast.classList.remove('translate-y-20'), 100)
    setTimeout(() => {
        toast.classList.add('translate-y-20')
        setTimeout(() => toast.remove(), 300)
    }, 3000)
}

function renderShippingList(list) {
    if (!shippingList) return
    if (!list || list.length === 0) {
        shippingList.innerHTML = '<tr><td colspan="11" class="px-4 py-4 text-center text-sm text-gray-500">Nessuna spedizione registrata</td></tr>'
        return
    }

    shippingList.innerHTML = list.map(s => {
        const date = new Date(s.created_at).toLocaleDateString('it-IT')
        return `<tr>
            <td class="px-4 py-3">
                <input type="checkbox" value="${s.id}" class="rounded text-blue-600" onchange="window.updateBulkDeleteButton()">
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 font-medium">${date}</td>
            <td class="px-4 py-3 text-sm font-medium text-gray-800">${s.customer_name}</td>
            <td class="px-4 py-3 text-sm text-gray-600">${s.customer_email || '-'}</td>
            <td class="px-4 py-3 text-sm text-gray-600">${s.customer_phone || '-'}</td>
            <td class="px-4 py-3 text-sm text-gray-600">${s.courier === 'SDA/POSTE' ? 'POSTE' : s.courier}</td>
            <td class="px-4 py-3 text-sm font-mono text-blue-600 font-bold">${s.tracking_number}</td>
            <td class="px-4 py-3 text-sm text-gray-500 italic max-w-xs truncate" title="${s.notes || ''}">${s.notes || '-'}</td>
            <td class="px-4 py-3 text-sm text-gray-800 font-medium">€${(s.amount || 0).toFixed(2)}</td>
            <td class="px-4 py-3 text-sm text-gray-600 capitalize">${s.payment_method === 'cash' ? 'Contanti' : (s.payment_method === 'card' ? 'Carta' : s.payment_method || '-')}</td>
            <td class="px-4 py-3 text-right">
                <button onclick="deleteShipment('${s.id}')" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        </tr>`
    }).join('')
    lucide.createIcons()
}

window.deleteShipment = async (id) => {
    if (!confirm('Eliminare questa spedizione?')) return
    const { error } = await supabase.from('shipments').delete().eq('id', id)
    if (!error) loadShipping()
}

async function sendShippingEmail({ customer_name, customer_email, courier, tracking_number, notes }) {
    let trackingUrl = '#'

    if (courier === 'POSTE' || courier === 'SDA/POSTE') {
        trackingUrl = `https://www.poste.it/cerca/#/risultati-spedizioni/${tracking_number}`
    } else if (courier === 'UPS') {
        trackingUrl = `https://www.ups.com/track?loc=en_US&tracknum=${tracking_number}&requester=WT/trackdetails`
    } else if (courier === 'BRT') {
        trackingUrl = `https://as777.brt.it/vas/sped_det_show.hsm?referer=sped_numspe_par.htm&Nspediz=${tracking_number}&RicercaNumeroSpedizione=Ricerca`
    }

    const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f0f4f3; padding: 20px;">
        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(27,58,92,0.12); width: 100%;">
            <!-- Header with logo -->
            <div style="background: linear-gradient(135deg, #1B3A5C 0%, #2A9D8F 100%); padding: 32px 24px; text-align: center;">
                <div style="margin-bottom: 16px; display: block;">
                    <img src="https://local-point.it/logo.png" alt="LocalPoint" style="max-width: 180px; height: auto; margin: 0 auto; display: block;">
                </div>
                <div style="background: rgba(255,255,255,0.2); border-radius: 20px; display: inline-block; padding: 8px 24px;">
                    <span style="color: white; font-size: 15px; font-weight: 700;">📦 Conferma Spedizione</span>
                </div>
            </div>

            <!-- Body -->
            <div style="padding: 28px 24px;">
                <p style="color: #1B3A5C; font-size: 16px; margin: 0 0 10px;">Gentile <strong>${customer_name}</strong>,</p>
                <p style="color: #4a5568; font-size: 14px; line-height: 1.5; margin: 0 0 20px;">Ti informiamo che la tua spedizione tramite <strong>${courier === 'SDA/POSTE' || courier === 'POSTE' ? 'POSTE' : courier}</strong> è stata presa in carico presso il nostro punto LocalPoint.</p>
                
                <!-- Notes if present -->
                ${notes ? `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 10px; margin-bottom: 24px;">
                    <p style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700; margin: 0 0 8px;">Note sulla spedizione:</p>
                    <p style="color: #1B3A5C; font-size: 14px; margin: 0; line-height: 1.4;">${notes}</p>
                </div>
                ` : ''}

                <!-- Tracking Box -->
                <div style="background: linear-gradient(135deg, #e6f7f4 0%, #edf6ff 100%); border: 2px solid #2A9D8F; border-radius: 14px; padding: 24px; text-align: center; margin: 0 0 24px;">
                    <p style="color: #2A9D8F; font-size: 11px; margin: 0 0 8px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Numero di Tracking</p>
                    <p style="color: #1B3A5C; font-size: 28px; font-weight: 900; font-family: 'Courier New', monospace; letter-spacing: 2px; margin: 0 0 20px;">${tracking_number}</p>
                    <a href="${trackingUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2A9D8F, #7BC142); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 10px rgba(42,157,143,0.3);">Traccia Spedizione</a>
                </div>

                <!-- Pickup Notice -->
                <div style="background: #fff5f5; border-left: 4px solid #f56565; padding: 12px 16px; margin: 0 0 20px;">
                    <p style="color: #c53030; font-size: 13px; margin: 0; font-weight: 600;">⚠️ Nota Importante:</p>
                    <p style="color: #4a5568; font-size: 13px; margin: 4px 0 0;">Il tracciamento si attiverà solo dopo che il corriere avrà effettuato il ritiro fisico presso la nostra sede.</p>
                </div>

                <!-- Review Section -->
                <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 24px;">
                    <p style="color: #4a5568; font-size: 14px; margin-bottom: 12px;">La tua opinione è importante!</p>
                    <a href="${GOOGLE_REVIEW_URL}" target="_blank" style="display: inline-block; background: #ffffff; color: #1B3A5C; border: 2px solid #2A9D8F; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">⭐ Lascia una recensione</a>
                </div>
            </div>

            <!-- Footer -->
            <div style="border-top: 3px solid #7BC142; background: #f7faf8; padding: 24px; text-align: center;">
                <p style="color: #1B3A5C; font-size: 14px; margin: 0 0 4px; font-weight: 700;">Grazie per aver scelto LocalPoint!</p>
                <p style="color: #2A9D8F; font-size: 12px; margin: 0 0 8px;">Il Team Local Point — Milazzo</p>
                <p style="color: #a0aec0; font-size: 11px; margin: 0;">www.local-point.it</p>
            </div>
        </div>
    </div>`

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: customer_email,
            subject: `Informazioni Tracking Spedizione - ${courier === 'SDA/POSTE' || courier === 'POSTE' ? 'POSTE' : courier}`,
            message: htmlBody
        })
        console.log('✅ Email spedizione inviata!')
        showNotification('Email inviata con successo')
    } catch (err) {
        console.error('❌ Errore invio email:', err)
        alert('Errore invio email')
    }
}

initShipping()
