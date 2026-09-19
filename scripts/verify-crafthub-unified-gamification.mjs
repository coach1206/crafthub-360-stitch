import fs from 'node:fs'

const required = [
  'server/db/migrations/122_crafthub_unified_gamification_novee_events.sql',
  'server/services/crafthub/craftHubGameService.js',
  'server/routes/craftHubGameRoutes.js',
  'src/components/crafthub/CraftAcademyExperience.jsx',
]
for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing required dependency: ${file}`)
}
const index = fs.readFileSync('server/index.js','utf8')
if (!index.includes("app.use('/api/crafthub/game'")) throw new Error('CraftHub game router is not mounted')
for (const page of ['PourCraft.jsx','BeerCraft.jsx','WineCraft.jsx']) {
  const content = fs.readFileSync(`src/pages/${page}`,'utf8')
  if (!content.includes('CraftAcademyExperience')) throw new Error(`${page} is not wired to shared functional academy runtime`)
}
const migration = fs.readFileSync(required[0],'utf8')
for (const table of ['crafthub_game_player_state','crafthub_game_quiz_attempts','crafthub_game_completions','crafthub_game_awards','novee_os_ecosystem_events']) {
  if (!migration.includes(table)) throw new Error(`Missing schema dependency: ${table}`)
}
console.log('PASS crafthub unified gamification dependency closure')
