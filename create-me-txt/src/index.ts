import { Command } from 'commander'
import { generate } from './commands/generate.js'
import { lint } from './commands/lint.js'
import { fetchMeTxt } from './commands/fetch.js'

const program = new Command()

program
  .name('create-me-txt')
  .description('CLI tool to generate, validate, and fetch me.txt files')
  .version('0.1.0')

program
  .command('generate', { isDefault: true })
  .description('Generate a new me.txt file interactively')
  .option('-g, --github <username>', 'Pre-fill from GitHub profile')
  .option('-o, --output <path>', 'Output file path', 'me.txt')
  .option('--json', 'Output as JSON instead of markdown')
  .option('-y, --yes', 'Skip prompts, use defaults and flags')
  .option('--full', 'Include all optional sections in wizard')
  .action(async (options) => {
    await generate(options)
  })

program
  .command('lint <file>')
  .description('Validate a me.txt file')
  .action(async (file) => {
    await lint(file)
  })

program
  .command('fetch <url>')
  .description('Fetch and display a me.txt from a URL or domain')
  .option('-o, --output <path>', 'Save to file')
  .option('-s, --save <path>', 'Save to file (alias for --output)')
  .option('-p, --print', 'Print full contents to stdout')
  .action(async (url, options) => {
    await fetchMeTxt(url, options)
  })

program.parse()
