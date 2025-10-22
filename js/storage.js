function saveChecklistState() {
    const checkboxes = document.querySelectorAll('.checklist-item input[type=checkbox]');
    const state = {};
    checkboxes.forEach(cb => {
        state[cb.id] = cb.checked;
    });
    localStorage.setItem('checklistState', JSON.stringify(state));
}

function getChecklistState(id) {
    const state = JSON.parse(localStorage.getItem('checklistState') || '{}');
    return state[id] || false;
}
