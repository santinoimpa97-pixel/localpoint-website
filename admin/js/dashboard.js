import { supabase } from '../../src/supabaseClient.js'
import emailjs from '@emailjs/browser'

// --- EMAILJS CONFIG ---
const EMAILJS_SERVICE_ID = 'service_dmf1g2a'
const EMAILJS_TEMPLATE_ID = 'template_ihapitu'
const EMAILJS_PUBLIC_KEY = '0nPf665f0pWsHFx1j'
emailjs.init(EMAILJS_PUBLIC_KEY)

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

// --- NAVIGATION ---
const views = {
    dashboard: document.getElementById('view-dashboard'),
    luggage: document.getElementById('view-luggage'),
    accounting: document.getElementById('view-accounting'),
    reservations: document.getElementById('view-reservations')
}

const navBtns = {
    dashboard: document.getElementById('nav-dashboard'),
    luggage: document.getElementById('nav-luggage'),
    accounting: document.getElementById('nav-accounting'),
    reservations: document.getElementById('nav-reservations')
}

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
    document.getElementById('stats-luggage-dash').innerText = allLuggageTickets.length
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
                    status: 'stored'
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
    const { count: luggageCount } = await supabase
        .from('luggage_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'stored')

    document.getElementById('stats-luggage').innerText = luggageCount || 0
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
        'Affitto', 'Stipendi', 'Utenze', 'Forniture', 'Tasse', 'Marketing', 'Manutenzione', 'Altro'
    ]
}

const accList = document.getElementById('acc-list')
const accForm = document.getElementById('acc-form')
const accTypeSelect = document.getElementById('acc-type')
const accCategorySelect = document.getElementById('acc-category')
const accMonthSelect = document.getElementById('acc-month')
const accYearSelect = document.getElementById('acc-year')
const accFilterType = document.getElementById('acc-filter-type')
const accFilterCategory = document.getElementById('acc-filter-category')
const accSearch = document.getElementById('acc-search')
const accDateInput = document.getElementById('acc-date')
const accTrashList = document.getElementById('acc-trash-list')

// Mode: 'month' or 'year'
let accMode = 'month'
let allTransactions = []
let filteredTransactions = []
let mainChart = null
let catChart = null

// --- Init ---
// --- Init ---
function initAccounting() {
    const now = new Date()
    // Populate Year Select (Current year - 5)
    if (accYearSelect) {
        accYearSelect.innerHTML = ''
        const currentYear = now.getFullYear()
        for (let y = currentYear; y >= currentYear - 5; y--) {
            const opt = document.createElement('option')
            opt.value = y
            opt.textContent = y
            accYearSelect.appendChild(opt)
        }
        accYearSelect.value = currentYear
    }

    // Set Month
    if (accMonthSelect) accMonthSelect.value = now.getMonth()

    // Set Date Input
    if (accDateInput) accDateInput.value = now.toISOString().slice(0, 10)

    updateFormCategories()

    // Mode toggles
    document.getElementById('acc-mode-month')?.addEventListener('click', () => setAccMode('month'))
    document.getElementById('acc-mode-year')?.addEventListener('click', () => setAccMode('year'))
}
initAccounting()

function setAccMode(mode) {
    accMode = mode
    const btnMonth = document.getElementById('acc-mode-month')
    const btnYear = document.getElementById('acc-mode-year')
    const selMonth = document.getElementById('acc-month')

    if (mode === 'month') {
        btnMonth.className = 'flex-1 bg-blue-600 text-white text-sm py-1.5 rounded-md font-medium transition'
        btnYear.className = 'flex-1 bg-gray-100 text-gray-600 text-sm py-1.5 rounded-md font-medium hover:bg-gray-200 transition'
        selMonth.disabled = false
        selMonth.classList.remove('opacity-50')
    } else {
        btnMonth.className = 'flex-1 bg-gray-100 text-gray-600 text-sm py-1.5 rounded-md font-medium hover:bg-gray-200 transition'
        btnYear.className = 'flex-1 bg-blue-600 text-white text-sm py-1.5 rounded-md font-medium transition'
        selMonth.disabled = true
        selMonth.classList.add('opacity-50')
    }
    loadAccounting()
}

// --- Dynamic categories based on type ---
function updateFormCategories() {
    if (!accCategorySelect || !accTypeSelect) return
    const type = accTypeSelect.value
    const cats = type === 'income' ? TRANSACTION_CATEGORIES.income : TRANSACTION_CATEGORIES.expense
    accCategorySelect.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('')
}
accTypeSelect?.addEventListener('change', updateFormCategories)

// --- Populate filter category dropdown ---
// --- Populate filter category dropdown ---
function updateFilterCategories(subset) {
    if (!accFilterCategory) return
    const current = accFilterCategory.value
    accFilterCategory.innerHTML = '<option value="all">Tutte le categorie</option>'

    const source = subset || allTransactions
    const cats = [...new Set(source.map(t => t.category))].sort()

    cats.forEach(c => {
        const opt = document.createElement('option')
        opt.value = c
        opt.textContent = c
        accFilterCategory.appendChild(opt)
    })
    accFilterCategory.value = current || 'all'
}

// --- Load Transactions ---
// --- Load Transactions ---
async function loadAccounting() {
    // 1. Fetch EVERYTHING that is not deleted.
    // We filter by date in CLIENT-SIDE JS to avoid query syntax bugs or timezone missing data.
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .neq('status', 'deleted')
        .order('date', { ascending: false })

    if (error) {
        console.error('Error loading transactions:', error)
        alert('Errore caricamento contabilità: ' + error.message)
        return
    }

    allTransactions = data || []

    // 2. Pre-filter by Date (Month/Year)
    filterByPeriod()
}

function filterByPeriod() {
    if (!allTransactions) return

    const mode = accMode
    const selectedYear = parseInt(accYearSelect?.value) || new Date().getFullYear()
    const selectedMonth = parseInt(accMonthSelect?.value) || 0

    // Filter only by the selected period
    // We keep these in a separate list "periodTransactions" if we wanted, 
    // but here we can just update "applyFilters" to start from the period-filtered list.
    // For simplicity, let's keep "allTransactions" as the DB dump, 
    // and create a "currentPeriodTransactions" concept.

    // Let's filter in place for the view, but keep allTransactions as raw cache
    const periodData = allTransactions.filter(t => {
        const d = new Date(t.date)
        const y = d.getFullYear()
        const m = d.getMonth()

        if (mode === 'month') {
            return y === selectedYear && m === selectedMonth
        } else {
            return y === selectedYear
        }
    })

    // Now apply other filters (Search, Type, Category) on top of periodData
    applyFilters(periodData)
    updateFilterCategories(periodData)
}

// --- Apply filters ---
// --- Apply filters ---
function applyFilters(dataset) {
    // If dataset is passed, use it (it's the period-filtered data).
    // If not passed, we re-run filterByPeriod to get it.
    // But usually this function is called by UI events (change/input), so we need to know the source.
    // Let's make "dataset" optional, but we need a global "currentPeriodTransactions" or just helper.

    // BETTER APPROACH: always re-filter from allTransactions
    const mode = accMode
    const selectedYear = parseInt(accYearSelect?.value) || new Date().getFullYear()
    const selectedMonth = parseInt(accMonthSelect?.value) || 0

    let list = allTransactions.filter(t => {
        const d = new Date(t.date)
        if (mode === 'month') return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth
        return d.getFullYear() === selectedYear
    })

    // Type filter
    const typeFilter = accFilterType?.value || 'all'
    if (typeFilter !== 'all') {
        list = list.filter(t => t.type === typeFilter)
    }

    // Category filter
    const catFilter = accFilterCategory?.value || 'all'
    if (catFilter !== 'all') {
        list = list.filter(t => t.category === catFilter)
    }

    // Search
    const q = (accSearch?.value || '').trim().toLowerCase()
    if (q) {
        list = list.filter(t =>
            (t.description || '').toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q) ||
            String(t.amount).includes(q)
        )
    }

    filteredTransactions = list
    renderAccountingSummary()
    renderTransactionList()
    renderCharts()
    renderCategoryProgress()
}

// Bind filters
accMonthSelect?.addEventListener('change', loadAccounting)
accYearSelect?.addEventListener('change', loadAccounting)
accFilterType?.addEventListener('change', applyFilters)
accFilterCategory?.addEventListener('change', applyFilters)
accSearch?.addEventListener('input', applyFilters)

// --- Render Summary Cards ---
function renderAccountingSummary() {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
    const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
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
}

// --- CTS: Charts ---
function renderCharts() {
    // 1. Main Chart (Bar: Income vs Expense per unit)
    const ctxMain = document.getElementById('acc-main-chart')?.getContext('2d')
    if (ctxMain) {
        if (mainChart) mainChart.destroy()

        let labels = []
        let dataInc = []
        let dataExp = []

        if (accMode === 'month') {
            // Group by day
            const year = parseInt(accYearSelect.value)
            const month = parseInt(accMonthSelect.value)
            const daysInMonth = new Date(year, month + 1, 0).getDate()

            labels = Array.from({ length: daysInMonth }, (_, i) => i + 1)
            dataInc = new Array(daysInMonth).fill(0)
            dataExp = new Array(daysInMonth).fill(0)

            filteredTransactions.forEach(t => { // Use filteredTransactions!
                const d = new Date(t.date).getDate()
                if (d >= 1 && d <= daysInMonth) {
                    if (t.type === 'income') dataInc[d - 1] += t.amount
                    else dataExp[d - 1] += t.amount
                }
            })
        } else {
            // Group by month
            labels = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
            dataInc = new Array(12).fill(0)
            dataExp = new Array(12).fill(0)
            filteredTransactions.forEach(t => { // Use filteredTransactions!
                const m = new Date(t.date).getMonth()
                if (m >= 0 && m < 12) {
                    if (t.type === 'income') dataInc[m] += t.amount
                    else dataExp[m] += t.amount
                }
            })
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

    // 2. Category Pie Chart (Expenses)
    const ctxCat = document.getElementById('acc-cat-chart')?.getContext('2d')
    if (ctxCat) {
        if (catChart) catChart.destroy()

        const expenses = allTransactions.filter(t => t.type === 'expense')
        const catMap = {}
        expenses.forEach(t => {
            catMap[t.category] = (catMap[t.category] || 0) + t.amount
        })

        const labels = Object.keys(catMap)
        const data = Object.values(catMap)
        const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#6366F1', '#8B5CF6', '#EC4899']

        catChart = new Chart(ctxCat, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{ data: data, backgroundColor: colors, borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        })
    }
}

// --- Category Progress ---
function renderCategoryProgress() {
    const container = document.getElementById('acc-cat-progress')
    if (!container) return
    container.innerHTML = ''

    const expenses = allTransactions.filter(t => t.type === 'expense')
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
function renderTransactionList() {
    if (!accList) return
    accList.innerHTML = ''
    const selectAll = document.getElementById('acc-select-all')
    const bulkBar = document.getElementById('acc-bulk-bar')
    if (selectAll) selectAll.checked = false
    if (bulkBar) bulkBar.classList.add('hidden')

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
      <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">${new Date(tx.date).toLocaleDateString('it-IT')}</td>
      <td class="px-4 py-3 whitespace-nowrap">
        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isIncome ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
          ${isIncome ? '💵 Entrata' : '💸 Uscita'}
        </span>
      </td>
      <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">${tx.category}</td>
      <td class="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title="${tx.description || ''}">${tx.description || '—'}</td>
      <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}">
        ${isIncome ? '+' : '-'} € ${parseFloat(tx.amount).toFixed(2).replace('.', ',')}
      </td>
      <td class="px-4 py-3 whitespace-nowrap text-right text-sm flex gap-2 justify-end">
        <button class="text-blue-500 hover:text-blue-800" onclick="window.editTransaction('${tx.id}')">✏️</button>
        <button class="text-red-500 hover:text-red-800" onclick="window.deleteTransaction('${tx.id}')">🗑️</button>
      </td>
    `
        accList.appendChild(row)
    })

    // Bind checkboxes
    updateAccBulkBar()
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







// --- Form Submit (Create) ---
accForm?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const type = accTypeSelect.value
    const amount = parseFloat(document.getElementById('acc-amount').value)
    const category = accCategorySelect.value
    const description = document.getElementById('acc-description')?.value || ''
    const date = accDateInput.value

    const { error } = await supabase.from('transactions').insert([{
        type, amount, category, description, date, status: 'active'
    }])

    if (error) {
        alert('Errore salvataggio: ' + error.message)
    } else {
        accForm.reset()
        accDateInput.value = new Date().toISOString().slice(0, 10)
        updateFormCategories()
        loadAccounting()
    }
})

// --- EDIT TRANSACTION ---
const editAccModal = document.getElementById('edit-acc-modal')
window.editTransaction = (id) => {
    const tx = allTransactions.find(t => t.id === id)
    if (!tx) return

    document.getElementById('edit-acc-id').value = tx.id
    document.getElementById('edit-acc-type').value = tx.type
    document.getElementById('edit-acc-amount').value = tx.amount
    document.getElementById('edit-acc-desc').value = tx.description || ''
    document.getElementById('edit-acc-date').value = tx.date

    // Update categories based on type
    const cats = tx.type === 'income' ? incomeCategories : expenseCategories
    const catSel = document.getElementById('edit-acc-category')
    catSel.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('')
    catSel.value = tx.category

    editAccModal.classList.remove('hidden')
}

// Bind Type change in edit modal to update categories
document.getElementById('edit-acc-type')?.addEventListener('change', (e) => {
    const cats = e.target.value === 'income' ? TRANSACTION_CATEGORIES.income : TRANSACTION_CATEGORIES.expense
    const catSel = document.getElementById('edit-acc-category')
    catSel.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('')
})

document.getElementById('edit-acc-cancel')?.addEventListener('click', () => {
    editAccModal.classList.add('hidden')
})
document.getElementById('edit-acc-save')?.addEventListener('click', async () => {
    const id = document.getElementById('edit-acc-id').value
    const type = document.getElementById('edit-acc-type').value
    const amount = parseFloat(document.getElementById('edit-acc-amount').value)
    const category = document.getElementById('edit-acc-category').value
    const description = document.getElementById('edit-acc-desc').value
    const date = document.getElementById('edit-acc-date').value

    const { error } = await supabase.from('transactions').update({
        type, amount, category, description, date
    }).eq('id', id)

    if (error) {
        alert('Errore aggiornamento: ' + error.message)
    } else {
        editAccModal.classList.add('hidden')
        loadAccounting()
    }
})


// --- CSV Export ---
document.getElementById('acc-export-csv')?.addEventListener('click', () => {
    if (filteredTransactions.length === 0) {
        alert('Nessuna transazione da esportare')
        return
    }

    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
    const month = monthNames[parseInt(accMonthSelect?.value ?? 0)]
    const year = accYearSelect?.value ?? new Date().getFullYear()

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

    let filename = `LocalPoint_Contabilita_`
    if (accMode === 'month') {
        filename += `${parseInt(accMonthSelect.value) + 1}_${accYearSelect.value}`
    } else {
        filename += `ANNO_${accYearSelect.value}`
    }
    a.download = filename + '.csv'

    a.click()
    URL.revokeObjectURL(url)
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
        status: document.getElementById('res-status')?.value || 'confirmed'
    }

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

// Auto-load dashboard on init
loadDashboardHome()
