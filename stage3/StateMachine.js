const chars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

function* generateSequences(length, prefix = '') {
  if (length === 0) yield prefix;
  else for (const c of chars) yield* generateSequences(length - 1, prefix + c);
}

const isInRange = (str, start, end) => [...str].every(c => c >= start && c <= end);

const first = [], second = [];
for (const seq of generateSequences(3)) {
  if (isInRange(seq, 'a', 'g')) first.push(seq);
  if (isInRange(seq, 'b', 'g')) second.push(seq);
}

console.log(`First answer (a-g): ${first.length} sequences\n${first.join(', ')}`);
console.log(`\nSecond answer (b-g): ${second.length} sequences\n${second.join(', ')}`);
console.log(`\nAll possible (first or second): ${first.length} sequences\n${first.join(', ')}`);