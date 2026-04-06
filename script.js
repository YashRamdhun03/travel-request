// ============================================================
//  CONFIGURATION — paste your Power Automate HTTP trigger URL
// ============================================================
const POWER_AUTOMATE_URL = 'https://defaultc6a34697a34b4aee8e8bc884c409b5.80.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/9258c032d9f04c74bab08348315a73b4/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=TpE4I6MzpTUlbjZiSulC_m7eUBwMujzEasbAomRLaOE';

// ============================================================
//  Element references
// ============================================================
const dep     = document.getElementById('departure');
const ret     = document.getElementById('return');
const status  = document.getElementById('status');
const days    = document.getElementById('days');
const preview = document.getElementById('preview');
const country = document.getElementById('country');
const city    = document.getElementById('city');
const purpose = document.getElementById('purpose');
const notes   = document.getElementById('notes');
const travelerName = document.getElementById('traveler-name');

// ============================================================
//  Day calculation
// ============================================================
function calcDays() {
  const d = dep.value, r = ret.value;
  if (!d || !r) return null;

  const start = new Date(d);
  const end   = new Date(r);
  if (end < start) return null;

  const mode = document.querySelector('input[name=mode]:checked').value;

  if (mode === 'calendar') {
    return Math.round((end - start) / 864e5) + 1;
  } else {
    let count = 0;
    let cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }
}

// ============================================================
//  Date formatter
// ============================================================
function fmt(v) {
  return v
    ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
}

// ============================================================
//  Live preview update
// ============================================================
function update() {
  const n = calcDays();

  if (n === null) {
    status.textContent = 'Select dates to calculate';
    days.textContent   = '— days';
  } else {
    const mode = document.querySelector('input[name=mode]:checked').value;
    status.textContent = mode === 'calendar' ? 'Calendar days' : 'Working days (Mon–Fri)';
    days.textContent   = n + ' day' + (n === 1 ? '' : 's');
  }

  const dest = [city.value, country.value].filter(Boolean).join(', ');

  preview.textContent =
    'Traveler:    ' + (travelerName.value || '—') + '\n' +
    'Departure:   ' + fmt(dep.value)   + '\n' +
    'Return:      ' + fmt(ret.value)   + '\n' +
    'Duration:    ' + (n !== null ? n + ' day' + (n === 1 ? '' : 's') : '—') + '\n' +
    'Purpose:     ' + (purpose.value   || '—') +
    (dest ? '\nDestination: ' + dest   : '') +
    (notes.value ? '\nNotes:       ' + notes.value : '');
}

// ============================================================
//  Listen for input changes
// ============================================================
[dep, ret, ...document.querySelectorAll('input[name=mode]'),
  document.getElementById('holidays'), country, city, purpose, notes
].forEach(el => el.addEventListener('change', update));

[purpose, country, city, notes, travelerName].forEach(el => el.addEventListener('input', update));

// ============================================================
//  Clear button
// ============================================================
document.getElementById('clear').addEventListener('click', () => {
  dep.value = '';
  ret.value = '';
  document.querySelector('input[name=mode][value=calendar]').checked = true;
  document.getElementById('holidays').checked = false;
  [country, city, purpose, notes, travelerName].forEach(el => el.value = '');
  update();
});

// ============================================================
//  Copy summary button
// ============================================================
document.getElementById('copy').addEventListener('click', () => {
  navigator.clipboard.writeText(preview.textContent).catch(() => {});
  const btn = document.getElementById('copy');
  btn.textContent = 'Copied!';
  setTimeout(() => btn.textContent = 'Copy summary', 1500);
});

// ============================================================
//  Submit — sends data to Power Automate
// ============================================================
document.getElementById('submit').addEventListener('click', async () => {
  // Basic validation
  if (!travelerName.value.trim()) {
    setStatus('Please enter the traveler\'s full name.', 'error');
    return;
  }
  if (!dep.value || !ret.value) {
    setStatus('Please fill in both departure and return dates.', 'error');
    return;
  }
  if (new Date(ret.value) < new Date(dep.value)) {
    setStatus('Return date cannot be before departure date.', 'error');
    return;
  }

  const n    = calcDays();
  const mode = document.querySelector('input[name=mode]:checked').value;

  // Build the payload — these keys become SharePoint list columns
  const payload = {
    submittedAt:     new Date().toISOString(),
    travelerName:    travelerName.value.trim(),
    departureDate:   dep.value,
    returnDate:      ret.value,
    durationDays:    n,
    durationMode:    mode === 'calendar' ? 'Calendar days' : 'Working days',
    excludeHolidays: document.getElementById('holidays').checked,
    country:         country.value  || '',
    city:            city.value     || '',
    purpose:         purpose.value  || '',
    notes:           notes.value    || '',
    summary:         preview.textContent
  };

  // UI: show loading state
  const submitBtn = document.getElementById('submit');
  submitBtn.textContent = 'Submitting…';
  submitBtn.disabled    = true;

  try {
    const response = await fetch(POWER_AUTOMATE_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });

    if (response.ok) {
      submitBtn.textContent = 'Request submitted!';
      setStatus('Your request has been sent to admin.', 'success');
      showBanner('Travel request submitted successfully. Admin has been notified.', 'success');
    } else {
      throw new Error('Server responded with status ' + response.status);
    }
  } catch (err) {
    submitBtn.textContent = 'Submit request';
    submitBtn.disabled    = false;
    setStatus('Submission failed. Please try again.', 'error');
    showBanner('Could not submit. Check your connection or contact IT support.', 'error');
    console.error('Submission error:', err);
  }
});

// ============================================================
//  Helper: update status text with colour
// ============================================================
function setStatus(message, type) {
  status.textContent = message;
  status.style.color = type === 'error'   ? '#c0392b'
                     : type === 'success' ? '#27ae60'
                     : '#8a8a85';
}

// ============================================================
//  Helper: show a feedback banner below the submit button
// ============================================================
function showBanner(message, type) {
  let banner = document.getElementById('submit-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'submit-banner';
    banner.style.cssText = `
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      text-align: center;
      margin-top: 4px;
    `;
    document.querySelector('.wrap').appendChild(banner);
  }

  if (type === 'success') {
    banner.style.background = '#eafaf1';
    banner.style.color      = '#1e8449';
    banner.style.border     = '1px solid #a9dfbf';
  } else {
    banner.style.background = '#fdedec';
    banner.style.color      = '#c0392b';
    banner.style.border     = '1px solid #f5b7b1';
  }

  banner.textContent   = message;
  banner.style.display = 'block';

  // Auto-hide after 6 seconds
  setTimeout(() => { banner.style.display = 'none'; }, 6000);
}
