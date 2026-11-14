export interface CliOptions {
  dir: string;
  port: number;
  open: boolean;
  history: boolean;
  /** Write the snapshot to this file instead of starting the viewer. */
  json: string | null;
  help: boolean;
  version: boolean;
}

export const DEFAULT_PORT = 4777;

export const USAGE = `kobi-xray — see any repository as a 3D city with time travel

Usage
  kobi-xray [dir] [options]

Options
  -p, --port <n>     Port for the local viewer (default ${DEFAULT_PORT})
      --no-open      Do not open the browser
      --no-history   Skip git history (no time travel, no heat)
      --json <file>  Write the snapshot as JSON and exit
  -v, --version      Print the version
  -h, --help         Show this help
`;

export class UsageError extends Error {}

export function parseArgs(argv: readonly string[]): CliOptions {
  const options: CliOptions = {
    dir: '.',
    port: DEFAULT_PORT,
    open: true,
    history: true,
    json: null,
    help: false,
    version: false,
  };
  let dirSeen = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    const value = () => {
      const next = argv[++i];
      if (next === undefined) throw new UsageError(`Missing value for ${arg}`);
      return next;
    };
    switch (arg) {
      case '-h':
      case '--help':
        options.help = true;
        break;
      case '-v':
      case '--version':
        options.version = true;
        break;
      case '--no-open':
        options.open = false;
        break;
      case '--no-history':
        options.history = false;
        break;
      case '--json':
        options.json = value();
        break;
      case '-p':
      case '--port': {
        const port = Number(value());
        if (!Number.isInteger(port) || port < 1 || port > 65535)
          throw new UsageError('Invalid port');
        options.port = port;
        break;
      }
      default:
        if (arg.startsWith('-')) throw new UsageError(`Unknown option ${arg}`);
        if (dirSeen) throw new UsageError(`Unexpected argument ${arg}`);
        options.dir = arg;
        dirSeen = true;
    }
  }
  return options;
}
