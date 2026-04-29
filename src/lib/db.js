// Supabase data layer — dual-write with localStorage cache
// Reads: always localStorage (sync). Writes: localStorage (immediate) + Supabase (background).
// syncAll() fetches all tables from Supabase and populates localStorage on app startup.

import { supabase } from './supabase'

// ── Generic helpers ──────────────────────────────────────────────────────────

async function upsert(table, data) {
  const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' })
  if (error) console.error(`[db] upsert ${table}:`, error.message)
}

async function remove(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) console.error(`[db] delete ${table}:`, error.message)
}

async function fetchAll(table) {
  const { data, error } = await supabase.from(table).select('*')
  if (error) { console.error(`[db] fetch ${table}:`, error.message); return [] }
  return data || []
}

function lsSave(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

// ── Reservations ─────────────────────────────────────────────────────────────

export async function upsertReservation(item) {
  await upsert('reservations', {
    id: item.id,
    created_at: item.created_at,
    client_name: item.client_name,
    client_email: item.client_email,
    studio: item.studio,
    date: item.date,
    start_time: item.start_time,
    end_time: item.end_time,
    service: item.service,
    status: item.status || null,
    trashed: item.trashed || false,
    modified_by: item.modified_by || null,
    modified_at: item.modified_at || null,
  })
}

export async function deleteReservation(id) { await remove('reservations', id) }

async function syncReservations() {
  const rows = await fetchAll('reservations')
  lsSave('ls_reservations', rows)
}

// ── Projects ─────────────────────────────────────────────────────────────────

export async function upsertProject(item) {
  await upsert('projects', {
    id: item.id,
    created_at: item.created_at,
    title: item.title,
    client_name: item.client_name,
    client_email: item.client_email,
    studio: item.studio,
    status: item.status,
    pipeline: item.pipeline || 'PROD',
    reservation_id: item.reservation_id || null,
    date: item.date,
    start_time: item.start_time,
    end_time: item.end_time,
    service: item.service,
    files: item.files || [],
    history: item.history || [],
  })
}

async function syncProjects() {
  const rows = await fetchAll('projects')
  lsSave('ls_projects', rows)
}

// ── Messages (SAV) ────────────────────────────────────────────────────────────

export async function upsertMessage(item) {
  const { id, created_at, read, replies, ...rest } = item
  await upsert('messages', { id, created_at, read: !!read, replies: replies || [], data: rest })
}

export async function deleteMessage(id) { await remove('messages', id) }

async function syncMessages() {
  const rows = await fetchAll('messages')
  lsSave('ls_messages', rows.map(r => ({ ...r.data, id: r.id, created_at: r.created_at, read: r.read, replies: r.replies || [] })))
}

// ── Internal Messages ─────────────────────────────────────────────────────────

export async function upsertInternalMessage(item) {
  const { id, created_at, read, ...rest } = item
  await upsert('internal_messages', { id, created_at, read: !!read, data: rest })
}

async function syncInternalMessages() {
  const rows = await fetchAll('internal_messages')
  lsSave('ls_internal_messages', rows.map(r => ({ ...r.data, id: r.id, created_at: r.created_at, read: r.read })))
}

// ── Mails ─────────────────────────────────────────────────────────────────────

export async function upsertMail(item) {
  const { id, created_at, read, trashed_by, labels, to, cc, attachments, ...rest } = item
  await upsert('mails', {
    id, created_at, read: !!read,
    to: to || [], cc: cc || [],
    attachments: attachments || [],
    labels: labels || [],
    trashed_by: trashed_by || [],
    data: rest,
  })
}

export async function deleteMail(id) { await remove('mails', id) }

async function syncMails() {
  const rows = await fetchAll('mails')
  lsSave('ls_mails', rows.map(r => ({
    ...r.data, id: r.id, created_at: r.created_at, read: r.read,
    to: r.to || [], cc: r.cc || [], attachments: r.attachments || [],
    labels: r.labels || [], trashed_by: r.trashed_by || [],
  })))
}

// ── Mail Labels ───────────────────────────────────────────────────────────────

export async function upsertMailLabel(item) {
  const { id, ...rest } = item
  await upsert('mail_labels', { id, data: rest })
}

export async function deleteMailLabel(id) { await remove('mail_labels', id) }

async function syncMailLabels() {
  const rows = await fetchAll('mail_labels')
  lsSave('ls_mail_labels', rows.map(r => ({ id: r.id, ...r.data })))
}

// ── Employees ─────────────────────────────────────────────────────────────────

export async function upsertEmployee(item) {
  await upsert('employees', {
    id: item.id,
    name: item.name,
    email: item.email,
    phone: item.phone || null,
    role_key: item.roleKey || null,
    joined_at: item.joined_at || null,
    active: item.active !== false,
    created_at: item.created_at || new Date().toISOString(),
  })
}

async function syncEmployees() {
  const rows = await fetchAll('employees')
  lsSave('ls_employees', rows.map(r => ({
    id: r.id, name: r.name, email: r.email,
    phone: r.phone, roleKey: r.role_key,
    joined_at: r.joined_at, active: r.active,
  })))
}

// ── Leave Requests ────────────────────────────────────────────────────────────

export async function upsertLeaveRequest(item) {
  const { id, created_at, status, ...rest } = item
  await upsert('leave_requests', { id, created_at, status: status || 'pending', data: rest })
}

async function syncLeaveRequests() {
  const rows = await fetchAll('leave_requests')
  lsSave('ls_leave_requests', rows.map(r => ({ ...r.data, id: r.id, created_at: r.created_at, status: r.status })))
}

// ── Hour Packs ────────────────────────────────────────────────────────────────

export async function upsertHourPack(item) {
  const { id, created_at, hours_used, ...rest } = item
  await upsert('hour_packs', { id, created_at, hours_used: hours_used || 0, data: rest })
}

async function syncHourPacks() {
  const rows = await fetchAll('hour_packs')
  lsSave('ls_hour_packs', rows.map(r => ({ ...r.data, id: r.id, created_at: r.created_at, hours_used: r.hours_used })))
}

// ── Promo Codes ───────────────────────────────────────────────────────────────

export async function upsertPromoCode(item) {
  const { id, created_at, code, active, uses, max_uses, expires_at, ...rest } = item
  await upsert('promo_codes', {
    id, created_at, code, active: active !== false,
    uses: uses || 0, max_uses: max_uses || null,
    expires_at: expires_at || null, data: rest,
  })
}

export async function deletePromoCode(id) { await remove('promo_codes', id) }

async function syncPromoCodes() {
  const rows = await fetchAll('promo_codes')
  lsSave('ls_promo_codes', rows.map(r => ({
    ...r.data, id: r.id, created_at: r.created_at,
    code: r.code, active: r.active, uses: r.uses,
    max_uses: r.max_uses, expires_at: r.expires_at,
  })))
}

// ── Popup Messages ────────────────────────────────────────────────────────────

export async function upsertPopupMessage(item) {
  const { id, created_at, ...rest } = item
  await upsert('popup_messages', { id, created_at, data: rest })
}

export async function deletePopupMessage(id) { await remove('popup_messages', id) }

async function syncPopupMessages() {
  const rows = await fetchAll('popup_messages')
  lsSave('ls_popup_messages', rows.map(r => ({ ...r.data, id: r.id, created_at: r.created_at })))
}

// ── Alerts ────────────────────────────────────────────────────────────────────

export async function upsertAlert(item) {
  const { id, created_at, status, ...rest } = item
  await upsert('alerts', { id, created_at, status: status || 'sent', data: rest })
}

export async function deleteAlert(id) { await remove('alerts', id) }

async function syncAlerts() {
  const rows = await fetchAll('alerts')
  lsSave('ls_alerts', rows.map(r => ({ ...r.data, id: r.id, created_at: r.created_at, status: r.status })))
}

// ── Check-ins ─────────────────────────────────────────────────────────────────

export async function upsertCheckIn(item) {
  const { id, created_at, ...rest } = item
  await upsert('check_ins', { id, created_at, data: rest })
}

async function syncCheckIns() {
  const rows = await fetchAll('check_ins')
  lsSave('ls_check_ins', rows.map(r => ({ ...r.data, id: r.id, created_at: r.created_at })))
}

// ── Leads ─────────────────────────────────────────────────────────────────────

export async function upsertLead(item) {
  const { id, created_at, column, history, ...rest } = item
  await upsert('leads', { id, created_at, column_name: column || 'Pool Leads', history: history || [], data: rest })
}

export async function deleteLead(id) { await remove('leads', id) }

async function syncLeads() {
  const rows = await fetchAll('leads')
  lsSave('ls_leads', rows.map(r => ({ ...r.data, id: r.id, created_at: r.created_at, column: r.column_name, history: r.history || [] })))
}

// ── Accounts ──────────────────────────────────────────────────────────────────

export async function upsertAccount(item) {
  await upsert('accounts', {
    id: item.id,
    email: item.email?.toLowerCase(),
    name: item.name,
    type: item.type,
    phone: item.phone || null,
    company: item.company || null,
    tps: item.tps || null,
    tvq: item.tvq || null,
    client_type: item.clientType || item.client_type || null,
    google_auth: item.googleAuth || item.google_auth || false,
    pending: item.pending || false,
    active: item.active !== false,
  })
}

export async function deleteAccount(id) { await remove('accounts', id) }

async function syncAccounts() {
  const rows = await fetchAll('accounts')
  const existing = (() => { try { return JSON.parse(localStorage.getItem('ls_accounts') || '[]') } catch { return [] } })()
  const merged = [...existing]
  for (const row of rows) {
    if (!merged.find(a => a.id === row.id)) {
      merged.push({
        id: row.id, email: row.email, name: row.name, type: row.type,
        phone: row.phone, company: row.company, tps: row.tps, tvq: row.tvq,
        clientType: row.client_type, googleAuth: row.google_auth,
        pending: row.pending, active: row.active, created_at: row.created_at,
      })
    }
  }
  lsSave('ls_accounts', merged)
}

// ── Login History ─────────────────────────────────────────────────────────────

export async function insertLoginHistory(accountId, entry) {
  const { error } = await supabase.from('login_history').insert({
    account_id: accountId,
    email: entry.email,
    name: entry.name,
    user_agent: entry.userAgent,
    ip: entry.ip || 'N/A',
  })
  if (error) console.error('[db] login_history insert:', error.message)
}

// ── Pricing ───────────────────────────────────────────────────────────────────

export async function upsertPrices(prices) {
  const rows = [
    ...prices.services.map(s => ({ id: s.id, label: s.label, price: s.price, type: 'service', group_name: null })),
    ...(prices.options || []).map(o => ({ id: o.id, label: o.label, price: o.price, type: 'option', group_name: o.group || null })),
  ]
  const { error } = await supabase.from('pricing').upsert(rows, { onConflict: 'id' })
  if (error) console.error('[db] pricing upsert:', error.message)
}

async function syncPrices() {
  const { data, error } = await supabase.from('pricing').select('*')
  if (error || !data?.length) return
  const services = data.filter(r => r.type === 'service').map(r => ({ id: r.id, label: r.label, price: Number(r.price) }))
  const options = data.filter(r => r.type === 'option').map(r => ({ id: r.id, label: r.label, price: Number(r.price), group: r.group_name }))
  if (services.length) localStorage.setItem('ls_custom_prices', JSON.stringify({ services, options }))
}

// ── Feature Flags ─────────────────────────────────────────────────────────────

export async function upsertFeatureFlag(key, enabled) {
  const { error } = await supabase.from('feature_flags').upsert({ key, enabled }, { onConflict: 'key' })
  if (error) console.error('[db] feature_flags upsert:', error.message)
}

async function syncFeatureFlags() {
  const { data, error } = await supabase.from('feature_flags').select('*')
  if (error || !data?.length) return
  const flags = Object.fromEntries(data.map(r => [r.key, r.enabled]))
  localStorage.setItem('ls_feature_flags', JSON.stringify(flags))
}

// ── Video Metadata ────────────────────────────────────────────────────────────

export async function upsertVideoMetadata(resId, fileName, fields) {
  const id = `${resId}__${fileName}`
  await upsert('video_metadata', {
    id,
    reservation_id: resId,
    file_name: fileName,
    status: fields.status ?? null,
    retour_count: fields.retourCount ?? 0,
    retour_phase: fields.retourPhase ?? null,
    version: fields.version ?? null,
    allow_download: fields.allowDownload !== false,
    visible_to_client: fields.visibleToClient !== false,
    show_watermark: fields.showWatermark ?? false,
  })
}

async function syncVideoMetadata() {
  const { data, error } = await supabase.from('video_metadata').select('*')
  if (error || !data?.length) return
  const statuses = {}, versions = {}, settings = {}
  for (const r of data) {
    statuses[r.id] = { status: r.status, retourCount: r.retour_count, retourPhase: r.retour_phase }
    versions[r.id] = r.version
    settings[r.id] = { allowDownload: r.allow_download, visibleToClient: r.visible_to_client, showWatermark: r.show_watermark }
  }
  localStorage.setItem('ls_video_statuses', JSON.stringify(statuses))
  localStorage.setItem('ls_video_versions', JSON.stringify(versions))
  localStorage.setItem('ls_video_settings', JSON.stringify(settings))
}

// ── Invoices ──────────────────────────────────────────────────────────────────

export async function upsertInvoice(item) {
  const { id, created_at, type, ...rest } = item
  await upsert('invoices', { id, created_at, type, data: rest })
}

export async function deleteInvoice(id) { await remove('invoices', id) }

async function syncInvoices() {
  const rows = await fetchAll('invoices')
  localStorage.setItem('ls_invoices', JSON.stringify(rows.map(r => ({ ...r.data, id: r.id, created_at: r.created_at, type: r.type }))))
}

// ── Invoice Template ──────────────────────────────────────────────────────────

export async function upsertInvoiceTemplate(data) {
  const { error } = await supabase.from('invoice_template').upsert({
    id: 1,
    company: data.company, address: data.address,
    email: data.email, phone: data.phone, website: data.website,
    payment_terms: data.paymentTerms, bank_info: data.bankInfo,
    footer: data.footer, tps: data.tps, tvq: data.tvq,
  }, { onConflict: 'id' })
  if (error) console.error('[db] invoice_template upsert:', error.message)
}

async function syncInvoiceTemplate() {
  const { data, error } = await supabase.from('invoice_template').select('*').eq('id', 1).single()
  if (error || !data) return
  localStorage.setItem('ls_invoice_template', JSON.stringify({
    company: data.company, address: data.address, email: data.email,
    phone: data.phone, website: data.website, paymentTerms: data.payment_terms,
    bankInfo: data.bank_info, footer: data.footer, tps: data.tps, tvq: data.tvq,
  }))
}

// ── Employee Extras ───────────────────────────────────────────────────────────

export async function upsertEmployeeProfile(empId, profileData) {
  const { error } = await supabase.from('employee_profiles')
    .upsert({ employee_id: empId, data: profileData }, { onConflict: 'employee_id' })
  if (error) console.error('[db] employee_profiles upsert:', error.message)
}

export async function upsertFreelanceMission(empId, missionData) {
  const { error } = await supabase.from('freelance_missions')
    .upsert({ employee_id: empId, data: missionData }, { onConflict: 'employee_id' })
  if (error) console.error('[db] freelance_missions upsert:', error.message)
}

export async function deleteFreelanceMission(empId) {
  const { error } = await supabase.from('freelance_missions').delete().eq('employee_id', empId)
  if (error) console.error('[db] freelance_missions delete:', error.message)
}

export async function upsertEmployeeSoftware(empId, licenses) {
  const { error } = await supabase.from('employee_software')
    .upsert({ employee_id: empId, licenses }, { onConflict: 'employee_id' })
  if (error) console.error('[db] employee_software upsert:', error.message)
}

async function syncEmployeeExtras() {
  const [profiles, missions, software] = await Promise.all([
    supabase.from('employee_profiles').select('*'),
    supabase.from('freelance_missions').select('*'),
    supabase.from('employee_software').select('*'),
  ])
  if (profiles.data?.length) {
    lsSave('ls_emp_profiles', Object.fromEntries(profiles.data.map(r => [r.employee_id, r.data])))
  }
  if (missions.data?.length) {
    lsSave('ls_freelance_missions', Object.fromEntries(missions.data.map(r => [r.employee_id, r.data])))
  }
  if (software.data?.length) {
    lsSave('ls_emp_software', Object.fromEntries(software.data.map(r => [r.employee_id, r.licenses])))
  }
}

// ── Project Comments ──────────────────────────────────────────────────────────

export async function upsertProjectComment(item) {
  const { id, created_at, projectId, ...rest } = item
  await upsert('project_comments', { id, created_at, project_id: projectId, data: rest })
}

async function syncProjectComments() {
  const rows = await fetchAll('project_comments')
  localStorage.setItem('ls_proj_comments', JSON.stringify(
    rows.map(r => ({ ...r.data, id: r.id, created_at: r.created_at, projectId: r.project_id }))
  ))
}

// ── Master sync : Supabase → localStorage ─────────────────────────────────────

export async function syncAll() {
  await Promise.allSettled([
    syncReservations(),
    syncProjects(),
    syncMessages(),
    syncInternalMessages(),
    syncMails(),
    syncMailLabels(),
    syncEmployees(),
    syncLeaveRequests(),
    syncHourPacks(),
    syncPromoCodes(),
    syncPopupMessages(),
    syncAlerts(),
    syncCheckIns(),
    syncLeads(),
    syncAccounts(),
    syncPrices(),
    syncFeatureFlags(),
    syncVideoMetadata(),
    syncInvoices(),
    syncInvoiceTemplate(),
    syncEmployeeExtras(),
    syncProjectComments(),
  ])
}
