/* script.js
   BSIT Advisor — dynamic UI + prereq engine
   Catalog sources: Daytona State BSIT program page + course pages.
   (See assistant message for exact catalog citations.)
*/

const courses = {
  // Program Specific Courses (from program guide)
  "COP3530": {
    "name": "Data Structures",
    "credits": 3,
    // from catalog: (COP2800 or COP2220 or COP2360) and (COT3100 or MAD2104)
    "prereqs": [], 
    "prereqs_or": [["COP2800","COP2220","COP2360"], ["COT3100","MAD2104"]],
    "notes": "Prerequisite per catalog: (COP2800 or COP2220 or COP2360) AND (COT3100 or MAD2104). See catalog."
  },
  "COP4610": {"name":"Operating Systems","credits":3,"prereqs":[],"prereqs_or":[],"notes":"See Catalog."},
  "COP4708": {
    "name":"Applied Database I",
    "credits":3,
    "prereqs":[],
    "prereqs_or": [["COP2800","COP2220","COP2360"]],
    "notes":"Prerequisite per catalog: COP2800 or COP2220 or COP2360."
  },
  "COP4813": {"name":"Web Systems I","credits":3,"prereqs":[],"prereqs_or":[],"notes":"See Catalog."},
  "CNT3104": {"name":"Introduction to Telecommunications","credits":2,"prereqs":[],"prereqs_or":[],"notes":"See Catalog."},
  "CNT4007": {"name":"Data and Computer Communications","credits":3,"prereqs":[],"prereqs_or":[],"notes":"See Catalog."},
  "CNT4703": {"name":"Voice and Data Network Design","credits":3,"prereqs":[],"prereqs_or":[],"notes":"See Catalog."},
  "CIS4250": {"name":"Ethical Issues in IT","credits":1,"prereqs":[],"prereqs_or":[],"notes":"See Catalog."},
  "CIS4360": {"name":"Applied Cybersecurity","credits":3,"prereqs":[],"prereqs_or":[],"notes":"See Catalog."},
  "CIS4510": {"name":"IT Project Management","credits":3,"prereqs":[],"prereqs_or":[],"notes":"See Catalog."},
  "CDA4101": {"name":"Computer Organization and Design","credits":3,"prereqs":[],"prereqs_or":[],"notes":"See Catalog."},
  "CEN4010": {"name":"Software Engineering","credits":3,"prereqs":[],"prereqs_or":[],"notes":"See Catalog."},
  "CEN4801": {"name":"Systems Integration","credits":3,"prereqs":[],"prereqs_or":[],"notes":"See Catalog."},
  "CEN3722": {"name":"Human Computer Interfaces","credits":3,"prereqs":[],"prereqs_or":[],"notes":"See Catalog."},
  "CTS3348": {"name":"Linux Administration","credits":3,"prereqs":[],"prereqs_or":[],"notes":"See Catalog."},
  "GEB3213": {"name":"Business Writing","credits":3,"prereqs":[],"prereqs_or":[],"notes":"See Catalog."},

  // Program Electives (must pick 3 credits)
  "COP4709": {"name":"Applied Database II","credits":3,"prereqs":[],"prereqs_or":[],"notes":"Elective per program."},
  "COP4834": {"name":"Web Systems II","credits":3,"prereqs":[],"prereqs_or":[],"notes":"Elective per program."},
  "CET4860": {"name":"Introduction to Digital Forensics","credits":3,"prereqs":[],"prereqs_or":[],"notes":"Elective per program."},
  "CET4861": {"name":"Advanced Digital Forensics","credits":3,"prereqs":[],"prereqs_or":[],"notes":"Elective per program."},
  "CET4862": {"name":"Network Forensics and Incident Response","credits":3,"prereqs":[],"prereqs_or":[],"notes":"Elective per program."},
  "CET4884": {"name":"Security Methods and Practice","credits":3,"prereqs":[],"prereqs_or":[],"notes":"Elective per program."}
};

/* Helper: build OR-groups map so we can disable alternatives when one alt selected.
   We will scan all "prereqs_or" arrays and form sets of alternatives.
*/
function buildOrGroups() {
  const groups = [];
  for (const code in courses) {
    const entry = courses[code];
    if (entry.prereqs_or && entry.prereqs_or.length) {
      for (const orGroup of entry.prereqs_or) {
        // sort and unique
        const group = Array.from(new Set(orGroup)).sort();
        // avoid duplicates
        if (!groups.some(g => g.length === group.length && g.every((v,i)=>v===group[i]))) {
          groups.push(group);
        }
      }
    }
  }
  return groups;
}

const OR_GROUPS = buildOrGroups();

const taken = new Set();

function buildUI() {
  const list = document.getElementById('courseList');
  list.innerHTML = '';
  for (const code of Object.keys(courses).sort()) {
    const c = courses[code];
    const row = document.createElement('div');
    row.className = 'course-row';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'chk_' + code;
    checkbox.dataset.code = code;

    checkbox.addEventListener('change', (e) => {
      const code = e.target.dataset.code;
      if (e.target.checked) taken.add(code); else taken.delete(code);
      // when toggling, adjust OR-group disables
      applyOrGroupDisabling();
      updateEligible();
    });

    const codeSpan = document.createElement('span');
    codeSpan.className = 'course-code';
    codeSpan.textContent = code;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'course-name';
    nameSpan.textContent = `${c.name} (${c.credits} cr)`;

    const infoBtn = document.createElement('button');
    infoBtn.className = 'info';
    infoBtn.textContent = 'Info';
    infoBtn.addEventListener('click', () => showDetails(code));

    row.appendChild(checkbox);
    row.appendChild(codeSpan);
    row.appendChild(nameSpan);
    row.appendChild(infoBtn);

    // notes (small)
    if (c.notes) {
      const note = document.createElement('div');
      note.className = 'note';
      note.textContent = c.notes;
      row.appendChild(note);
    }

    list.appendChild(row);
  }
  applyOrGroupDisabling();
  updateEligible();
}

function showDetails(code) {
  const det = document.getElementById('details');
  const c = courses[code];
  det.innerHTML = `<strong>${code} — ${c.name} (${c.credits} cr)</strong>
  <div class="details-note">${c.notes || 'No notes available.'}</div>
  <div style="margin-top:8px"><strong>Prereqs (AND):</strong> ${c.prereqs && c.prereqs.length ? c.prereqs.join(', ') : 'None listed'}</div>
  <div><strong>Prereqs (OR groups):</strong> ${c.prereqs_or && c.prereqs_or.length ? c.prereqs_or.map(g=>'(' + g.join(' OR ') + ')').join(' AND ') : 'None listed'}</div>`;
}

/* Check whether a course's prerequisites are met.
   - 'prereqs' is treated as AND: all must be in taken set.
   - 'prereqs_or' is array of OR groups: each OR group must have at least one taken course.
*/
function prereqsMet(code) {
  const c = courses[code];
  if (!c) return false;
  // if already taken, it's not eligible (we hide taken courses)
  if (taken.has(code)) return false;

  // AND prereqs
  if (c.prereqs && c.prereqs.length) {
    for (const p of c.prereqs) {
      if (!taken.has(p)) return false;
    }
  }

  // OR groups
  if (c.prereqs_or && c.prereqs_or.length) {
    for (const orGroup of c.prereqs_or) {
      // orGroup may be an array of codes, require at least one taken
      let any = false;
      for (const alt of orGroup) {
        if (taken.has(alt)) { any = true; break; }
      }
      if (!any) return false; // this OR group is not satisfied
    }
  }

  // if no prereqs listed, assume eligible (catalog should be consulted)
  return true;
}

function updateEligible() {
  const out = document.getElementById('eligible');
  out.innerHTML = '';
  let found = false;
  for (const code of Object.keys(courses).sort()) {
    const c = courses[code];
    if (prereqsMet(code)) {
      found = true;
      const div = document.createElement('div');
      div.innerHTML = `<span class="course-code">${code}</span><span class="course-name">${c.name} (${c.credits} cr)</span>`;
      div.addEventListener('click', ()=>showDetails(code));
      out.appendChild(div);
    }
  }
  if (!found) out.innerHTML = '<div class="note">No eligible courses found — mark some prerequisites as taken.</div>';
}

/* OR-group disabling: when a course that is part of an OR-group is selected as 'taken',
   disable the other alternatives to prevent selecting both alternatives (per assignment req).
*/
function applyOrGroupDisabling() {
  // clear all disabled first
  for (const code of Object.keys(courses)) {
    const cb = document.getElementById('chk_' + code);
    if (cb) { cb.disabled = false; cb.parentElement.classList.remove('disabled'); }
  }

  for (const group of OR_GROUPS) {
    // if any in group is taken -> disable the others that are not taken
    const hit = group.find(c => taken.has(c));
    if (hit) {
      for (const code of group) {
        if (code === hit) continue;
        const cb = document.getElementById('chk_' + code);
        if (cb) {
          cb.disabled = true;
          cb.parentElement.classList.add('disabled');
        }
      }
    }
  }

  // also remove eligible if course already taken (handled by prereqsMet)
}

/* Initialize */
document.addEventListener('DOMContentLoaded', () => {
  buildUI();
});
