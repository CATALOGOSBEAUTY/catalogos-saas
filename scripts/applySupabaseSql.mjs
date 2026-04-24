import fs from 'node:fs';

const [filePath] = process.argv.slice(2);
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF;

if (!filePath || !token || !ref) {
  console.error('Usage: SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=... node scripts/applySupabaseSql.mjs <file>');
  process.exit(1);
}

const sql = fs.readFileSync(filePath, 'utf8');
const statements = [];
let current = '';
let inDollarBlock = false;

for (let index = 0; index < sql.length; index += 1) {
  const pair = sql.slice(index, index + 2);
  if (pair === '$$') {
    inDollarBlock = !inDollarBlock;
    current += pair;
    index += 1;
    continue;
  }

  const char = sql[index];
  current += char;

  if (char === ';' && !inDollarBlock) {
    const statement = current.trim();
    if (statement) statements.push(statement);
    current = '';
  }
}

if (current.trim()) statements.push(current.trim());

for (let index = 0; index < statements.length; index += 1) {
  const statement = statements[index];
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: statement })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`FAILED_STATEMENT ${index + 1}`);
    console.error(statement.slice(0, 240));
    console.error(text);
    process.exit(1);
  }
}

console.log(JSON.stringify({ applied: statements.length }));
