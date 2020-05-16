import {ScriptLine} from './stack-frame'

/**
 * @param line The line number to provide context around.
 * @param count The number of lines you'd like for context.
 * @param lines The source code.
 */
export function getLinesAround(
  line: number,
  count: number,
  lines: string[] | string,
): ScriptLine[] {
  if (typeof lines === 'string') {
    lines = lines.split('\n')
  }
  const result = []
  for (
    let index = Math.max(0, line - 1 - count);
    index <= Math.min(lines.length - 1, line - 1 + count);
    ++index
  ) {
    result.push(new ScriptLine(index + 1, lines[index], index === line - 1))
  }
  return result
}
