import type { AnalyzePhase } from '@kobi-xray/core/node';

const LABELS: Record<AnalyzePhase, string> = {
  scan: 'Scanning files',
  parse: 'Parsing sources',
  resolve: 'Resolving imports',
  history: 'Mining git history',
};

/** Single-line progress reporter that degrades to plain lines when not a TTY. */
export function createProgress(stream: NodeJS.WriteStream = process.stderr) {
  let current: AnalyzePhase | null = null;
  const tty = stream.isTTY;

  return {
    update(phase: AnalyzePhase, done: number, total: number): void {
      const counter = total > 1 ? ` ${done}/${total}` : '';
      if (tty) {
        stream.write(`\r\x1b[2K  ${LABELS[phase]}${counter}`);
      } else if (phase !== current) {
        stream.write(`  ${LABELS[phase]}\n`);
      }
      current = phase;
    },
    done(): void {
      if (tty && current) stream.write('\r\x1b[2K');
      current = null;
    },
  };
}
