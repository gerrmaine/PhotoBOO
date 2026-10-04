import { app } from './app.js'
import { config } from './config.js'

app.listen(config.port, () => {
  console.log(`\n  Photobooth API   http://localhost:${config.port}`)
  console.log(`  Supabase         ${config.supabaseUrl}`)
  console.log(`  Storage bucket   ${config.storageBucket}`)
  console.log(`  Allowed origins  ${config.allowedOrigins.join(', ')}\n`)
})
