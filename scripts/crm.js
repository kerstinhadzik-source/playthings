/**
 * Smoke Show CRM — Core JavaScript
 * Contact management, pipeline, marketing tools
 * Data layer: Supabase (primary) with localStorage fallback
 */

import { createClient } from '@supabase/supabase-js';

// ══════════════════════════════════════════════════════════════
// SUPABASE CLIENT
// ══════════════════════════════════════════════════════════════

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;
let useSupabase = false;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  useSupabase = true;
  console.log('CRM: Supabase connected');
} else {
  console.warn('CRM: Supabase not configured — using localStorage');
}

// ══════════════════════════════════════════════════════════════
// DATA LAYER — Supabase primary, localStorage cache/fallback
// ══════════════════════════════════════════════════════════════

const STORAGE_KEY = 'smokeshow_crm';

const STAGES = {
  lead: { label: 'Lead', color: '#3b82f6' },
  contacted: { label: 'Contacted', color: '#06b6d4' },
  demo: { label: 'Demo Scheduled', color: '#a855f7' },
  trial: { label: 'Trial', color: '#f59e0b' },
  active: { label: 'Active Subscriber', color: '#22c55e' },
  churned: { label: 'Churned', color: '#ef4444' }
};

const TIER_VALUES = {
  starter: 199,
  standard: 349,
  premium: 499
};

const TIER_LABELS = {
  starter: 'Starter',
  standard: 'Standard',
  premium: 'Premium'
};

// In-memory cache — always the source of truth for the UI
let _cache = { contacts: [], activities: [] };

function loadData() {
  return _cache;
}

function saveData(data) {
  _cache = data;
  // Always write to localStorage as cache
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded — non-critical */ }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Supabase sync helpers ──

async function supabaseLoadAll() {
  if (!useSupabase) return null;
  try {
    const [contactsRes, activitiesRes] = await Promise.all([
      supabase.from('crm_contacts').select('*').order('created_at', { ascending: false }),
      supabase.from('crm_activities').select('*').order('timestamp', { ascending: true })
    ]);

    if (contactsRes.error) throw contactsRes.error;
    if (activitiesRes.error) throw activitiesRes.error;

    // Map Supabase snake_case → camelCase
    const contacts = (contactsRes.data || []).map(mapContactFromDb);
    const activities = (activitiesRes.data || []).map(mapActivityFromDb);

    return { contacts, activities };
  } catch (err) {
    console.error('CRM: Supabase load failed, falling back to localStorage', err);
    return null;
  }
}

async function supabaseUpsertContact(contact) {
  if (!useSupabase) return;
  try {
    const row = mapContactToDb(contact);
    const { error } = await supabase.from('crm_contacts').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  } catch (err) {
    console.error('CRM: Failed to sync contact to Supabase', err);
  }
}

async function supabaseDeleteContact(id) {
  if (!useSupabase) return;
  try {
    await Promise.all([
      supabase.from('crm_contacts').delete().eq('id', id),
      supabase.from('crm_activities').delete().eq('contact_id', id)
    ]);
  } catch (err) {
    console.error('CRM: Failed to delete contact from Supabase', err);
  }
}

async function supabaseInsertActivity(activity) {
  if (!useSupabase) return;
  try {
    const row = mapActivityToDb(activity);
    const { error } = await supabase.from('crm_activities').insert(row);
    if (error) throw error;
  } catch (err) {
    console.error('CRM: Failed to sync activity to Supabase', err);
  }
}

async function supabaseBulkInsert(contacts, activities) {
  if (!useSupabase) return;
  try {
    const contactRows = contacts.map(mapContactToDb);
    const activityRows = activities.map(mapActivityToDb);
    await Promise.all([
      supabase.from('crm_contacts').upsert(contactRows, { onConflict: 'id' }),
      supabase.from('crm_activities').insert(activityRows)
    ]);
  } catch (err) {
    console.error('CRM: Bulk insert to Supabase failed', err);
  }
}

// ── Supabase field mapping (camelCase ↔ snake_case) ──

function mapContactFromDb(row) {
  return {
    id: row.id,
    shopName: row.shop_name || '',
    contactName: row.contact_name || '',
    email: row.email || '',
    phone: row.phone || '',
    city: row.city || '',
    source: row.source || 'website',
    stage: row.stage || 'lead',
    tier: row.tier || '',
    followup: row.followup || '',
    notes: row.notes || [],
    createdAt: row.created_at || '',
    lastContact: row.last_contact || ''
  };
}

function mapContactToDb(c) {
  return {
    id: c.id,
    shop_name: c.shopName || '',
    contact_name: c.contactName || '',
    email: c.email || '',
    phone: c.phone || '',
    city: c.city || '',
    source: c.source || 'website',
    stage: c.stage || 'lead',
    tier: c.tier || '',
    followup: c.followup || '',
    notes: c.notes || [],
    created_at: c.createdAt || new Date().toISOString(),
    last_contact: c.lastContact || ''
  };
}

function mapActivityFromDb(row) {
  return {
    id: row.id,
    contactId: row.contact_id || '',
    text: row.text || '',
    type: row.type || '',
    timestamp: row.timestamp || ''
  };
}

function mapActivityToDb(a) {
  return {
    id: a.id,
    contact_id: a.contactId || '',
    text: a.text || '',
    type: a.type || '',
    timestamp: a.timestamp || new Date().toISOString()
  };
}

// ── Load data on startup ──

async function initDataLayer() {
  // 1. Load from localStorage first (instant UI)
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) _cache = JSON.parse(raw);
  } catch { /* ignore */ }

  // 2. If Supabase is available, pull cloud data (authoritative)
  if (useSupabase) {
    const cloudData = await supabaseLoadAll();
    if (cloudData && (cloudData.contacts.length > 0 || cloudData.activities.length > 0)) {
      _cache = cloudData;
      saveData(_cache); // Update localStorage cache
      console.log(`CRM: Loaded ${cloudData.contacts.length} contacts from Supabase`);
    } else if (cloudData && _cache.contacts.length > 0) {
      // Cloud is empty but localStorage has data — push to cloud
      console.log('CRM: Pushing localStorage data to Supabase...');
      await supabaseBulkInsert(_cache.contacts, _cache.activities);
    }
  }
}

// Import any signups from the Smoke Show website form
function importWebsiteSignups() {
  try {
    const raw = localStorage.getItem('smokeshow_signups');
    if (!raw) return;
    const signups = JSON.parse(raw);
    if (!signups.length) return;

    const data = loadData();
    let imported = 0;
    const newContacts = [];
    const newActivities = [];

    signups.forEach(signup => {
      // Check for duplicates by email
      const exists = data.contacts.some(c =>
        c.email && signup.email && c.email.toLowerCase() === signup.email.toLowerCase()
      );
      if (exists) return;

      const contact = {
        id: generateId(),
        shopName: signup.shopName || '',
        contactName: signup.contactName || '',
        email: signup.email || '',
        phone: signup.phone || '',
        city: signup.city || '',
        source: 'website',
        stage: 'lead',
        tier: signup.tier || '',
        followup: '',
        notes: [],
        createdAt: signup.timestamp || new Date().toISOString(),
        lastContact: signup.timestamp || new Date().toISOString()
      };

      data.contacts.push(contact);
      newContacts.push(contact);

      const activity = {
        id: generateId(),
        contactId: contact.id,
        text: `${signup.shopName || 'New contact'} signed up via website`,
        type: 'signup',
        timestamp: signup.timestamp || new Date().toISOString()
      };

      data.activities.push(activity);
      newActivities.push(activity);

      imported++;
    });

    if (imported > 0) {
      saveData(data);
      localStorage.removeItem('smokeshow_signups');
      // Sync new imports to Supabase
      supabaseBulkInsert(newContacts, newActivities);
      showToast(`Imported ${imported} signup(s) from website`, 'success');
    }
  } catch (e) {
    console.error('Import error:', e);
  }
}

// ══════════════════════════════════════════════════════════════
// VIEW NAVIGATION
// ══════════════════════════════════════════════════════════════

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.view');

  function switchView(viewId) {
    views.forEach(v => v.classList.remove('active'));
    navItems.forEach(n => n.classList.remove('active'));

    document.getElementById(`view-${viewId}`)?.classList.add('active');
    document.querySelector(`.nav-item[data-view="${viewId}"]`)?.classList.add('active');

    // Refresh view data
    if (viewId === 'dashboard') renderDashboard();
    if (viewId === 'contacts') renderContacts();
    if (viewId === 'pipeline') renderPipeline();

    // Close mobile sidebar
    document.getElementById('sidebar')?.classList.remove('open');
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => switchView(item.dataset.view));
  });

  // Mobile menu
  document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });

  // Close sidebar on backdrop click (mobile)
  document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('menuToggle');
    if (sidebar?.classList.contains('open') && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════

function renderDashboard() {
  const data = loadData();
  const contacts = data.contacts;

  // Stats
  document.getElementById('statTotal').textContent = contacts.length;
  document.getElementById('statActive').textContent = contacts.filter(c => c.stage === 'active').length;

  const pipelineValue = contacts
    .filter(c => c.stage !== 'churned' && c.tier)
    .reduce((sum, c) => sum + (TIER_VALUES[c.tier] || 0), 0);
  document.getElementById('statPipeline').textContent = `$${pipelineValue.toLocaleString()}`;

  const today = new Date().toISOString().split('T')[0];
  const followups = contacts.filter(c => c.followup && c.followup <= today).length;
  document.getElementById('statFollowups').textContent = followups;

  // Pipeline bars
  const barsEl = document.getElementById('pipelineBars');
  const maxCount = Math.max(1, ...Object.keys(STAGES).map(s => contacts.filter(c => c.stage === s).length));

  barsEl.innerHTML = Object.entries(STAGES).map(([key, stage]) => {
    const count = contacts.filter(c => c.stage === key).length;
    const pct = (count / maxCount) * 100;
    return `
      <div class="pipe-bar">
        <span class="pipe-bar__label">${stage.label}</span>
        <div class="pipe-bar__track">
          <div class="pipe-bar__fill" style="width: ${pct}%; background: ${stage.color}"></div>
        </div>
        <span class="pipe-bar__count">${count}</span>
      </div>
    `;
  }).join('');

  // Recent activity
  const feedEl = document.getElementById('activityFeed');
  const activities = (data.activities || []).slice(-10).reverse();
  if (activities.length) {
    feedEl.innerHTML = activities.map(a => `
      <div class="activity-item">
        <span class="activity-dot" style="background: ${a.type === 'signup' ? '#22c55e' : a.type === 'stage' ? '#a855f7' : '#3b82f6'}"></span>
        <div>
          <div class="activity-text">${escapeHtml(a.text)}</div>
          <div class="activity-time">${timeAgo(a.timestamp)}</div>
        </div>
      </div>
    `).join('');
  } else {
    feedEl.innerHTML = '<p class="empty-state">No activity yet. Add your first contact to get started.</p>';
  }

  // Follow-ups
  const followupEl = document.getElementById('followupList');
  const upcoming = contacts
    .filter(c => c.followup)
    .sort((a, b) => a.followup.localeCompare(b.followup))
    .slice(0, 8);

  if (upcoming.length) {
    followupEl.innerHTML = upcoming.map(c => {
      const isOverdue = c.followup < today;
      const isToday = c.followup === today;
      const cls = isOverdue ? 'overdue' : isToday ? 'today' : 'upcoming';
      const label = isOverdue ? 'Overdue' : isToday ? 'Today' : formatDate(c.followup);
      return `
        <div class="followup-item" data-id="${c.id}">
          <div>
            <div class="followup-shop">${escapeHtml(c.shopName)}</div>
            <div class="followup-contact">${escapeHtml(c.contactName)}</div>
          </div>
          <span class="followup-date followup-date--${cls}">${label}</span>
        </div>
      `;
    }).join('');

    followupEl.querySelectorAll('.followup-item').forEach(el => {
      el.addEventListener('click', () => openContactModal(el.dataset.id));
    });
  } else {
    followupEl.innerHTML = '<p class="empty-state">No follow-ups scheduled.</p>';
  }
}

// ══════════════════════════════════════════════════════════════
// CONTACTS TABLE
// ══════════════════════════════════════════════════════════════

let currentSort = { field: 'createdAt', dir: 'desc' };

function renderContacts() {
  const data = loadData();
  let contacts = [...data.contacts];

  // Filter by search
  const search = document.getElementById('contactSearch')?.value.toLowerCase() || '';
  if (search) {
    contacts = contacts.filter(c =>
      c.shopName.toLowerCase().includes(search) ||
      c.contactName.toLowerCase().includes(search) ||
      c.city.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search)
    );
  }

  // Filter by stage
  const stageFilter = document.getElementById('stageFilter')?.value || '';
  if (stageFilter) {
    contacts = contacts.filter(c => c.stage === stageFilter);
  }

  // Sort
  contacts.sort((a, b) => {
    const va = (a[currentSort.field] || '').toString().toLowerCase();
    const vb = (b[currentSort.field] || '').toString().toLowerCase();
    const cmp = va.localeCompare(vb);
    return currentSort.dir === 'asc' ? cmp : -cmp;
  });

  // Update count
  document.getElementById('contactCount').textContent = `${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`;

  // Render table
  const tbody = document.getElementById('contactsBody');
  const emptyEl = document.getElementById('emptyContacts');
  const table = document.getElementById('contactsTable');

  if (!contacts.length) {
    tbody.innerHTML = '';
    table.style.display = 'none';
    emptyEl.classList.add('visible');
    return;
  }

  table.style.display = '';
  emptyEl.classList.remove('visible');

  tbody.innerHTML = contacts.map(c => `
    <tr data-id="${c.id}">
      <td><span class="contact-shop">${escapeHtml(c.shopName)}</span></td>
      <td>${escapeHtml(c.contactName)}</td>
      <td>${escapeHtml(c.city)}</td>
      <td><span class="stage-badge stage-badge--${c.stage}">${STAGES[c.stage]?.label || c.stage}</span></td>
      <td><span class="tier-badge">${c.tier ? TIER_LABELS[c.tier] || c.tier : '—'}</span></td>
      <td>${c.lastContact ? formatDate(c.lastContact.split('T')[0]) : '—'}</td>
      <td><button class="action-btn" data-id="${c.id}">Edit</button></td>
    </tr>
  `).join('');

  // Row click → edit
  tbody.querySelectorAll('tr').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.action-btn')) return;
      openContactModal(row.dataset.id);
    });
  });

  tbody.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openContactModal(btn.dataset.id);
    });
  });
}

function initContactFilters() {
  document.getElementById('contactSearch')?.addEventListener('input', debounce(renderContacts, 200));
  document.getElementById('stageFilter')?.addEventListener('change', renderContacts);

  // Sort headers
  document.querySelectorAll('.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (currentSort.field === field) {
        currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort = { field, dir: 'asc' };
      }
      renderContacts();
    });
  });
}

// ══════════════════════════════════════════════════════════════
// PIPELINE BOARD
// ══════════════════════════════════════════════════════════════

function renderPipeline() {
  const data = loadData();

  Object.keys(STAGES).forEach(stage => {
    if (stage === 'churned') return; // Skip churned in kanban
    const container = document.querySelector(`[data-stage-cards="${stage}"]`);
    const countEl = document.querySelector(`[data-stage-count="${stage}"]`);
    if (!container) return;

    const contacts = data.contacts.filter(c => c.stage === stage);
    countEl.textContent = contacts.length;

    container.innerHTML = contacts.map(c => `
      <div class="pipe-card" data-id="${c.id}">
        <div class="pipe-card__shop">${escapeHtml(c.shopName)}</div>
        <div class="pipe-card__name">${escapeHtml(c.contactName)}</div>
        <div class="pipe-card__meta">
          <span class="pipe-card__city">${escapeHtml(c.city)}</span>
          ${c.tier ? `<span class="pipe-card__tier">${TIER_LABELS[c.tier] || ''}</span>` : ''}
        </div>
      </div>
    `).join('') || '<p class="empty-state" style="padding:1rem;font-size:0.75rem;">No contacts</p>';

    container.querySelectorAll('.pipe-card').forEach(card => {
      card.addEventListener('click', () => openContactModal(card.dataset.id));
    });
  });
}

// ══════════════════════════════════════════════════════════════
// CONTACT MODAL — Add / Edit / Delete
// ══════════════════════════════════════════════════════════════

function openContactModal(contactId = null) {
  const modal = document.getElementById('contactModal');
  const form = document.getElementById('contactForm');
  const title = document.getElementById('modalTitle');
  const deleteBtn = document.getElementById('deleteContact');
  const notesHistory = document.getElementById('notesHistory');

  // Reset form
  form.reset();
  document.getElementById('contactId').value = '';

  if (contactId) {
    const data = loadData();
    const contact = data.contacts.find(c => c.id === contactId);
    if (!contact) return;

    title.textContent = 'Edit Contact';
    deleteBtn.style.display = '';
    notesHistory.style.display = '';

    document.getElementById('contactId').value = contact.id;
    document.getElementById('shopName').value = contact.shopName || '';
    document.getElementById('contactName').value = contact.contactName || '';
    document.getElementById('email').value = contact.email || '';
    document.getElementById('phone').value = contact.phone || '';
    document.getElementById('city').value = contact.city || '';
    document.getElementById('source').value = contact.source || 'website';
    document.getElementById('stage').value = contact.stage || 'lead';
    document.getElementById('tier').value = contact.tier || '';
    document.getElementById('followup').value = contact.followup || '';
    document.getElementById('notes').value = '';

    // Render notes history
    renderNotes(contact);
  } else {
    title.textContent = 'Add Contact';
    deleteBtn.style.display = 'none';
    notesHistory.style.display = 'none';
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  setTimeout(() => document.getElementById('shopName').focus(), 100);
}

function closeModal() {
  const modal = document.getElementById('contactModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function saveContact(e) {
  e.preventDefault();

  const id = document.getElementById('contactId').value;
  const data = loadData();

  const contactData = {
    shopName: document.getElementById('shopName').value.trim(),
    contactName: document.getElementById('contactName').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    city: document.getElementById('city').value.trim(),
    source: document.getElementById('source').value,
    stage: document.getElementById('stage').value,
    tier: document.getElementById('tier').value,
    followup: document.getElementById('followup').value,
    lastContact: new Date().toISOString()
  };

  const noteText = document.getElementById('notes').value.trim();
  const newActivities = [];

  if (id) {
    // Update existing
    const idx = data.contacts.findIndex(c => c.id === id);
    if (idx === -1) return;

    const oldStage = data.contacts[idx].stage;
    data.contacts[idx] = { ...data.contacts[idx], ...contactData };

    // Track stage change
    if (oldStage !== contactData.stage) {
      const activity = {
        id: generateId(),
        contactId: id,
        text: `${contactData.shopName} moved to ${STAGES[contactData.stage]?.label}`,
        type: 'stage',
        timestamp: new Date().toISOString()
      };
      data.activities.push(activity);
      newActivities.push(activity);
    }

    // Add note if provided
    if (noteText) {
      data.contacts[idx].notes = data.contacts[idx].notes || [];
      data.contacts[idx].notes.push({
        text: noteText,
        timestamp: new Date().toISOString()
      });
      const activity = {
        id: generateId(),
        contactId: id,
        text: `Note added to ${contactData.shopName}: "${noteText.slice(0, 50)}${noteText.length > 50 ? '...' : ''}"`,
        type: 'note',
        timestamp: new Date().toISOString()
      };
      data.activities.push(activity);
      newActivities.push(activity);
    }

    // Sync to Supabase (background)
    supabaseUpsertContact(data.contacts[idx]);
    newActivities.forEach(a => supabaseInsertActivity(a));

    showToast(`${contactData.shopName} updated`, 'success');
  } else {
    // Create new
    const newContact = {
      id: generateId(),
      ...contactData,
      notes: noteText ? [{ text: noteText, timestamp: new Date().toISOString() }] : [],
      createdAt: new Date().toISOString()
    };
    data.contacts.push(newContact);

    const activity = {
      id: generateId(),
      contactId: newContact.id,
      text: `${contactData.shopName} added as ${STAGES[contactData.stage]?.label}`,
      type: 'create',
      timestamp: new Date().toISOString()
    };
    data.activities.push(activity);

    // Sync to Supabase (background)
    supabaseUpsertContact(newContact);
    supabaseInsertActivity(activity);

    showToast(`${contactData.shopName} added`, 'success');
  }

  saveData(data);
  closeModal();
  refreshAllViews();
}

function deleteContact() {
  const id = document.getElementById('contactId').value;
  if (!id) return;

  const data = loadData();
  const contact = data.contacts.find(c => c.id === id);
  if (!contact) return;

  if (!confirm(`Delete ${contact.shopName}? This cannot be undone.`)) return;

  data.contacts = data.contacts.filter(c => c.id !== id);
  data.activities = data.activities.filter(a => a.contactId !== id);

  saveData(data);

  // Sync deletion to Supabase (background)
  supabaseDeleteContact(id);

  closeModal();
  refreshAllViews();
  showToast(`${contact.shopName} deleted`, 'success');
}

function renderNotes(contact) {
  const list = document.getElementById('notesList');
  const notes = (contact.notes || []).slice().reverse();

  if (notes.length) {
    list.innerHTML = notes.map(n => `
      <div class="note-item">
        <div class="note-text">${escapeHtml(n.text)}</div>
        <div class="note-time">${formatDateTime(n.timestamp)}</div>
      </div>
    `).join('');
  } else {
    list.innerHTML = '<p class="empty-state" style="padding:0.5rem;">No notes yet</p>';
  }
}

function addQuickNote() {
  const input = document.getElementById('newNote');
  const text = input.value.trim();
  const id = document.getElementById('contactId').value;
  if (!text || !id) return;

  const data = loadData();
  const contact = data.contacts.find(c => c.id === id);
  if (!contact) return;

  contact.notes = contact.notes || [];
  contact.notes.push({ text, timestamp: new Date().toISOString() });
  contact.lastContact = new Date().toISOString();

  const activity = {
    id: generateId(),
    contactId: id,
    text: `Note on ${contact.shopName}: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`,
    type: 'note',
    timestamp: new Date().toISOString()
  };
  data.activities.push(activity);

  saveData(data);

  // Sync to Supabase (background)
  supabaseUpsertContact(contact);
  supabaseInsertActivity(activity);

  renderNotes(contact);
  input.value = '';
  showToast('Note added', 'success');
}

function initModal() {
  document.getElementById('contactForm')?.addEventListener('submit', saveContact);
  document.getElementById('modalBackdrop')?.addEventListener('click', closeModal);
  document.getElementById('modalClose')?.addEventListener('click', closeModal);
  document.getElementById('cancelBtn')?.addEventListener('click', closeModal);
  document.getElementById('deleteContact')?.addEventListener('click', deleteContact);
  document.getElementById('addContactBtn')?.addEventListener('click', () => openContactModal());
  document.getElementById('addFirstContact')?.addEventListener('click', () => openContactModal());
  document.getElementById('addNoteBtn')?.addEventListener('click', addQuickNote);

  document.getElementById('newNote')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addQuickNote(); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

// ══════════════════════════════════════════════════════════════
// MARKETING — Template Actions
// ══════════════════════════════════════════════════════════════

const TEMPLATES = {
  'cold-intro': {
    subject: 'New revenue stream for [SHOP] — zero risk',
    body: `Hi [NAME],

I noticed [SHOP] and think your customers would love our new product line.

Smoke Show is a "Business in a Box" for smoke shops — we ship a free display case pre-loaded with high-margin impulse products (think couples gifts, novelty items, accessories). Your customers buy them, you keep 50%+ profit on every sale.

Here's how it works:
• FREE display case — we ship it to you
• Products retail $9.99–$14.99 — perfect impulse buys
• We auto-refill monthly — you never have to reorder
• Cancel anytime — zero risk, zero commitment

Our shops are averaging $125–$280/month in pure profit from a 2-foot counter display.

Would you be open to a quick 5-minute chat this week? I'd love to show you the display.

Best,
[YOUR NAME]
Smoke Show`
  },
  'follow-up': {
    subject: 'Quick follow-up — Smoke Show for [SHOP]',
    body: `Hey [NAME],

Just circling back on Smoke Show. Our shops are seeing 50%+ margins on every unit and the display literally sells itself — customers can't resist the impulse price points.

Quick recap:
• FREE display case
• $199/mo gets you 25 products + auto-refill
• ~$125/mo profit to you
• Cancel anytime

Worth a 5-minute look? I can send over some photos of the display in action.

[YOUR NAME]`
  },
  'demo-invite': {
    subject: 'Let me show you Smoke Show — 10 min',
    body: `[NAME],

I'd love to show you the Smoke Show display in action. It takes about 10 minutes and I think you'll see right away why shops are adding this to their counter.

Can we set up a quick call this week? I'm flexible on timing.

Pick a time that works:
• [DAY 1] at [TIME]
• [DAY 2] at [TIME]
• Or tell me what works for you

[YOUR NAME]`
  },
  'trial-offer': {
    subject: 'Try Smoke Show risk-free at [SHOP]',
    body: `[NAME],

Ready to try Smoke Show risk-free? Here's what I'd like to do:

1. Ship you a FREE display case pre-loaded with our best-selling products
2. You put it on your counter — takes 5 minutes
3. Your customers buy, you profit

If it doesn't sell, I'll come pick it up. No charge, no hassle, no commitment.

Our Starter tier is $199/mo and most shops are clearing $125+ in profit. That's basically free money from counter space that's probably empty right now.

Ready to go? Just reply "yes" and I'll get your display shipped this week.

[YOUR NAME]`
  },
  'trade-show': {
    subject: 'Great meeting you at [EVENT]!',
    body: `Hey [NAME],

Great meeting you at [EVENT]! As we discussed, Smoke Show is a zero-risk way to add a new revenue stream to [SHOP].

Quick refresher:
• FREE display case — beautiful neon-pink branding that catches eyes
• 25-60 products/month depending on tier
• 50%+ margins on everything
• Monthly auto-refill — set it and forget it

I'd love to get a display to you before [NEXT MONTH]. Want to set up a quick call to lock in your spot?

[YOUR NAME]`
  },
  'reactivation': {
    subject: 'New products at Smoke Show — [SHOP] would love these',
    body: `Hey [NAME],

We've added some hot new products to the Smoke Show lineup and I immediately thought of [SHOP].

New additions:
• Couples play kits (flying off shelves)
• New candle sets (perfect gift impulse)
• Valentine's/seasonal themed items

We've also upgraded the display case design — it's even more eye-catching now.

Would you be open to giving it another shot? I can send a fresh display with the new inventory at no charge.

[YOUR NAME]`
  },
  'sms-intro': {
    subject: '',
    body: `Hey [NAME]! This is [YOUR NAME] from Smoke Show. We help smoke shops add a new revenue category with zero risk — free display, 50%+ margins. Got 2 min to chat?`
  },
  'sms-followup': {
    subject: '',
    body: `Hey [NAME], circling back on Smoke Show for [SHOP]. Our starter tier is $199/mo and shops are clearing $125+ profit. Want me to send over the details?`
  }
};

function initMarketing() {
  document.querySelectorAll('[data-action="copy-template"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.template-card');
      const key = card?.dataset.template;
      const template = TEMPLATES[key];
      if (!template) return;

      const text = template.subject
        ? `Subject: ${template.subject}\n\n${template.body}`
        : template.body;

      navigator.clipboard.writeText(text).then(() => {
        showToast('Template copied to clipboard', 'success');
      }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Template copied', 'success');
      });
    });
  });

  document.querySelectorAll('[data-action="use-template"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.template-card');
      const key = card?.dataset.template;
      const template = TEMPLATES[key];
      if (!template) return;

      // Open a new contact modal with the template stage pre-selected
      const stageMap = {
        'cold-intro': 'lead',
        'follow-up': 'contacted',
        'demo-invite': 'demo',
        'trial-offer': 'trial',
        'trade-show': 'lead',
        'reactivation': 'churned'
      };

      openContactModal();
      setTimeout(() => {
        document.getElementById('stage').value = stageMap[key] || 'lead';
        document.getElementById('notes').value = `[Template: ${card.querySelector('h3')?.textContent}] `;
        document.getElementById('notes').focus();
      }, 150);
    });
  });
}

// ══════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function timeAgo(isoStr) {
  if (!isoStr) return '';
  const now = Date.now();
  const then = new Date(isoStr).getTime();
  const diff = (now - then) / 1000;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(isoStr.split('T')[0]);
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function refreshAllViews() {
  const active = document.querySelector('.view.active');
  if (active?.id === 'view-dashboard') renderDashboard();
  if (active?.id === 'view-contacts') renderContacts();
  if (active?.id === 'view-pipeline') renderPipeline();
}

// ══════════════════════════════════════════════════════════════
// SEED DATA — test contacts for demo
// ══════════════════════════════════════════════════════════════

async function seedRealContacts() {
  const data = loadData();
  if (data.contacts.length > 0) return; // Don't overwrite existing data

  const now = new Date().toISOString();
  const shops = [
    // ── Los Angeles ──
    { shopName: 'Broadway Smoke Shop & Accessories', phone: '', city: 'Los Angeles, CA', note: '624 S Broadway. 201 reviews, great selection. High foot traffic downtown location.' },
    { shopName: 'Smoke World Tobacco', phone: '', city: 'Los Angeles, CA', note: '2245 Westwood Blvd. 4.6 stars, 87 reviews. Open 8am-11pm daily. Near UCLA campus.' },
    { shopName: 'A2Z Smoke Shop', phone: '', city: 'Los Angeles, CA', note: '213 Vermont Ave. 68 reviews. Good neighborhood shop.' },
    { shopName: 'Stogz Smoke Shop', phone: '', city: 'Los Angeles, CA', note: 'Found on Google Maps search. Established LA shop.' },
    // ── San Diego ──
    { shopName: '365 Reloaded', phone: '(858) 352-6300', city: 'San Diego, CA', note: '1020 Garnet Avenue, Pacific Beach. Has lounge area, open 8am-midnight. Lifestyle vibe — great fit for Smoke Show display.' },
    { shopName: 'Smoking Section', phone: '(858) 397-2610', city: 'San Diego, CA', note: '2 locations: Mira Mesa + Miramar. Operating since 2011. Established multi-location operator.' },
    { shopName: 'Bladez Smoke Shop', phone: '(619) 564-6853', city: 'San Diego, CA', note: '6563 El Cajon Blvd near SDSU. Premium glass, hookah, vape. College area = impulse buy goldmine.' },
    { shopName: 'Funky Monkey Smoke Shop', phone: '(858) 272-8653', city: 'San Diego, CA', note: '1346 Garnet Ave, Pacific Beach. "SD\'s Premier Glass Emporium." Open 11am-9pm daily.' },
    // ── San Francisco ──
    { shopName: 'Ashbury Tobacco Center', phone: '', city: 'San Francisco, CA', note: '1524 Haight Street. Iconic Haight-Ashbury location. High tourist traffic.' },
    { shopName: 'Cole Street Smoke Shop', phone: '', city: 'San Francisco, CA', note: '610 Cole Street. Cigars, hookah, vaping. Neighborhood staple.' },
    // ── Miami ──
    { shopName: 'My Habibi Smoke Shop', phone: '', city: 'Miami, FL', note: 'Winner: Best Smoke/Vape Shop 2025 — Miami New Times Readers\' Choice. Top target.' },
    { shopName: 'Safe House Smoke Shop', phone: '', city: 'Miami, FL', note: 'Winner: Best Smoke/Vape Shop 2024 — Miami New Times. Back-to-back award winner area.' },
    { shopName: 'Brickell Smoke Shop', phone: '', city: 'Miami, FL', note: 'Downtown Brickell location. Cigars, hookah, premium e-liquids. Upscale neighborhood.' },
    { shopName: 'Smoke Shop Top Shelf', phone: '', city: 'Miami, FL', note: '7840 SW 24th St. 4.1 stars, 14 reviews. Open 10am-9pm daily.' },
    // ── Tampa ──
    { shopName: 'Daddys Smoke Shop', phone: '', city: 'Tampa, FL', note: '4311 W Waters Ave Unit 202. Open 9:30am-10pm. Great reviews for customer service.' },
    { shopName: 'Ali Baba Smoke Shop', phone: '', city: 'Tampa, FL', note: '5335 Gunn Hwy. Open 10am-11pm. Highly rated for quality and service.' },
    // ── Texas ──
    { shopName: 'Smoke ATX', phone: '', city: 'Austin, TX', note: 'Austin\'s premier smoke shop. Online + retail. Glass, concentrates, vapes, hemp. Accepts crypto.' },
    { shopName: 'The Glass House TX — Oak Lawn', phone: '(469) 372-2000', city: 'Dallas, TX', note: 'Wycliff Ave location. Part of 5-location DFW chain. Multi-location operator = big opportunity.' },
    { shopName: 'The Glass House TX — McKinney', phone: '(214) 856-3110', city: 'McKinney, TX', note: 'Part of 5-location chain. Can pitch group deal for all locations.' },
    { shopName: 'Bahama Mama — FM 1960', phone: '(832) 213-6986', city: 'Houston, TX', note: '12341 FM-1960 Suite B. Part of 100+ location national chain. Big fish — start with one location.' },
    // ── Atlanta ──
    { shopName: 'Cloud 9 Smoke & Vape Co.', phone: '', city: 'Atlanta, GA', note: '70+ locations nationwide. Multiple GA locations: Atlanta, Roswell, Buckhead, Marietta. Massive chain — approach corporate.' },
    // ── Nashville ──
    { shopName: 'Hup Smoke Shop & Tobacco', phone: '(629) 202-8930', city: 'Nashville, TN', note: '6303 Robertson Ave. New shop (est. 2025). Vapes, cigars, hookah, tobacco.' },
    { shopName: 'Planet 615 Smoke Shop', phone: '(615) 964-7590', city: 'Nashville, TN', note: 'Great customer service reputation. Nashville market.' },
    // ── Charlotte ──
    { shopName: 'Vapor Smoke Shop', phone: '', city: 'Charlotte, NC', note: '1627 Sardis Road North #4b. #1 Vape Store in Charlotte. Award-winning. Free parking.' },
    // ── Las Vegas ──
    { shopName: 'Las Vegas Smoke Shops', phone: '', city: 'Las Vegas, NV', note: 'Family-owned, 7 locations throughout Vegas. Open 7 days 9am-8pm. Multi-location operator.' },
    { shopName: 'Premium Smoke and Vape', phone: '', city: 'Las Vegas, NV', note: '7720 S Las Vegas Blvd Suite 200. Near UNLV + Strip. Open late nights. High impulse traffic.' },
    { shopName: 'Smoke City Vegas', phone: '', city: 'Las Vegas, NV', note: 'Vegas premier vape & smoke shop. Full product range.' },
    // ── Pacific Northwest ──
    { shopName: 'Piece of Mind', phone: '', city: 'Seattle, WA', note: '113 Blanchard St. 5.0 rating — highest in Seattle. Downtown location.' },
    { shopName: 'Holy Smoke', phone: '', city: 'Seattle, WA', note: '1556 E Olive Way. 4.0 rating. Local favorite in Capitol Hill.' },
    { shopName: 'Mary Jane\'s House of Glass', phone: '', city: 'Portland, OR', note: '1425 NW 23rd Ave, NW Portland. Trendy neighborhood, glass-focused.' },
    // ── New York ──
    { shopName: 'New York Smoke Shop', phone: '', city: 'New York, NY', note: 'Open 24/7. 40+ cigar varieties, pipes, vaporizers. Manhattan location. Never-closing = max exposure.' },
  ];

  const contacts = shops.map(s => ({
    id: generateId(),
    shopName: s.shopName,
    contactName: '',
    email: '',
    phone: s.phone || '',
    city: s.city,
    source: 'cold-outreach',
    stage: 'lead',
    tier: '',
    followup: '',
    notes: s.note ? [{ text: s.note, timestamp: now }] : [],
    createdAt: now,
    lastContact: ''
  }));

  const activities = contacts.map(c => ({
    id: generateId(),
    contactId: c.id,
    text: `${c.shopName} (${c.city}) added as Lead`,
    type: 'create',
    timestamp: now
  }));

  saveData({ contacts, activities });

  // Sync seed data to Supabase
  await supabaseBulkInsert(contacts, activities);

  showToast(`Loaded ${contacts.length} real smoke shop contacts`, 'success');
}

// ══════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════

async function init() {
  // Initialize data layer (Supabase + localStorage)
  await initDataLayer();

  importWebsiteSignups();
  await seedRealContacts();

  initNavigation();
  initContactFilters();
  initModal();
  initMarketing();
  renderDashboard();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
