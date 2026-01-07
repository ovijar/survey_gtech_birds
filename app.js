// Main Application Logic
let speciesData = [];
let selectedSpecies = [];
let timerInterval = null;
let timeRemaining = CONFIG.TIMER_DURATION_MS;
let timerStarted = false;

// DOM Elements
const elements = {
    form: document.getElementById('surveyForm'),
    speciesInput: document.getElementById('speciesInput'),
    speciesSuggestions: document.getElementById('speciesSuggestions'),
    speciesChips: document.getElementById('speciesChips'),
    speciesHidden: document.getElementById('species'),
    addSpeciesBtn: document.getElementById('addSpeciesBtn'),
    submitBtn: document.getElementById('submitBtn'),
    resetBtn: document.getElementById('resetBtn'),
    timerDisplay: document.getElementById('timerDisplay'),
    statusIndicator: document.getElementById('statusIndicator'),
    statusText: document.getElementById('statusText'),
    pendingCount: document.getElementById('pendingCount')
};

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadSpeciesData();
    setupEventListeners();
    updateOnlineStatus();
    await SyncManager.updatePendingCount();

    if (CONFIG.FEATURES.AUTO_START_TIMER) {
        startTimer();
    }

    // Set current date as default
    const now = new Date();
    document.getElementById('day').value = now.getDate();
    document.getElementById('month').value = now.getMonth() + 1;
    document.getElementById('year').value = now.getFullYear();
    document.getElementById('startTime').value = now.toTimeString().slice(0, 5);
});

// ============================================
// Species Data Loading
// ============================================
async function loadSpeciesData() {
    try {
        const response = await fetch('./species.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        speciesData = await response.json();
        console.log(`Loaded ${speciesData.length} species from JSON file`);
    } catch (error) {
        console.warn('Failed to fetch species.json, attempting fallback from embedded data:', error);
        if (Array.isArray(window.speciesData)) {
            speciesData = window.speciesData;
            console.log(`Loaded ${speciesData.length} species from embedded data`);
        } else {
            console.error('No species data available');
            speciesData = [];
        }
    }
}

// ============================================
// Event Listeners Setup
// ============================================
function setupEventListeners() {
    // Species autocomplete
    elements.speciesInput.addEventListener('input', handleSpeciesInput);
    elements.speciesInput.addEventListener('keydown', handleSpeciesKeydown);
    elements.addSpeciesBtn.addEventListener('click', addCurrentSpecies);

    // Form submission
    elements.form.addEventListener('submit', handleFormSubmit);
    // Reset the whole form (page 1) and clear observations
    function resetForm() {
        // Clear page 1 inputs
        document.getElementById('pcLocationId').value = '';
        document.getElementById('day').value = '';
        document.getElementById('month').value = '';
        document.getElementById('year').value = '';
        document.getElementById('startTime').value = '';
        document.getElementById('observer').value = '';

        // Clear species selection
        selectedSpecies = [];
        renderSpeciesChips();
        updateSpeciesHiddenInput();

        // Clear observation fields
        elements.distanceInput.value = '';
        elements.directionsInput.value = '';
        elements.detailsInput.value = '';
        elements.notesInput.value = '';

        // Clear observations list
        observations = [];
        renderObservations();
        elements.observationsHidden.value = '';

        // Return to page 1 view
        goToPage1();
    }

    // -------------------------------------------
    // Observation handling (species + extra data)
    // -------------------------------------------
    let observations = [];

    function addObservation() {
        const speciesName = elements.speciesInput.value.trim();
        // Try to find the species object based on input name
        const species = speciesData.find(s => s.common_name === speciesName || s.scientific_name === speciesName);

        if (!species) {
            alert('Please search and select a valid species');
            return;
        }

        const observation = {
            speciesId: species.id,
            speciesName: species.common_name, // Store name for easier display
            distance: elements.distanceInput.value.trim(),
            directions: elements.directionsInput.value.trim(),
            details: elements.detailsInput.value.trim(),
            notes: elements.notesInput.value.trim()
        };

        observations.push(observation);
        renderObservations();

        // Clear fields for next entry
        elements.speciesInput.value = '';
        elements.distanceInput.value = '';
        elements.directionsInput.value = '';
        elements.detailsInput.value = '';
        elements.notesInput.value = '';

        // Update hidden input for form submission
        elements.observationsHidden.value = JSON.stringify(observations);
    }

    function renderObservations() {
        const list = elements.observationsList;
        list.innerHTML = '';
        observations.forEach((obs, idx) => {
            const item = document.createElement('div');
            item.className = 'observation-item';
            // Simple styling for readability
            item.style.border = '1px solid #ddd';
            item.style.padding = '10px';
            item.style.marginBottom = '10px';
            item.style.borderRadius = '4px';

            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <strong>${obs.speciesName}</strong>
                        <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                            ${obs.distance ? `Distance: ${obs.distance}m<br>` : ''}
                            ${obs.directions ? `Directions: ${obs.directions}<br>` : ''}
                            ${obs.details ? `Details: ${obs.details}<br>` : ''}
                            ${obs.notes ? `Notes: ${obs.notes}` : ''}
                        </div>
                    </div>
                    <div>
                        <button type="button" class="edit-observation btn btn-sm btn-secondary" style="margin-right: 5px;" data-idx="${idx}">Edit</button>
                        <button type="button" class="delete-observation btn btn-sm btn-danger" data-idx="${idx}">Delete</button>
                    </div>
                </div>
            `;
            list.appendChild(item);
        });
    }

    function editObservation(idx) {
        const obs = observations[idx];
        const species = speciesData.find(s => s.id === obs.speciesId);

        // Populate fields for editing
        elements.speciesInput.value = species ? species.common_name : '';
        elements.distanceInput.value = obs.distance;
        elements.directionsInput.value = obs.directions;
        elements.detailsInput.value = obs.details;
        elements.notesInput.value = obs.notes;

        // Remove the old entry (it will be re-added when they click Add More)
        observations.splice(idx, 1);
        renderObservations();
        elements.observationsHidden.value = JSON.stringify(observations);

        // Scroll to top of form to help user see they are editing
        elements.speciesInput.scrollIntoView({ behavior: 'smooth' });
    }

    function deleteObservation(idx) {
        if (confirm('Are you sure you want to delete this observation?')) {
            observations.splice(idx, 1);
            renderObservations();
            elements.observationsHidden.value = JSON.stringify(observations);
        }
    }

    // Hook up observation UI events (called after DOMContentLoaded)
    function setupObservationEvents() {
        elements.addMoreBtn.addEventListener('click', addObservation);
        elements.observationsList.addEventListener('click', e => {
            if (e.target.classList.contains('edit-observation')) {
                const idx = parseInt(e.target.dataset.idx);
                editObservation(idx);
            } else if (e.target.classList.contains('delete-observation')) {
                const idx = parseInt(e.target.dataset.idx);
                deleteObservation(idx);
            }
        });
    }

    // Extend existing setupEventListeners to include observation events
    const originalSetupEventListeners = setupEventListeners;
    function setupEventListeners() {
        originalSetupEventListeners();
        // Additional elements for observations (ensure they exist)
        elements.distanceInput = document.getElementById('distanceInput');
        elements.directionsInput = document.getElementById('directionsInput');
        elements.detailsInput = document.getElementById('detailsInput');
        elements.notesInput = document.getElementById('notesInput');
        elements.addMoreBtn = document.getElementById('addMoreBtn');
        elements.observationsList = document.getElementById('observationsList');
        elements.observationsHidden = document.getElementById('observationsHidden');
        setupObservationEvents();
    }

    // Online/offline detection
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Click outside to close suggestions
    document.addEventListener('click', (e) => {
        if (!elements.speciesInput.contains(e.target) && !elements.speciesSuggestions.contains(e.target)) {
            hideSuggestions();
        }
    });
}

// ============================================
// Species Autocomplete
// ============================================
function handleSpeciesInput(e) {
    const query = e.target.value.trim().toLowerCase();

    if (query.length < 2) {
        hideSuggestions();
        return;
    }

    const matches = speciesData.filter(species => {
        const commonMatch = species.common_name.toLowerCase().includes(query);
        const scientificMatch = species.scientific_name.toLowerCase().includes(query);
        return commonMatch || scientificMatch;
    }).slice(0, 10); // Limit to 10 results

    if (matches.length > 0) {
        showSuggestions(matches);
    } else {
        hideSuggestions();
    }
}

function showSuggestions(matches) {
    elements.speciesSuggestions.innerHTML = matches.map((species, index) => `
    <div class="suggestion-item" data-index="${index}" data-species-id="${species.id}">
      <span class="common-name">${species.common_name}</span>
      <span class="scientific-name">${species.scientific_name}</span>
    </div>
  `).join('');

    elements.speciesSuggestions.classList.remove('hidden');

    // Add click listeners to suggestions
    elements.speciesSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const speciesId = parseInt(item.dataset.speciesId);
            const species = speciesData.find(s => s.id === speciesId);
            if (species) {
                addSpecies(species);
            }
        });
    });
}

function hideSuggestions() {
    elements.speciesSuggestions.classList.add('hidden');
    elements.speciesSuggestions.innerHTML = '';
}

function handleSpeciesKeydown(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addCurrentSpecies();
    }
}

function addCurrentSpecies() {
    const query = elements.speciesInput.value.trim().toLowerCase();
    if (!query) return;

    // Find exact or close match
    const match = speciesData.find(species =>
        species.common_name.toLowerCase() === query ||
        species.scientific_name.toLowerCase() === query
    );

    if (match) {
        addSpecies(match);
    } else {
        // If no exact match, try first partial match
        const partialMatch = speciesData.find(species =>
            species.common_name.toLowerCase().includes(query) ||
            species.scientific_name.toLowerCase().includes(query)
        );

        if (partialMatch) {
            addSpecies(partialMatch);
        }
    }
}

function addSpecies(species) {
    // Check if already added
    if (selectedSpecies.find(s => s.id === species.id)) {
        console.log('Species already added');
        elements.speciesInput.value = '';
        hideSuggestions();
        return;
    }

    selectedSpecies.push(species);
    renderSpeciesChips();
    updateSpeciesHiddenInput();

    elements.speciesInput.value = '';
    hideSuggestions();
}

function removeSpecies(speciesId) {
    selectedSpecies = selectedSpecies.filter(s => s.id !== speciesId);
    renderSpeciesChips();
    updateSpeciesHiddenInput();
}

function renderSpeciesChips() {
    elements.speciesChips.innerHTML = selectedSpecies.map(species => `
    <div class="species-chip">
      <span>${species.common_name}</span>
      <button type="button" onclick="removeSpecies(${species.id})" title="Remove">×</button>
    </div>
  `).join('');
}

function updateSpeciesHiddenInput() {
    const speciesNames = selectedSpecies.map(s => s.common_name).join(', ');
    elements.speciesHidden.value = speciesNames;
}

// Make removeSpecies globally accessible
window.removeSpecies = removeSpecies;

// ============================================
// Timer Management
// ============================================
function startTimer() {
    if (timerStarted) return;

    timerStarted = true;
    timeRemaining = CONFIG.TIMER_DURATION_MS;

    timerInterval = setInterval(() => {
        timeRemaining -= 1000;

        if (timeRemaining <= 0) {
            timeRemaining = 0;
            stopTimer();
            handleTimerComplete();
        }

        updateTimerDisplay();
    }, 1000);

    updateTimerDisplay();
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    timerStarted = false;
    timeRemaining = CONFIG.TIMER_DURATION_MS;
    updateTimerDisplay();
    elements.timerDisplay.classList.remove('warning');
    elements.submitBtn.disabled = false;
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);

    elements.timerDisplay.textContent =
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Warning when less than 1 minute
    if (timeRemaining < 60000 && timeRemaining > 0) {
        elements.timerDisplay.classList.add('warning');
    }
}

function handleTimerComplete() {
    alert('⏰ Survey time completed! Please submit your survey or reset the timer.');
    elements.submitBtn.disabled = true;
    elements.timerDisplay.classList.add('warning');
}

// ============================================
// Form Handling
// ============================================
async function handleFormSubmit(e) {
    e.preventDefault();

    // Validate species selection
    if (selectedSpecies.length === 0) {
        alert('Please select at least one species');
        return;
    }

    try {
        // Generate record ID
        const recordId = await DB.generateRecordId();

        // Collect form data
        const formData = new FormData(elements.form);
        const surveyData = {
            record_id: recordId,
            pc_location_id: formData.get('pc_location_id'),
            day: parseInt(formData.get('day')),
            month: parseInt(formData.get('month')),
            year: parseInt(formData.get('year')),
            start_time: formData.get('start_time'),
            observer: formData.get('observer'),
            species: formData.get('species'),
            distance: formData.get('distance') || null,
            directions: formData.get('directions') || '',
            observation_details: formData.get('observation_details') || '',
            notes: formData.get('notes') || ''
        };

        // Save to IndexedDB
        await DB.saveSurvey(surveyData);
        console.log('Survey saved locally:', surveyData);

        // Update pending count
        await SyncManager.updatePendingCount();

        // Try to sync if online
        if (navigator.onLine) {
            const syncResult = await SyncManager.syncPendingSurveys();
            if (syncResult.success) {
                await SyncManager.updatePendingCount();
                alert('✅ Survey submitted and synced successfully!');
            } else {
                alert('✅ Survey saved locally. Will sync when online.');
            }
        } else {
            alert('✅ Survey saved locally. Will sync when online.');
            // Register background sync
            if (CONFIG.FEATURES.BACKGROUND_SYNC) {
                await SyncManager.registerBackgroundSync();
            }
        }

        // Reset form
        resetForm();

    } catch (error) {
        console.error('Error submitting survey:', error);
        alert('❌ Error saving survey. Please try again.');
    }
}

function resetForm() {
    elements.form.reset();
    selectedSpecies = [];
    renderSpeciesChips();
    updateSpeciesHiddenInput();
    resetTimer();

    // Reset date to current
    const now = new Date();
    document.getElementById('day').value = now.getDate();
    document.getElementById('month').value = now.getMonth() + 1;
    document.getElementById('year').value = now.getFullYear();
    document.getElementById('startTime').value = now.toTimeString().slice(0, 5);

    if (CONFIG.FEATURES.AUTO_START_TIMER) {
        startTimer();
    }

    // Go back to first page if navigation function exists
    if (typeof goToPage1 === 'function') {
        goToPage1();
    }
}

// ============================================
// Online/Offline Status
// ============================================
function updateOnlineStatus() {
    const isOnline = navigator.onLine;

    if (isOnline) {
        elements.statusIndicator.classList.remove('offline');
        elements.statusIndicator.classList.add('online');
        elements.statusText.textContent = 'Online';
    } else {
        elements.statusIndicator.classList.remove('online');
        elements.statusIndicator.classList.add('offline');
        elements.statusText.textContent = 'Offline';
    }
}

// ============================================
// Periodic Sync Check
// ============================================
setInterval(async () => {
    if (navigator.onLine) {
        const pendingCount = await DB.getPendingCount();
        if (pendingCount > 0) {
            console.log(`${pendingCount} pending surveys, attempting sync...`);
            await SyncManager.syncPendingSurveys();
            await SyncManager.updatePendingCount();
        }
    }
}, 30000); // Check every 30 seconds
