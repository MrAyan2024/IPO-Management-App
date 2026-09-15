// --- DATA MANAGEMENT ---
let members = JSON.parse(localStorage.getItem('ipo_members')) || [];
let ipos = JSON.parse(localStorage.getItem('ipo_data')) || [];
let myChart;

function saveData() {
    localStorage.setItem('ipo_members', JSON.stringify(members));
    localStorage.setItem('ipo_data', JSON.stringify(ipos));
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    renderAll();
    initChart();
});

function renderAll() {
    renderMemberDropdown();
    renderMemberList();
    renderIpoTable();
    updateChart();
    renderSummary();
}

// --- MEMBERS LOGIC ---
document.getElementById('addMemberForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('newMemberName').value.trim();
    if (name && !members.find(m => m.name === name)) {
        members.push({ id: Date.now(), name });
        saveData();
        renderAll();
        document.getElementById('newMemberName').value = '';
    }
});

function renderMemberList() {
    const list = document.getElementById('memberList');
    list.innerHTML = members.map(m => `
        <li class="list-group-item d-flex justify-content-between align-items-center">
            ${m.name}
            <div>
                <button class="btn btn-sm btn-outline-primary" onclick="openEditMember(${m.id})">Edit</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteMember(${m.id})">Delete</button>
            </div>
        </li>
    `).join('') || '<p class="text-muted">No members added yet.</p>';
}

function openEditMember(id) {
    const member = members.find(m => m.id === id);
    document.getElementById('editMemberId').value = id;
    document.getElementById('editMemberName').value = member.name;
    new bootstrap.Modal(document.getElementById('editMemberModal')).show();
}

document.getElementById('editMemberForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('editMemberId').value);
    const newName = document.getElementById('editMemberName').value.trim();
    const member = members.find(m => m.id === id);
    if (member && newName) {
        member.name = newName;
        saveData();
        renderAll();
        bootstrap.Modal.getInstance(document.getElementById('editMemberModal')).hide();
    }
});

function deleteMember(id) {
    if (confirm('Delete this member?')) {
        members = members.filter(m => m.id !== id);
        saveData();
        renderAll();
    }
}

function renderMemberDropdown() {
    const select = document.getElementById('ipoAppliedBy');
    select.innerHTML = '<option value="">-- Select Member --</option>' + 
        members.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
}

// --- IPO LOGIC ---
document.getElementById('addIpoForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const newIpo = {
        id: Date.now(),
        name: document.getElementById('ipoName').value,
        first_date: document.getElementById('ipoFirstDate').value,
        last_date: document.getElementById('ipoLastDate').value,
        refund_date: document.getElementById('ipoRefundDate').value,
        price: parseFloat(document.getElementById('ipoPrice').value) || 0,
        gm_price: parseInt(document.getElementById('ipoGm').value) || 0,
        rating: parseInt(document.getElementById('ipoRating').value) || 0,
        applied: document.getElementById('ipoApplied').checked,
        applied_by: document.getElementById('ipoAppliedBy').value
    };
    ipos.push(newIpo);
    saveData();
    renderAll();
    bootstrap.Modal.getInstance(document.getElementById('addIpoModal')).hide();
    e.target.reset();
});

function renderIpoTable() {
    const tbody = document.getElementById('ipoTableBody');
    tbody.innerHTML = ipos.map(ipo => `
        <tr>
            <td>${ipo.name}</td>
            <td>${ipo.first_date}</td>
            <td>${ipo.last_date}</td>
            <td>${ipo.refund_date}</td>
            <td>${ipo.price}</td>
            <td>${ipo.gm_price}</td>
            <td>${ipo.rating}</td>
            <td>${ipo.applied ? 'Yes' : 'No'}</td>
            <td>${ipo.applied_by}</td>
            <td><button class="btn btn-sm btn-danger" onclick="deleteIpo(${ipo.id})">Del</button></td>
        </tr>
    `).join('');
}

function deleteIpo(id) {
    if (confirm('Delete this IPO?')) {
        ipos = ipos.filter(i => i.id !== id);
        saveData();
        renderAll();
    }
}

// --- CHART LOGIC ---
function initChart() {
    const ctx = document.getElementById('ipoChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: [], datasets: [{ label: 'Total Combined Price', data: [], backgroundColor: 'rgba(54, 162, 235, 0.6)' }] },
        options: { scales: { y: { beginAtZero: true } } }
    });
}

function updateChart() {
    // Get unique Last Dates and sort them
    const lastDates = [...new Set(ipos.map(i => i.last_date).filter(d => d))].sort();
    
    const data = lastDates.map(targetDate => {
        // Sum prices where Last Date <= Target Date < Refund Date
        return ipos.reduce((sum, ipo) => {
            if (ipo.last_date && ipo.refund_date) {
                if (ipo.last_date <= targetDate && ipo.refund_date > targetDate) {
                    return sum + ipo.price;
                }
            }
            return sum;
        }, 0);
    });

    myChart.data.labels = lastDates;
    myChart.data.datasets[0].data = data;
    myChart.update();
}

// --- SUMMARY LOGIC ---
function renderSummary() {
    const container = document.getElementById('summaryContainer');
    const appliedIpos = ipos.filter(i => i.applied);
    
    // Group by applicant, then by last_date
    const summary = {};
    appliedIpos.forEach(ipo => {
        if (!ipo.applied_by || !ipo.last_date) return;
        if (!summary[ipo.applied_by]) summary[ipo.applied_by] = {};
        if (!summary[ipo.applied_by][ipo.last_date]) summary[ipo.applied_by][ipo.last_date] = 0;
        summary[ipo.applied_by][ipo.last_date] += ipo.price;
    });

    let html = '';
    for (const [applicant, dates] of Object.entries(summary)) {
        html += `<div class="card mb-3"><div class="card-header bg-success text-white"><strong>${applicant}</strong></div><div class="card-body"><table class="table table-sm"><thead><tr><th>Last Date</th><th>Total Price</th></tr></thead><tbody>`;
        for (const [date, total] of Object.entries(dates)) {
            html += `<tr><td>${date}</td><td>${total}</td></tr>`;
        }
        html += `</tbody></table></div></div>`;
    }
    container.innerHTML = html || '<p class="text-muted">No applied IPOs found.</p>';
}
