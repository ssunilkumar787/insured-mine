const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');

function clean(value) {
  if (value === undefined || value === null || String(value).trim() === '') return undefined;
  return String(value).trim();
}

function toDate(value) {
  const v = clean(value);
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toNumber(value) {
  const v = clean(value);
  if (!v) return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

async function run() {
  const extension = require('path').extname(workerData.filePath).toLowerCase();
  let rows;
  if (extension === '.xlsx' || extension === '.xls') {
    const workbook = XLSX.readFile(workerData.filePath, { cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  } else {
    const csv = fs.readFileSync(workerData.filePath, 'utf8');
    rows = parse(csv, { columns: true, skip_empty_lines: true, relax_column_count: true, bom: true });
  }
  const result = rows.map((r) => ({
    agent: clean(r.agent), userType: clean(r.userType), policy_mode: toNumber(r.policy_mode),
    producer: clean(r.producer), policy_number: clean(r.policy_number), premium_amount: toNumber(r.premium_amount),
    policy_type: clean(r.policy_type), company_name: clean(r.company_name), category_name: clean(r.category_name),
    policy_start_date: toDate(r.policy_start_date), policy_end_date: toDate(r.policy_end_date), csr: clean(r.csr),
    account_name: clean(r.account_name), email: clean(r.email), gender: clean(r.gender), firstname: clean(r.firstname),
    city: clean(r.city), account_type: clean(r.account_type), phone: clean(r.phone), address: clean(r.address),
    state: clean(r.state), zip: clean(r.zip), dob: toDate(r.dob), primary: clean(r.primary),
    applicant_id: clean(r['Applicant ID']), agency_id: clean(r.agency_id), has_active_client_policy: clean(r['hasActive ClientPolicy'])
  }));
  parentPort.postMessage({ ok: true, rows: result });
}

run().catch((error) => parentPort.postMessage({ ok: false, error: error.message }));
