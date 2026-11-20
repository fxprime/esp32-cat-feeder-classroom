function scopeName(header) {
  const block = header.match(/^(?:else(?: if)?|if|for)\b/);
  if (block) return block[0];
  const signature = header.match(/\b(\w+)\s*\(/);
  return signature ? `${signature[1]}()` : '{ }';
}

export function indexExecutionScopes(lines) {
  const outside = {label:'นอกฟังก์ชัน', lines:new Set()};
  const stack = [];
  const scopes = new Map();

  // The lesson uses one block edge per line, except for the shared `} else {` line.
  for (const {id, code} of lines) {
    const text = code.trim();
    const closed = text.startsWith('}') ? stack.pop() : null;
    let opened;
    if (text.endsWith('{')) {
      const name = scopeName(text.replace(/^}\s*/, ''));
      const parent = stack.at(-1);
      opened = {label:parent ? `${parent.label} › ${name}` : name, lines:new Set()};
      stack.push(opened);
    }
    for (const scope of stack) scope.lines.add(id);
    closed?.lines.add(id);
    if (!stack.length && !closed) outside.lines.add(id);

    let active = opened ?? closed ?? stack.at(-1);
    // Comparing the condition and rejoining after either branch happen in loop().
    if (id === 'if' || id === 'timing-if') active = stack.at(-2);
    if (id === 'if-close') active = stack.at(-1);
    scopes.set(id, active ?? outside);
  }
  return scopes;
}
