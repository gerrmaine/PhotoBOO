// Runs the API and the Vue dev server together with prefixed, colourised output,
// so `npm run dev` is the only command needed day to day.

import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const procs = [
  { name: 'server', color: '\x1b[36m', cwd: path.join(root, 'server') },
  { name: 'client', color: '\x1b[35m', cwd: path.join(root, 'client') },
].map(({ name, color, cwd }) => {
  // detached on POSIX puts each server in its own process group so the whole
  // group can be signalled at once; on Windows taskkill /T walks the tree.
  const child = spawn('npm', ['run', 'dev'], {
    cwd,
    shell: true,
    detached: process.platform !== 'win32',
  })
  const tag = `${color}[${name}]\x1b[0m `

  const pipe = (stream, out) =>
    stream.on('data', (d) =>
      String(d)
        .split('\n')
        .filter((l) => l.trim())
        .forEach((l) => out.write(tag + l + '\n')),
    )

  pipe(child.stdout, process.stdout)
  pipe(child.stderr, process.stderr)
  return child
})

/**
 * `npm run dev` spawns a shell, which spawns node/vite. Killing the child only
 * kills that shell, leaving the real servers orphaned and still holding ports
 * 3000 and 5173 - so the next `npm run dev` fails with EADDRINUSE. Both
 * branches below kill the whole process tree instead.
 */
function shutdown() {
  for (const child of procs) {
    if (child.killed || child.exitCode !== null) continue
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
    } else {
      process.kill(-child.pid, 'SIGTERM') // negative pid = the whole group
    }
  }
}

process.on('SIGINT', () => { shutdown(); process.exit(0) })
process.on('SIGTERM', () => { shutdown(); process.exit(0) })
process.on('exit', shutdown)
