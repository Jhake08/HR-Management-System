import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { clientId, clientSecret } = req.body

  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: 'Missing clientId or clientSecret' })
  }

  try {
    const envPath = path.resolve(process.cwd(), '.env')
    let envContent = ''

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8')
    }

    // Update or add client ID
    const clientIdRegex = /^NEXT_PUBLIC_GOOGLE_CLIENT_ID=.*$/m
    if (clientIdRegex.test(envContent)) {
      envContent = envContent.replace(clientIdRegex, `NEXT_PUBLIC_GOOGLE_CLIENT_ID=${clientId}`)
    } else {
      envContent += `\nNEXT_PUBLIC_GOOGLE_CLIENT_ID=${clientId}`
    }

    // Update or add client secret
    const clientSecretRegex = /^NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=.*$/m
    if (clientSecretRegex.test(envContent)) {
      envContent = envContent.replace(clientSecretRegex, `NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=${clientSecret}`)
    } else {
      envContent += `\nNEXT_PUBLIC_GOOGLE_CLIENT_SECRET=${clientSecret}`
    }

    fs.writeFileSync(envPath, envContent, 'utf8')

    // Note: Redeployment may be required for changes to take effect

    res.status(200).json({ message: 'Environment variables updated successfully' })
  } catch (error) {
    console.error('Error updating .env file:', error)
    res.status(500).json({ error: 'Failed to update environment variables' })
  }
}
