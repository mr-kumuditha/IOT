function badgeClass(risk) {
    if (risk === "SAFE") return "badge safe";
    if (risk === "WARNING") return "badge warning";
    return "badge danger";
}

function fmtTime(t) {
    return new Date(t).toLocaleTimeString();
}

function render() {
    const tbody = document.querySelector("#workersTable tbody");
    tbody.innerHTML = "";

    Object.keys(DemoDB.workers).forEach((id) => {
        const w = DemoDB.workers[id];
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${w.name} <div style="font-size:12px;opacity:.7">${id}</div></td>
      <td>${w.currentZone}</td>
      <td><span class="${badgeClass(w.riskLevel)}">${w.riskLevel}</span></td>
      <td>${fmtTime(w.lastUpdate)}</td>
    `;
        tbody.appendChild(tr);
    });

    const list = document.getElementById("incidentsList");
    list.innerHTML = "";
    DemoDB.incidents.forEach((inc) => {
        const li = document.createElement("li");
        li.style.padding = "10px";
        li.style.borderBottom = "1px solid #eee";
        li.innerHTML = `<b>${inc.type}</b> | ${inc.workerId} | ${inc.zone} | ${fmtTime(inc.time)} | ${inc.status}`;
        list.appendChild(li);
    });
}

setInterval(render, 500);
render();