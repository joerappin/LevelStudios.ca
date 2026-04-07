import emailjs from '@emailjs/browser'

const SERVICE_ID      = import.meta.env.VITE_EMAILJS_SERVICE_ID       || ''
const TEMPLATE_ID     = import.meta.env.VITE_EMAILJS_TEMPLATE_ID      || ''
const TEMPLATE_SETPWD = import.meta.env.VITE_EMAILJS_TEMPLATE_SETPWD_ID || ''
const PUBLIC_KEY      = import.meta.env.VITE_EMAILJS_PUBLIC_KEY        || ''

const isConfigured = () => SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY
const isSetPwdConfigured = () => SERVICE_ID && TEMPLATE_SETPWD && PUBLIC_KEY

/**
 * Sends a welcome email to a newly registered user.
 * Template variables used:
 *   {{to_name}}     — full name
 *   {{to_email}}    — recipient email
 *   {{first_name}}  — first name
 *   {{account_type}}— Particulier | Professionnel
 *   {{login_url}}   — link to log in
 *   {{reply_to}}    — Level Studios support email
 */
export async function sendWelcomeEmail({ firstName, lastName, email, clientType }) {
  if (!isConfigured()) {
    console.info('[EmailJS] Non configuré — email non envoyé. Ajoutez les variables VITE_EMAILJS_* dans .env')
    return { success: false, reason: 'not_configured' }
  }

  const params = {
    to_name:      `${firstName} ${lastName}`.trim(),
    to_email:     email,
    first_name:   firstName,
    account_type: clientType === 'pro' ? 'Professionnel' : 'Particulier',
    login_url:    `${window.location.origin}/reservation`,
    reply_to:     'contact@levelstudio.fr',
  }

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, PUBLIC_KEY)
    return { success: true }
  } catch (err) {
    console.error('[EmailJS] Erreur envoi email:', err)
    return { success: false, reason: err?.text || 'error' }
  }
}

/**
 * Sends a "set your password" email to an admin-created account.
 * Template variables used:
 *   {{to_name}}       — full name
 *   {{to_email}}      — recipient email
 *   {{first_name}}    — first name
 *   {{account_type}}  — Client | Employé
 *   {{set_pwd_url}}   — link to /set-password?token=xxx
 *   {{reply_to}}      — Level Studios support email
 */
export async function sendAccountCreatedEmail({ name, email, token, accountType }) {
  const setUrl = `${window.location.origin}/set-password?token=${token}`

  if (!isSetPwdConfigured()) {
    console.info('[EmailJS] Template set-password non configuré — email non envoyé.')
    console.info('[EmailJS] Lien de création de mot de passe :', setUrl)
    return { success: false, reason: 'not_configured', setUrl }
  }

  const firstName = name.split(' ')[0]
  const params = {
    to_name:      name,
    to_email:     email,
    first_name:   firstName,
    account_type: accountType === 'employee' ? 'Employé' : 'Client',
    set_pwd_url:  setUrl,
    reply_to:     'contact@levelstudio.fr',
  }

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_SETPWD, params, PUBLIC_KEY)
    return { success: true, setUrl }
  } catch (err) {
    console.error('[EmailJS] Erreur envoi email création compte:', err)
    return { success: false, reason: err?.text || 'error', setUrl }
  }
}
