// عناصر
const departure = document.getElementById("departure");
const returnDate = document.getElementById("return");
const daysEl = document.getElementById("days");
const statusEl = document.getElementById("status");

// options
const modeRadios = document.querySelectorAll("input[name='mode']");

// EVENTS
departure.addEventListener("change", calculate);
returnDate.addEventListener("change", calculate);
modeRadios.forEach(r => r.addEventListener("change", calculate));

// MAIN FUNCTION
function calculate() {

  const start = new Date(departure.value);
  const end = new Date(returnDate.value);

  // check valid dates
  if (!departure.value || !returnDate.value) {
    statusEl.textContent = "Select dates";
    daysEl.textContent = "0 days";
    return;
  }

  if (end < start) {
    statusEl.textContent = "Return date must be after departure";
    daysEl.textContent = "0 days";
    return;
  }

  const selectedMode = document.querySelector("input[name='mode']:checked").value;

  let days = 0;

  if (selectedMode === "calendar") {
    days = calculateCalendarDays(start, end);
  } else {
    days = calculateWorkingDays(start, end);
  }

  statusEl.textContent = "Dates look good";
  daysEl.textContent = days + " days";
}

// CALENDAR DAYS
function calculateCalendarDays(start, end) {
  const diff = (end - start) / (1000 * 60 * 60 * 24);
  return diff + 1;
}

// WORKING DAYS (Mon–Fri)
function calculateWorkingDays(start, end) {

  let count = 0;
  let current = new Date(start);

  while (current <= end) {
    const day = current.getDay();

    // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) {
      count++;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
}
