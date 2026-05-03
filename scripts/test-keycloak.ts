import fs from 'fs'
import path from 'path'

function loadDotEnvIfExists() {
  const p = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(p)) {
    const txt = fs.readFileSync(p, 'utf8')
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i)
      if (m) {
        const k = m[1]
        let v = m[2]
        // strip surrounding quotes
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1)
        }
        if (!process.env[k]) process.env[k] = v
      }
    }
  }
}

async function testKeycloak() {
  // try to load .env.local so script can run without manual env setup
  try { loadDotEnvIfExists() } catch (e) { /* ignore */ }

  const issuer = process.env.KEYCLOAK_ISSUER_URI || process.env.KEYCLOAK_ISSUER || process.env.NEXT_PUBLIC_KEYCLOAK_URL
  console.log('Testing Keycloak issuer (derived):', issuer)

  if (!issuer) {
    console.error('No issuer found in env. Set KEYCLOAK_ISSUER_URI or NEXT_PUBLIC_KEYCLOAK_URL')
    process.exit(1)
  }

  const wellKnown = `${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`
  console.log('\n1) Fetching well-known:', wellKnown)
  try {
    const r = await fetch(wellKnown)
    if (!r.ok) {
      console.error('Failed to fetch well-known:', r.status, r.statusText)
      console.error(await r.text())
      return
    }
    const jw = await r.json()
    console.log('✅ well-known OK')
    console.log('authorization_endpoint=', jw.authorization_endpoint)
    console.log('token_endpoint=', jw.token_endpoint)
  } catch (err) {
    console.error('Error fetching well-known:', err)
    return
  }

  // Optionally try client_credentials if we have a client secret
  const clientId = process.env.KEYCLOAK_CLIENT_ID || process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET
  if (clientId && clientSecret) {
    const tokenUrl = `${issuer.replace(/\/$/, '')}/protocol/openid-connect/token`
    console.log('\n2) Attempting client_credentials token request to:', tokenUrl)
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    })
    try {
      const r = await fetch(tokenUrl, { method: 'POST', body: params })
      const text = await r.text()
      console.log('status=', r.status)
      console.log('body=', text)
    } catch (err) {
      console.error('Error fetching token:', err)
    }
  } else {
    console.log('\nSkipping client_credentials test (no client secret found in env)')
  }
}

testKeycloak()
.catch(e => { console.error(e); process.exit(1) })
