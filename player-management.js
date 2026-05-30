// ═══════════════════════════════════════════════════════
//  PLAYER MANAGEMENT - ADD, EDIT, DELETE
// ═══════════════════════════════════════════════════════

/**
 * Add a new player to the system
 * @param {Object} playerData - Player information {name, pos, trainerId, geboortejaar}
 */
function addSpeler(playerData) {
  // Validation
  if (!playerData.name || playerData.name.trim() === '') {
    showToast('Naam is verplicht');
    return false;
  }
  if (!playerData.pos || playerData.pos.trim() === '') {
    showToast('Positie is verplicht');
    return false;
  }
  if (!playerData.geboortejaar || playerData.geboortejaar < 1980 || playerData.geboortejaar > new Date().getFullYear()) {
    showToast('Geboortejaar ongeldig');
    return false;
  }

  // Create new player object
  const newPlayer = {
    id: nextId(DATA.spelers),
    name: playerData.name.trim(),
    pos: playerData.pos.trim(),
    trainerId: playerData.trainerId || null,
    status: 'actief',
    doelen: 0,
    aanwezig: 0,
    blessure: null,
    geboortejaar: parseInt(playerData.geboortejaar),
  };

  // Add to data
  DATA.spelers.push(newPlayer);
  showToast(`${newPlayer.name} toegevoegd`);
  closeModal();
  renderPage();
  return true;
}

/**
 * Delete a player from the system
 * @param {number} id - Player ID
 */
function deleteSpeler(id) {
  const speler = DATA.spelers.find(p => p.id === id);
  if (!speler) {
    showToast('Speler niet gevonden');
    return false;
  }

  // Show confirmation dialog
  if (!confirm(`Weet je zeker dat je ${speler.name} wilt verwijderen? Dit kan niet ongedaan gemaakt worden.`)) {
    return false;
  }

  // Remove player from data
  DATA.spelers = DATA.spelers.filter(p => p.id !== id);
  
  // Clean up related data
  cleanupPlayerReferences(id);
  
  showToast(`${speler.name} verwijderd`);
  renderPage();
  return true;
}

/**
 * Update an existing player's information
 * @param {number} id - Player ID
 * @param {Object} updates - Fields to update
 */
function updateSpeler(id, updates) {
  const speler = DATA.spelers.find(p => p.id === id);
  if (!speler) {
    showToast('Speler niet gevonden');
    return false;
  }

  // Validation
  if (updates.name && updates.name.trim() === '') {
    showToast('Naam kan niet leeg zijn');
    return false;
  }
  if (updates.pos && updates.pos.trim() === '') {
    showToast('Positie kan niet leeg zijn');
    return false;
  }

  // Apply updates
  Object.assign(speler, updates);
  showToast(`${speler.name} bijgewerkt`);
  closeModal();
  renderPage();
  return true;
}

/**
 * Bulk delete multiple players
 * @param {Array<number>} ids - Array of player IDs to delete
 */
function bulkDeleteSpelers(ids) {
  if (!ids || ids.length === 0) {
    showToast('Geen spelers geselecteerd');
    return false;
  }

  const playerNames = ids.map(id => {
    const p = DATA.spelers.find(pl => pl.id === id);
    return p ? p.name : '';
  }).filter(n => n);

  if (!confirm(`Weet je zeker dat je ${ids.length} speler(s) wilt verwijderen?\n\n${playerNames.join(', ')}`)) {
    return false;
  }

  ids.forEach(id => {
    DATA.spelers = DATA.spelers.filter(p => p.id !== id);
    cleanupPlayerReferences(id);
  });

  showToast(`${ids.length} speler(s) verwijderd`);
  renderPage();
  return true;
}

/**
 * Clean up all references to a deleted player
 * @param {number} playerId - ID of deleted player
 */
function cleanupPlayerReferences(playerId) {
  // Remove from trainings
  DATA.trainingen.forEach(t => {
    t.spelers = t.spelers.filter(s => s !== playerId);
  });

  // Remove from logs
  DATA.logs = DATA.logs.filter(l => l.speler !== playerId);

  // Remove from messages
  DATA.berichten = DATA.berichten.filter(b => 
    b.van !== playerId && b.aan !== playerId
  );

  // Remove from chat history
  delete chatMessages[playerId];
}

/**
 * Render the Add Player modal
 */
function renderAddSpelerModal() {
  const positions = ['Aanvaller', 'Middenvelder', 'Verdediger', 'Keeper'];
  const currentYear = new Date().getFullYear();
  
  return `
    <label>Voornaam *</label>
    <input type="text" id="speler-name" placeholder="Bijv. Tom Jansen">
    
    <label>Positie *</label>
    <select id="speler-pos">
      <option value="">Kies een positie...</option>
      ${positions.map(p => `<option value="${p}">${p}</option>`).join('')}
    </select>
    
    <label>Geboortejaar *</label>
    <input type="number" id="speler-geboortejaar" placeholder="Bijv. 2001" 
           min="1980" max="${currentYear}">
    
    <label>Trainer</label>
    <select id="speler-trainer">
      <option value="">Geen trainer (ontkoppeld)</option>
      ${DATA.trainers.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
    </select>
  `;
}

/**
 * Render the Edit Player modal
 */
function renderEditSpelerModal(speler) {
  const positions = ['Aanvaller', 'Middenvelder', 'Verdediger', 'Keeper'];
  const currentYear = new Date().getFullYear();
  
  return `
    <label>Voornaam *</label>
    <input type="text" id="speler-name" placeholder="Bijv. Tom Jansen" value="${speler.name}">
    
    <label>Positie *</label>
    <select id="speler-pos">
      <option value="">Kies een positie...</option>
      ${positions.map(p => 
        `<option value="${p}" ${p === speler.pos ? 'selected' : ''}>${p}</option>`
      ).join('')}
    </select>
    
    <label>Geboortejaar *</label>
    <input type="number" id="speler-geboortejaar" placeholder="Bijv. 2001" 
           value="${speler.geboortejaar}" min="1980" max="${currentYear}">
    
    <label>Status</label>
    <select id="speler-status">
      <option value="actief" ${speler.status === 'actief' ? 'selected' : ''}>Actief</option>
      <option value="aandacht" ${speler.status === 'aandacht' ? 'selected' : ''}>Aandacht</option>
      <option value="geblesseerd" ${speler.status === 'geblesseerd' ? 'selected' : ''}>Geblesseerd</option>
    </select>
    
    <label>Trainer</label>
    <select id="speler-trainer">
      <option value="">Geen trainer (ontkoppeld)</option>
      ${DATA.trainers.map(t => 
        `<option value="${t.id}" ${t.id === speler.trainerId ? 'selected' : ''}>${t.name}</option>`
      ).join('')}
    </select>
    
    <label>Doelen behaald (%)</label>
    <input type="number" id="speler-doelen" value="${speler.doelen}" min="0" max="100">
    
    <label>Aanwezigheid (%)</label>
    <input type="number" id="speler-aanwezig" value="${speler.aanwezig}" min="0" max="100">
  `;
}

/**
 * Submit add player form
 */
function submitAddSpeler() {
  const name = document.getElementById('speler-name')?.value;
  const pos = document.getElementById('speler-pos')?.value;
  const geboortejaar = document.getElementById('speler-geboortejaar')?.value;
  const trainerId = document.getElementById('speler-trainer')?.value;

  const playerData = {
    name,
    pos,
    geboortejaar,
    trainerId: trainerId ? parseInt(trainerId) : null,
  };

  addSpeler(playerData);
}

/**
 * Submit edit player form
 */
function submitEditSpeler(spelerId) {
  const name = document.getElementById('speler-name')?.value;
  const pos = document.getElementById('speler-pos')?.value;
  const geboortejaar = document.getElementById('speler-geboortejaar')?.value;
  const status = document.getElementById('speler-status')?.value;
  const trainerId = document.getElementById('speler-trainer')?.value;
  const doelen = document.getElementById('speler-doelen')?.value;
  const aanwezig = document.getElementById('speler-aanwezig')?.value;

  const updates = {
    name,
    pos,
    geboortejaar: parseInt(geboortejaar),
    status,
    trainerId: trainerId ? parseInt(trainerId) : null,
    doelen: parseInt(doelen),
    aanwezig: parseInt(aanwezig),
  };

  updateSpeler(spelerId, updates);
}

/**
 * Open add player modal
 */
function openAddSpelerModal() {
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalSubmit = document.getElementById('modal-submit');

  modalTitle.textContent = 'Speler toevoegen';
  modalBody.innerHTML = renderAddSpelerModal();
  modalSubmit.textContent = 'Toevoegen';
  modalSubmit.onclick = submitAddSpeler;

  document.getElementById('modal-overlay').classList.add('open');
}

/**
 * Open edit player modal
 */
function openEditSpelerModal(spelerId) {
  const speler = DATA.spelers.find(p => p.id === spelerId);
  if (!speler) {
    showToast('Speler niet gevonden');
    return;
  }

  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalSubmit = document.getElementById('modal-submit');

  modalTitle.textContent = `${speler.name} bewerken`;
  modalBody.innerHTML = renderEditSpelerModal(speler);
  modalSubmit.textContent = 'Opslaan';
  modalSubmit.onclick = () => submitEditSpeler(spelerId);

  document.getElementById('modal-overlay').classList.add('open');
}

// Export functions for use in main HTML
window.addSpeler = addSpeler;
window.deleteSpeler = deleteSpeler;
window.updateSpeler = updateSpeler;
window.bulkDeleteSpelers = bulkDeleteSpelers;
window.openAddSpelerModal = openAddSpelerModal;
window.openEditSpelerModal = openEditSpelerModal;
