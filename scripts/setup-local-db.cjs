const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')

const projectRoot = process.cwd()
const persistDir = path.join(projectRoot, 'meu_banco', 'v3', 'd1', 'miniflare-D1DatabaseObject')
const migrationsDir = path.join(projectRoot, 'migrations')

function findSqliteFiles(dir) {
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir)
    .filter((file) => file.endsWith('.sqlite'))
    .map((file) => path.join(dir, file))
}

function listMigrationFiles(dir) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Diretorio de migrations nao encontrado em ${dir}`)
  }

  return fs.readdirSync(dir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => path.join(dir, file))
}

function ensurePersistedDatabase() {
  fs.mkdirSync(persistDir, { recursive: true })

  const files = findSqliteFiles(persistDir)
  if (files.length > 0) return files

  const defaultFile = path.join(
    persistDir,
    'local-db.sqlite'
  )

  fs.closeSync(fs.openSync(defaultFile, 'a'))
  return [defaultFile]
}

function main() {
  const migrationFiles = listMigrationFiles(migrationsDir)
  const sqliteFiles = ensurePersistedDatabase()

  for (const file of sqliteFiles) {
    const db = new Database(file)

    for (const migrationFile of migrationFiles) {
      const migrationSql = fs.readFileSync(migrationFile, 'utf8')
      db.exec(migrationSql)
    }

    db.close()
  }

  console.log(`Banco local preparado em ${sqliteFiles.length} arquivo(s).`)
  console.log(`Migrations aplicadas: ${migrationFiles.length}`)
  for (const file of sqliteFiles) {
    console.log(`- ${path.relative(projectRoot, file)}`)
  }
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
