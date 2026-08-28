const PAGE_SIZE = 10;
const DEFAULT_SOURCE = '/docs/employee-list.json';

const COLUMNS = [
  ['name', 'Name'],
  ['department', 'Department'],
  ['experience', 'Experience'],
  ['city', 'City'],
];

// author sheet exports can carry stray whitespace in keys/values (e.g. "experience ")
function normalizeEmployee(raw) {
  const employee = {};
  Object.keys(raw).forEach((key) => {
    const value = raw[key];
    employee[key.trim()] = typeof value === 'string' ? value.trim() : value;
  });
  return employee;
}

function createEmployeeRow(raw) {
  const employee = normalizeEmployee(raw);
  const tr = document.createElement('tr');
  COLUMNS.forEach(([key, label]) => {
    const td = document.createElement('td');
    td.dataset.label = label;
    td.textContent = employee[key] || '';
    tr.append(td);
  });
  return tr;
}

// the backend sheet may ignore offset/limit and always return everything;
// fetch once and paginate the rendered rows locally so "Load more" is reliable either way
async function fetchAllEmployees(source) {
  const resp = await fetch(source);
  if (!resp.ok) throw new Error(`employee list request failed: ${resp.status}`);
  const json = await resp.json();
  let { data } = json;
  data = Array.isArray(data) ? data : [];

  if (Number.isFinite(json.total) && json.total > data.length) {
    const url = new URL(source, window.location.href);
    url.searchParams.set('limit', json.total);
    const fullResp = await fetch(url);
    if (fullResp.ok) {
      const fullJson = await fullResp.json();
      if (Array.isArray(fullJson.data)) data = fullJson.data;
    }
  }

  return data;
}

function renderNextPage(tbody, button, status, state) {
  const nextRows = state.employees.slice(state.rendered, state.rendered + PAGE_SIZE);
  nextRows.forEach((row) => tbody.append(createEmployeeRow(row)));
  state.rendered += nextRows.length;

  const hasMore = state.rendered < state.employees.length;
  button.hidden = !hasMore;
  status.textContent = `Showing ${state.rendered} of ${state.employees.length} employees`;
}

export default async function decorate(block) {
  const link = block.querySelector('a[href]');
  const source = link ? link.getAttribute('href') : DEFAULT_SOURCE;
  block.replaceChildren();

  const table = document.createElement('table');
  table.className = 'employee-list-table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  COLUMNS.forEach(([, label]) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = label;
    headRow.append(th);
  });
  thead.append(headRow);
  table.append(thead);

  const tbody = document.createElement('tbody');
  table.append(tbody);
  block.append(table);

  const status = document.createElement('p');
  status.className = 'employee-list-status';
  status.setAttribute('aria-live', 'polite');

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'employee-list-load-more';
  button.textContent = 'Load more';
  button.hidden = true;
  block.append(button, status);

  const state = { employees: [], rendered: 0 };

  try {
    state.employees = await fetchAllEmployees(source);
    renderNextPage(tbody, button, status, state);
  } catch (e) {
    status.textContent = 'Unable to load employees.';
    return;
  }

  button.addEventListener('click', () => renderNextPage(tbody, button, status, state));
}
