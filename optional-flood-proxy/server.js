/**
 * OPTIONAL — only use this if you actually hit a CORS error on GDACS in the browser console
 * when testing src/api/flood.js live. Do NOT wire this in "just in case" — try the direct
 * frontend fetch first. If it works, delete this folder.
 *
 * If GDACS does block direct browser requests, this is the minimal fix: a single relay
 * endpoint that fetches GDACS server-side (no CORS restrictions apply server-to-server)
 * and returns the same JSON with permissive CORS headers for your frontend.
 *
 * Usage:
 *   cd optional-flood-proxy
 *   npm init -y && npm install express node-fetch@2 cors
 *   node server.js
 *
 * Then in src/api/flood.js, change GDACS_URL to:
 *   const GDACS_URL = 'http://localhost:8787/api/floods'
 * (and drop the query-string building, since the proxy adds it)
 */
const express = require('express')
const fetch = require('node-fetch')
const cors = require('cors')

const app = express()
app.use(cors())

app.get('/api/floods', async (req, res) => {
  try {
    const toDate = new Date()
    const fromDate = new Date(toDate.getTime() - 180 * 24 * 60 * 60 * 1000)

    const params = new URLSearchParams({
      eventlist: 'FL',
      fromdate: fromDate.toISOString().slice(0, 10),
      todate: toDate.toISOString().slice(0, 10),
    })

    const gdacsRes = await fetch(
      `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?${params.toString()}`
    )

    if (!gdacsRes.ok) {
      return res.status(502).json({ error: `GDACS request failed: ${gdacsRes.status}` })
    }

    const data = await gdacsRes.json()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = 8787
app.listen(PORT, () => console.log(`Flood proxy running on http://localhost:${PORT}`))
