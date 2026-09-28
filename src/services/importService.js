const path = require('path');
const { Worker } = require('worker_threads');
const { Agent, User, Account, LOB, Carrier, Policy } = require('../models');

function parseInWorker(filePath) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, '../workers/importWorker.js'), { workerData: { filePath } });
    worker.once('message', (result) => result.ok ? resolve(result.rows) : reject(new Error(result.error)));
    worker.once('error', reject);
    worker.once('exit', (code) => { if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`)); });
  });
}

async function importRows(filePath) {
  const rows = await parseInWorker(filePath);
  let imported = 0;
  const errors = [];
  const caches = { agent: new Map(), user: new Map(), account: new Map(), lob: new Map(), carrier: new Map() };

  const getOrCreate = async (model, key, value, map) => {
    if (!value) return null;
    if (map.has(value)) return map.get(value);
    const doc = await model.findOneAndUpdate({ [key]: value }, { $setOnInsert: { [key]: value } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    map.set(value, doc._id);
    return doc._id;
  };

  for (const row of rows) {
    try {
      const agentId = await getOrCreate(Agent, 'name', row.agent, caches.agent);
      const accountId = await getOrCreate(Account, 'name', row.account_name, caches.account);
      const lobId = await getOrCreate(LOB, 'categoryName', row.category_name, caches.lob);
      const carrierId = await getOrCreate(Carrier, 'companyName', row.company_name, caches.carrier);

      const userKey = row.email || `${row.firstname}|${row.phone}|${row.dob?.toISOString() || ''}`;
      let userId = caches.user.get(userKey);
      if (!userId) {
        const filter = row.email ? { email: row.email } : { firstName: row.firstname, phone: row.phone, dob: row.dob };
        const user = await User.findOneAndUpdate(filter, {
          $set: { firstName: row.firstname, dob: row.dob, address: row.address, phone: row.phone, state: row.state, zipCode: row.zip, email: row.email, gender: row.gender, userType: row.userType }
        }, { upsert: true, new: true, setDefaultsOnInsert: true });
        userId = user._id; caches.user.set(userKey, userId);
      }

      if (!row.policy_number) throw new Error('Missing policy_number');
      await Policy.findOneAndUpdate({ policyNumber: row.policy_number }, {
        $set: {
          policyStartDate: row.policy_start_date, policyEndDate: row.policy_end_date,
          policyCategoryId: lobId, companyCollectionId: carrierId, userId, accountId, agentId,
          premiumAmount: row.premium_amount, policyMode: row.policy_mode, producer: row.producer,
          policyType: row.policy_type, city: row.city, accountType: row.account_type, csr: row.csr,
          primary: row.primary, agencyId: row.agency_id, applicantId: row.applicant_id,
          hasActiveClientPolicy: row.has_active_client_policy
        }
      }, { upsert: true, new: true, setDefaultsOnInsert: true });
      imported++;
    } catch (error) { errors.push({ policyNumber: row.policy_number, error: error.message }); }
  }
  return { totalRows: rows.length, imported, failed: errors.length, errors: errors.slice(0, 50) };
}

module.exports = { importRows };
