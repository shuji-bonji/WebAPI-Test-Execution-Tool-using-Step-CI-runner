export function parseCommandLineOptions(args: string[]) {
  return {
    verbose: args.includes('-v'),
    trace: args.includes('--trace')
  };
}