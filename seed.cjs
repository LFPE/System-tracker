const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

const migrationsDir = './migrations'
const files = [
  '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/31b25a4851ac3b3649579ad9b35092277711e6f68d6ffabf437a111f8f53d13e.sqlite',
  '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/e7352547963de7050bd7d94658afc4fe78b61811b7815da12d90be8e863abf4d.sqlite',
]

const migrationFiles = fs.readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort()
  .map((file) => path.join(migrationsDir, file))

files.forEach((file) => {
  const db = new Database(file)

  migrationFiles.forEach((migrationFile) => {
    const sql = fs.readFileSync(migrationFile, 'utf8')
    db.exec(sql)
  })

  db.close()
  console.log('OK:', file)
})
