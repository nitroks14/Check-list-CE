document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('uuid')) {
        const uuid = crypto.randomUUID();
        localStorage.setItem('uuid', uuid);
    }

    const technicianName = localStorage.getItem('technicianName');
    if (!technicianName) {
        document.getElementById('technician-info').classList.remove('hidden');
    } else {
        document.getElementById('checklist-section').classList.remove('hidden');
        loadMachines();
    }

    window.addEventListener('beforeunload', saveChecklistState);
});

function saveTechnicianInfo() {
    const name = document.getElementById('technician-name').value;
    if (name) {
        localStorage.setItem('technicianName', name);
        document.getElementById('technician-info').classList.add('hidden');
        document.getElementById('checklist-section').classList.remove('hidden');
        loadMachines();
    }
}

function loadMachines() {
    fetch('data/machines.json')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('machine-select');
            select.innerHTML = '';
            data.machines.forEach(machine => {
                const option = document.createElement('option');
                option.value = machine.id;
                option.textContent = machine.name;
                select.appendChild(option);
            });
            loadChecklist();
        });
}

function loadChecklist() {
    const machineId = document.getElementById('machine-select').value;
    fetch('data/machines.json')
        .then(response => response.json())
        .then(data => {
            const machine = data.machines.find(m => m.id === machineId);
            const container = document.getElementById('checklist-container');
            container.innerHTML = '';
            if (machine) {
                machine.checklist.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'checklist-item';
                    div.innerHTML = `<input type="checkbox" id="${item.id}" ${getChecklistState(item.id) ? 'checked' : ''} onchange="saveChecklistState()">
                                     <img src="icons/${item.icon}" alt="">
                                     <label for="${item.id}">${item.label}</label>`;
                    container.appendChild(div);
                });
            }
        });
}
