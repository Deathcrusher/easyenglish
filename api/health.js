import { azureConfig, json } from './_azure.js'

// Sagt der App, ob die Azure-Funktionen eingerichtet sind
export async function GET() {
  return json({ speech: !!azureConfig() })
}
