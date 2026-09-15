// --- DATA MANAGEMENT ---
let members = JSON.parse(localStorage.getItem('ipo_members')) || [];
let ipos = JSON.parse(localStorage.getItem('ipo_data')) || [];
let myChart;

function saveData() {
    try {
        localStorage.setItem('ipo_members', JSON.stringify(members));
        localStorage.setItem('ipo_data', JSON.stringify(ipos));
        console.log('Data saved successfully!');
    } catch (e) {
        console.error('Error saving data:', e);
        alert('Error saving data. Please check browser console.');
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initialized');
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
    const modal = new bootstrap.Modal(document.getElementById('editMemberModal'));
    modal.show();
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
        const modal = bootstrap.Modal.getInstance(document.getElementById('editMemberModal'));
        modal.hide();
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
    const datalist = document.getElementById('members-datalist');
    if (datalist) {
        datalist.innerHTML = members.map(m => `<option value="${m.name}">`).join('');
    }
}

// --- IPO LOGIC - IMPROVED WITH DEBUGGING ---
document.getElementById('addIpoForm').addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Form submitted');
    
    try {
        const name = document.getElementById('ipoName').value.trim();
        if (!name) {
            alert("Please enter an IPO Name.");
            return;
        }

        const appliedByName = document.getElementById('ipoAppliedBy').value.trim();
        
        // Auto-add member if new
        if (appliedByName && !members.find(m => m.name === appliedByName)) {
            members.push({ id: Date.now() + 1, name: appliedByName });
            console.log('New member added:', appliedByName);
        }

        const newIpo = {
            id: Date.now(),
            name: name,
            first_date: document.getElementById('ipoFirstDate').value,
            last_date: document.getElementById('ipoLastDate').value,
            refund_date: document.getElementById('ipoRefundDate').value,
            price: parseFloat(document.getElementById('ipoPrice').value) || 0,
            gm_price: parseInt(document.getElementById('ipoGm').value) || 0,
            rating: parseInt(document.getElementById('ipoRating').value) || 0,
            applied: document.getElementById('ipoApplied').checked,
            applied_by: appliedByName
        };
        
        console.log('Adding IPO:', newIpo);
        ipos.push(newIpo);
        console.log('Total IPOs:', ipos.length);
        
        saveData();
        renderAll();
        
        // Reset form
        e.target.reset();
        
        // Close modal using Bootstrap's built-in method
        const modalEl = document.getElementById('addIpoModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
            modal.hide();
        } else {
            // Fallback: manually hide
            modalEl.classList.remove('show');
            modalEl.style.display = 'none';
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
        }
        
        alert('IPO saved successfully!');
        
    } catch (error) {
        console.error('Error saving IPO:', error);
        alert('Error: ' + error.message);
    }
});

function renderIpoTable() {
    const tbody = document.getElementById('ipoTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = ipos.map(ipo => `
        <tr>
            <td>${ipo.name}</td>
            <td>${ipo.first_date || '-'}</td>
            <td>${ipo.last_date || '-'}</td>
            <td>${ipo.refund_date || '-'}</td>
            <td>${ipo.price}</td>
            <td>${ipo.gm_price}</td>
            <td>${ipo.rating}</td>
            <td>${ipo.applied ? 'Yes' : 'No'}</td>
            <td>${ipo.applied_by || '-'}</td>
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
    const ctx = document.getElementById('ipoChart');
    if (!ctx) return;
    
    myChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: [], datasets: [{ label: 'Total Combined Price', data: [], backgroundColor: 'rgba(54, 162, 235, 0.6)' }] },
        options: { scales: { y: { beginAtZero: true } } }
    });
}

function updateChart() {
    if (!myChart) return;
    
    const lastDates = [...new Set(ipos.map(i => i.last_date).filter(d => d))].sort();
    
    const data = lastDates.map(targetDate => {
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
    if (!container) return;
    
    const appliedIpos = ipos.filter(i => i.applied);
    
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
