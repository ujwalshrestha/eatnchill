// Minimal SQL dump INSERT parser for phpMyAdmin-style dumps.
// We only support statements like:
//   INSERT INTO `table` (`col1`, `col2`, ...) VALUES (...), (...);
//
// This avoids naive comma-splitting and properly handles:
// - commas/newlines inside quoted strings
// - backslash escapes (e.g. \')
// - doubled quotes inside strings (e.g. '' -> ')

function isWhitespace(ch) {
  return ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t';
}

function parseSqlString(text, startIndex) {
  // Assumes text[startIndex] === "'"
  let i = startIndex + 1;
  let out = '';
  while (i < text.length) {
    const c = text[i];
    if (c === "'") {
      // SQL escape: '' -> literal '
      if (text[i + 1] === "'") {
        out += "'";
        i += 2;
        continue;
      }
      return { value: out, nextIndex: i + 1 };
    }
    if (c === '\\') {
      // MySQL-style escapes, keep next char verbatim.
      if (i + 1 < text.length) {
        out += text[i + 1];
        i += 2;
      } else {
        i += 1;
      }
      continue;
    }
    out += c;
    i += 1;
  }
  // Unterminated string, return what we have.
  return { value: out, nextIndex: i };
}

function scanStatementEnd(sql, startIndex) {
  // Finds the next ';' that is not inside a quoted string.
  let i = startIndex;
  while (i < sql.length) {
    const c = sql[i];
    if (c === "'") {
      const { nextIndex } = parseSqlString(sql, i);
      i = nextIndex;
      continue;
    }
    if (c === ';') return i;
    i += 1;
  }
  return -1;
}

function parseColumnsList(stmt, insertIntoIndex) {
  // stmt starts at "INSERT INTO ..."
  // Find the first '(' after table name and parse until ')'
  const open = stmt.indexOf('(', insertIntoIndex);
  if (open === -1) return null;
  // Find the matching ')' before VALUES keyword (not inside strings; columns list won't contain strings).
  const close = stmt.indexOf(')', open + 1);
  if (close === -1) return null;

  const inside = stmt.slice(open + 1, close);
  const cols = inside
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/`/g, '').replace(/^"|"$/g, ''));
  return { columns: cols, nextIndex: close + 1 };
}

function parseValuesTuples(valuesText) {
  const rows = [];
  let i = 0;

  function skipWs() {
    while (i < valuesText.length && isWhitespace(valuesText[i])) i += 1;
  }

  while (i < valuesText.length) {
    skipWs();
    // skip separators
    if (valuesText[i] === ',') {
      i += 1;
      continue;
    }
    if (i >= valuesText.length) break;
    if (valuesText[i] !== '(') {
      // unexpected char, move on
      i += 1;
      continue;
    }
    i += 1; // '('

    const row = [];
    while (i < valuesText.length) {
      skipWs();

      let val;
      if (valuesText[i] === "'") {
        const parsed = parseSqlString(valuesText, i);
        val = parsed.value;
        i = parsed.nextIndex;
      } else {
        const start = i;
        while (i < valuesText.length && valuesText[i] !== ',' && valuesText[i] !== ')') i += 1;
        const raw = valuesText.slice(start, i).trim();
        if (/^null$/i.test(raw)) val = null;
        else val = raw;
      }

      row.push(val);
      skipWs();

      if (valuesText[i] === ',') {
        i += 1;
        continue;
      }
      if (valuesText[i] === ')') {
        i += 1;
        break;
      }
      // unexpected, advance to avoid infinite loop
      i += 1;
    }
    rows.push(row);
  }

  return rows;
}

export function extractInsertObjects(sql, tableName) {
  const needle = `INSERT INTO \`${tableName}\``;
  const out = [];
  let idx = 0;

  while (idx < sql.length) {
    const start = sql.indexOf(needle, idx);
    if (start === -1) break;

    const end = scanStatementEnd(sql, start);
    if (end === -1) break;

    const stmt = sql.slice(start, end); // without ';'
    const columnsParsed = parseColumnsList(stmt, 0);
    if (!columnsParsed?.columns?.length) {
      idx = end + 1;
      continue;
    }

    const valuesKeyword = stmt.toUpperCase().indexOf('VALUES', columnsParsed.nextIndex);
    if (valuesKeyword === -1) {
      idx = end + 1;
      continue;
    }

    const valuesText = stmt.slice(valuesKeyword + 'VALUES'.length).trim();
    const rows = parseValuesTuples(valuesText);

    for (const row of rows) {
      const obj = {};
      for (let c = 0; c < columnsParsed.columns.length; c += 1) {
        obj[columnsParsed.columns[c]] = row[c] ?? null;
      }
      out.push(obj);
    }

    idx = end + 1;
  }

  return out;
}

