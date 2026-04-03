const dep     = document.getElementById('departure');
const ret     = document.getElementById('return');
const status  = document.getElementById('status');
const days    = document.getElementById('days');
const preview = document.getElementById('preview');
const country = document.getElementById('country');
const city    = document.getElementById('city');
const purpose = document.getElementById('purpose');
const notes   = document.getElementById('notes');

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

function fmt(v) {
  return v
    ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
}

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
    'Departure: ' + fmt(dep.value) + '\n' +
    'Return:    ' + fmt(ret.value) + '\n' +
    'Duration:  ' + (n !== null ? n + ' day' + (n === 1 ? '' : 's') : '—') + '\n' +
    'Purpose:   ' + (purpose.value || '—') +
    (dest ? '\nDestination: ' + dest : '');
}

// Listen for changes on all inputs
[dep, ret, ...document.querySelectorAll('input[name=mode]'),
  document.getElementById('holidays'), country, city, purpose, notes
].forEach(el => el.addEventListener('change', update));

[purpose, country, city].forEach(el => el.addEventListener('input', update));

// Clear button
document.getElementById('clear').addEventListener('click', () => {
  dep.value = '';
  ret.value = '';
  document.querySelector('input[name=mode][value=calendar]').checked = true;
  document.getElementById('holidays').checked = false;
  [country, city, purpose, notes].forEach(el => el.value = '');
  update();
});

// Copy summary button
document.getElementById('copy').addEventListener('click', () => {
  navigator.clipboard.writeText(preview.textContent).catch(() => {});
  const btn = document.getElementById('copy');
  btn.textContent = 'Copied!';
  setTimeout(() => btn.textContent = 'Copy summary', 1500);
});

// Submit button
document.getElementById('submit').addEventListener('click', () => {
  if (!dep.value || !ret.value) {
    status.textContent = 'Please fill in both dates first';
    return;
  }
  alert('Request submitted!\n\n' + preview.textContent);
});
