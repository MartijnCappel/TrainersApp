// ═══════════════════════════════════════════════════════
//  TRAINING MANAGEMENT - ADD, EDIT, DELETE, RECURRING
// ═══════════════════════════════════════════════════════

/**
 * Add a new training session
 * @param {Object} trainingData - Training details
 */
function addTraining(trainingData) {
  // Validation
  if (!trainingData.naam || trainingData.naam.trim() === '') {
    showToast('Trainingsnaam is verplicht');
    return false;
  }
  if (!trainingData.type || trainingData.type === '') {
    showToast('Trainingstype is verplicht');
    return false;
  }
  if (!trainingData.datum || trainingData.datum === '') {
    showToast('Datum is verplicht');
    return false;
  }
  if (!trainingData.tijd || trainingData.tijd === '') {
    showToast('Tijd is verplicht');
    return false;
  }
  if (!trainingData.duur || trainingData.duur < 15) {
    showToast('Duur moet minimaal 15 minuten zijn');
    return false;
  }

  // Create new training
  const newTraining = {
    id: nextId(DATA.trainingen),
    datum: trainingData.datum,
    naam: trainingData.naam.trim(),
    type: trainingData.type,
    trainer: parseInt(trainingData.trainer) || null,
    spelers: trainingData.spelers || [],
    tijd: trainingData.tijd,
    duur: parseInt(trainingData.duur),
    notities: trainingData.notities || '',
    herhaald: trainingData.herhaald || false,
    herhalingsDag: trainingData.herhalingsDag || null,
    herhalingsEindDatum: trainingData.herhalingsEindDatum || null,
  };

  DATA.trainingen.push(newTraining);

  // Handle recurring trainings
  if (newTraining.herhaald && newTraining.herhalingsDag) {
    createRecurringTrainings(newTraining);
  }

  showToast(`${newTraining.naam} toegevoegd`);
  closeModal();
  renderPage();
  return true;
}

/**
 * Create recurring training sessions
 * @param {Object} baseTraining - Base training to repeat
 */
function createRecurringTrainings(baseTraining) {
  const startDate = new Date(baseTraining.datum);
  const endDate = baseTraining.herhalingsEindDatum 
    ? new Date(baseTraining.herhalingsEindDatum) 
    : new Date(startDate.getTime() + 12 * 7 * 24 * 60 * 60 * 1000); // Default 12 weeks

  let currentDate = new Date(startDate);
  const dayOfWeek = baseTraining.herhalingsDag; // 0=Monday, 1=Tuesday, etc.

  while (currentDate <= endDate) {
    if (currentDate.getDay() === (dayOfWeek + 1) % 7) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const recurringTraining = {
        id: nextId(DATA.trainingen),
        datum: dateStr,
        naam: baseTraining.naam,
        type: baseTraining.type,
        trainer: baseTraining.trainer,
        spelers: [...baseTraining.spelers],
        tijd: baseTraining.tijd,
        duur: baseTraining.duur,
        notities: baseTraining.notities,
        herhaald: false,
        parentId: baseTraining.id,
      };

      DATA.trainingen.push(recurringTraining);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
}

/**
 * Update an existing training
 * @param {number} id - Training ID
 * @param {Object} updates - Fields to update
 */
function updateTraining(id, updates) {
  const training = DATA.trainingen.find(t => t.id === id);
  if (!training) {
    showToast('Training niet gevonden');
    return false;
  }

  // Validation
  if (updates.naam && updates.naam.trim() === '') {
    showToast('Trainingsnaam kan niet leeg zijn');
    return false;
  }

  Object.assign(training, updates);
  showToast(`${training.naam} bijgewerkt`);
  closeModal();
  renderPage();
  return true;
}

/**
 * Delete a training session
 * @param {number} id - Training ID
 */
function deleteTraining(id) {
  const training = DATA.trainingen.find(t => t.id === id);
  if (!training) {
    showToast('Training niet gevonden');
    return false;
  }

  if (!confirm(`Weet je zeker dat je '${training.naam}' wilt verwijderen?`)) {
    return false;
  }

  // Remove training
  DATA.traininen = DATA.trainingen.filter(t => t.id !== id);
  
  // Remove related recurring trainings if parent
  if (training.herhaald) {
    DATA.trainingen = DATA.trainingen.filter(t => t.parentId !== id);
  }

  showToast(`${training.naam} verwijderd`);
  renderPage();
  return true;
}

/**
 * Render the Add Training modal
 */
function renderAddTrainingModal() {
  const today = new Date().toISOString().split('T')[0];
  const trainingTypes = [
    { id: 'conditie', label: 'Conditie', icon: '🏃' },
    { id: 'kracht', label: 'Kracht', icon: '💪' },
    { id: 'tactiek', label: 'Tactiek', icon: '📋' },
    { id: 'herstel', label: 'Herstel', icon: '🧘' },
    { id: 'positie', label: 'Positie', icon: '⚽' },
    { id: 'wedstrijd', label: 'Wedstrijd', icon: '🎯' },
  ];

  const days = [
    { id: 0, label: 'Maandag' },
    { id: 1, label: 'Dinsdag' },
    { id: 2, label: 'Woensdag' },
    { id: 3, label: 'Donderdag' },
    { id: 4, label: 'Vrijdag' },
    { id: 5, label: 'Zaterdag' },
    { id: 6, label: 'Zondag' },
  ];

  return `
    <label>Trainingsnaam *</label>
    <input type="text" id="training-naam" placeholder="Bijv. Conditietraining A1">
    
    <label>Type *</label>
    <select id="training-type">
      <option value="">Kies een type...</option>
      ${trainingTypes.map(t => `<option value="${t.id}">${t.icon} ${t.label}</option>`).join('')}
    </select>
    
    <label>Datum *</label>
    <input type="date" id="training-datum" value="${today}">
    
    <label>Tijd *</label>
    <input type="time" id="training-tijd" value="19:00">
    
    <label>Duur (minuten) *</label>
    <input type="number" id="training-duur" value="90" min="15" step="15">
    
    <label>Trainer</label>
    <select id="training-trainer">
      <option value="">Geen trainer</option>
      ${DATA.trainers.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
    </select>
    
    <label>Notities</label>
    <textarea id="training-notities" placeholder="Opmerkingen..."></textarea>
    
    <label style="display:flex; align-items:center; margin-top:16px; gap:8px;">
      <input type="checkbox" id="training-herhaald" onchange="toggleRecurringFields()">
      <span>Elke week herhalen</span>
    </label>
    
    <div id="recurring-fields" style="display:none; background:var(--surface2); padding:12px; border-radius:var(--radius); margin-top:12px;">
      <label>Herhaald op dag *</label>
      <select id="training-dag">
        ${days.map(d => `<option value="${d.id}">${d.label}</option>`).join('')}
      </select>
      
      <label>Tot en met (optioneel)</label>
      <input type="date" id="training-eind-datum">
      <div style="font-size:11px; color:var(--text3); margin-top:4px;">
        Bij geen einddatum: 12 weken herhalen
      </div>
    </div>
  `;
}

/**
 * Render the Edit Training modal
 */
function renderEditTrainingModal(training) {
  const trainingTypes = [
    { id: 'conditie', label: 'Conditie' },
    { id: 'kracht', label: 'Kracht' },
    { id: 'tactiek', label: 'Tactiek' },
    { id: 'herstel', label: 'Herstel' },
    { id: 'positie', label: 'Positie' },
    { id: 'wedstrijd', label: 'Wedstrijd' },
  ];

  return `
    <label>Trainingsnaam *</label>
    <input type="text" id="training-naam" value="${training.naam}">
    
    <label>Type *</label>
    <select id="training-type">
      ${trainingTypes.map(t => 
        `<option value="${t.id}" ${t.id === training.type ? 'selected' : ''}>${t.label}</option>`
      ).join('')}
    </select>
    
    <label>Datum *</label>
    <input type="date" id="training-datum" value="${training.datum}">
    
    <label>Tijd *</label>
    <input type="time" id="training-tijd" value="${training.tijd}">
    
    <label>Duur (minuten) *</label>
    <input type="number" id="training-duur" value="${training.duur}" min="15" step="15">
    
    <label>Trainer</label>
    <select id="training-trainer">
      <option value="">Geen trainer</option>
      ${DATA.trainers.map(t => 
        `<option value="${t.id}" ${t.id === training.trainer ? 'selected' : ''}>${t.name}</option>`
      ).join('')}
    </select>
    
    <label>Notities</label>
    <textarea id="training-notities">${training.notities}</textarea>
    
    <label>Deelnemende spelers</label>
    <div style="border:1px solid var(--border); border-radius:var(--radius); padding:8px; max-height:200px; overflow-y:auto;">
      ${DATA.spelers.map(s => `
        <label style="display:flex; align-items:center; gap:8px; padding:4px 0;">
          <input type="checkbox" class="training-speler-checkbox" value="${s.id}" 
            ${training.spelers.includes(s.id) ? 'checked' : ''}>
          <span>${s.name}</span>
        </label>
      `).join('')}
    </div>
  `;
}

/**
 * Toggle recurring fields visibility
 */
function toggleRecurringFields() {
  const checkbox = document.getElementById('training-herhaald');
  const recurringFields = document.getElementById('recurring-fields');
  if (checkbox.checked) {
    recurringFields.style.display = 'block';
  } else {
    recurringFields.style.display = 'none';
  }
}

/**
 * Submit add training form
 */
function submitAddTraining() {
  const naam = document.getElementById('training-naam')?.value;
  const type = document.getElementById('training-type')?.value;
  const datum = document.getElementById('training-datum')?.value;
  const tijd = document.getElementById('training-tijd')?.value;
  const duur = document.getElementById('training-duur')?.value;
  const trainer = document.getElementById('training-trainer')?.value;
  const notities = document.getElementById('training-notities')?.value;
  const herhaald = document.getElementById('training-herhaald')?.checked;
  const herhalingsDag = document.getElementById('training-dag')?.value;
  const herhalingsEindDatum = document.getElementById('training-eind-datum')?.value;

  const trainingData = {
    naam,
    type,
    datum,
    tijd,
    duur,
    trainer: trainer || null,
    notities,
    herhaald,
    herhalingsDag: herhaald ? parseInt(herhalingsDag) : null,
    herhalingsEindDatum: herhaald && herhalingsEindDatum ? herhalingsEindDatum : null,
    spelers: [],
  };

  addTraining(trainingData);
}

/**
 * Submit edit training form
 */
function submitEditTraining(trainingId) {
  const naam = document.getElementById('training-naam')?.value;
  const type = document.getElementById('training-type')?.value;
  const datum = document.getElementById('training-datum')?.value;
  const tijd = document.getElementById('training-tijd')?.value;
  const duur = document.getElementById('training-duur')?.value;
  const trainer = document.getElementById('training-trainer')?.value;
  const notities = document.getElementById('training-notities')?.value;

  const spelers = [];
  document.querySelectorAll('.training-speler-checkbox:checked').forEach(checkbox => {
    spelers.push(parseInt(checkbox.value));
  });

  const updates = {
    naam,
    type,
    datum,
    tijd,
    duur: parseInt(duur),
    trainer: trainer ? parseInt(trainer) : null,
    notities,
    spelers,
  };

  updateTraining(trainingId, updates);
}

/**
 * Open add training modal
 */
function openAddTrainingModal() {
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalSubmit = document.getElementById('modal-submit');

  modalTitle.textContent = 'Training plannen';
  modalBody.innerHTML = renderAddTrainingModal();
  modalSubmit.textContent = 'Plannen';
  modalSubmit.onclick = submitAddTraining;

  document.getElementById('modal-overlay').classList.add('open');
}

/**
 * Open edit training modal
 */
function openEditTrainingModal(trainingId) {
  const training = DATA.trainingen.find(t => t.id === trainingId);
  if (!training) {
    showToast('Training niet gevonden');
    return;
  }

  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalSubmit = document.getElementById('modal-submit');

  modalTitle.textContent = `${training.naam} bewerken`;
  modalBody.innerHTML = renderEditTrainingModal(training);
  modalSubmit.textContent = 'Opslaan';
  modalSubmit.onclick = () => submitEditTraining(trainingId);

  document.getElementById('modal-overlay').classList.add('open');
}

// Export functions
window.addTraining = addTraining;
window.updateTraining = updateTraining;
window.deleteTraining = deleteTraining;
window.openAddTrainingModal = openAddTrainingModal;
window.openEditTrainingModal = openEditTrainingModal;
window.toggleRecurringFields = toggleRecurringFields;
