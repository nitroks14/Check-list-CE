// Gestion de la checklist interactive
const checklist = [
    { item: "Vérification visuelle", status: "" },
    { item: "Test de fonctionnement", status: "" },
    { item: "Nettoyage", status: "" }
];

function renderChecklist() {
    const container = document.getElementById("checklist");
    container.innerHTML = "";
    checklist.forEach((entry, index) => {
        const div = document.createElement("div");
        div.innerHTML = `${entry.item} <select onchange="updateStatus(${index}, this.value)">
            <option value="">--</option>
            <option value="✅">✅</option>
            <option value="⚠️">⚠️</option>
            <option value="❌">❌</option>
        </select>`;
        container.appendChild(div);
    });
}

function updateStatus(index, value) {
    checklist[index].status = value;
    saveReport();
}

function saveReport() {
    const report = checklist.map(e => `${e.item}: ${e.status}`).join("\n");
    localStorage.setItem("fsm_report", report);
    document.getElementById("report").innerText = report;
}

window.onload = () => {
    renderChecklist();
    document.getElementById("report").innerText = localStorage.getItem("fsm_report") || "";
};