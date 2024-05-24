/*сюда сохраняются все глобальные переменные (так удобнее)*/
const state = {}; 
function main() {
    console.debug("call main");
    const fileInp = document.getElementById('fileInput');
    fileInp.addEventListener('change', fileInputOnChange);
    state.fileInput = fileInp;
    state.tabs = document.getElementsByClassName("tab");

    const menuItems = document.getElementsByClassName("tablink");

    for (const item of menuItems){
        const tabId = item.getAttribute('href').substring(1);
        item.addEventListener('click', (event) => {
            event.preventDefault(); 
            switchToTab(tabId);
        });
    }
    state.menuItems = menuItems;

    state.tableEdit = document.getElementById("editTableDiv");
}

function switchToTab(tabName) {
    console.debug('call switchToTab');
    const tabs = state.tabs;
    for (const tab of tabs) { 
        if (tab.id == tabName) {tab.style.display="block";} 
        else {tab.style.display = "none";}
    }

    if (tabName == 'uploadTable') {renderTableV2('table');}
    else if (tabName == 'editTable') {refreshEditTable();}
    else if (tabName == 'tableStats') {refreshStatsV2(tabName);} 
    else if (tabName == 'plotStats') {refreshStatsV2(tabName);}
}

function fileInputOnChange() {
    console.debug('call fileInputOnChange');
    const file = state.fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) { 
            const txt = event.target.result;
            state.table = parseTable(txt); 
            renderTableV2('table'); 
            state.fileInput.value = ""; 
        };
        reader.readAsText(file);
    }
}

function parseTable(txt, sep=";", linesep="\n") {
    console.debug('call parseTable');

    const rows = txt.replace('\r\n', '\n').split(linesep);
    const table = [];
    for (const row of rows) {
        const columns = row.split(sep);
        table.push(columns);
    }
    return table;
}
function renderTableV2(tableId, showDownloadButton=true) {
    console.debug(`call renderTableV2(${tableId})`);
    const divId = tableId + 'Div'; 
    const table = state[tableId];
    const div = document.getElementById(divId);
    if (!table) { 
        div.innerHTML = '<p>⚠️таблица не найдена</p>';
        console.log(`table ${tableId} not found`);
        return;
    };
    let html = '';
    if (showDownloadButton) {
    html += `<button class="buttonNormal1" onclick="downloadTableById('${tableId}', 'txt')">⇩ скачать .txt</button>`;
    html += `<button class="buttonNormal1" onclick="downloadTableById('${tableId}', 'csv')">⇩ скачать .csv</button>`;
    html += `<button class="buttonNormal1" onclick="downloadTableById('${tableId}', 'xls')">⇩ скачать .xls</button>`;
    }
    html += `<table id="${tableId}"><thead>` 
    const header = table[0];
    for (const cell of header) {html += `<th>${cell}</th>`;} 
    html += "</thead><tbody>"; 
    for (const row of table.slice(1)) {
        html += "<tr>";
        for (const cell of row) {html +=`<td>${cell}</td>`;}
        html += "</tr>";
    }
    html += "</tbody></table>"; 
    div.innerHTML = html;
}

function downloadTableById(tableId, format='txt', sep=';', linesep='\n'){
    console.debug(`call downloadTableById(${tableId})`);
    table = state[tableId];
    let csv = '\uFEFF'; 
    for (const row of table) {
        for (const v of row) {
            const s = `${v}`.replace(/(\r\n|\n|\r)/gm, " ").replace(/"/g, '""');
            csv += s + sep;
        }
        csv += linesep;
    }
    if (format == 'csv') { mimetype = 'text/csv;charset=utf-8';} 
    else if (format == 'txt') {mimetype = 'text/plain;charset=utf-8';} 
    else {mimetype = 'application/octet-stream';}
    const blob = new Blob([csv], { type: mimetype}); 
    const url = URL.createObjectURL(blob); 
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = tableId+('.' + format);
    document.body.appendChild(downloadLink);
    downloadLink.click(); 
    document.body.removeChild(downloadLink); 
    URL.revokeObjectURL(url);
}
function refreshEditTable(){
    console.debug('call refreshEditTable');
    const table = state.table;
    if (!table) { 
        state.tableEdit.innerHTML = '<p>⚠️таблица не найдена</p>';
        console.log(`table not found`);
        return;
    };
    let html = '<button class="buttonNormal1" onclick="downloadTableById(\'table\')">⇩ скачать</button>'
    html += '<table id="editableTable">';
    table.forEach((row, index) => { 
        if(index == 0) {      html += '<thead><tr>';} 
        else if(index == 1) { html += `<tbody><tr id="editorRow-${index}">`;} 
        else {                html += `<tr id="editorRow-${index}">`;}
        row.forEach(cell => {
            if(index == 0) {  html += `<th>${cell}</th>`;} 
            else {            html += `<td>${cell}</td>`;}
        });
        if (index != 0) { 
            html += `<td><button class="buttonEmoj" onclick="editTableDelete(${index})">🗑</button></td><td><button class="buttonEmoj" onclick="editTableEdit(${index})">🖉</button></td></tr>`;
        } else {
            html += '<th></th><th></th></tr></thead>';
        }
    });
    html += '<td><button class="buttonNormal1" onclick="editTableAddRow()">✚ добавить</button></td>'
    html += '</tbody>';
    html += '</table>';
    state.tableEdit.innerHTML = html;
}
function editTableDelete(idx){
    console.debug(`call editTableDelete(${idx})`);
    state.table.splice(idx, 1);
    refreshEditTable();
}
function editTableEdit(idx){
    console.debug(`call editTableEdit(${idx})`);
    const row = document.getElementById(`editorRow-${idx}`);
    const cells = row.childNodes;
    const ncells = cells.length;
    for (i=0; i < ncells -2; i++){
        const cell = cells[i];
        cell.contentEditable=true;
        cell.classList.add("editableCell");
    }
    cells[ncells-2].innerHTML = `<button class="buttonEmoj" onclick="editTableCancel(${idx})">✖</button>`;
    cells[ncells-1].innerHTML = `<button class="buttonEmoj" onclick="editTableAccept(${idx})">✓</button>`;
}
function editTableCancel(idx){
    console.debug(`call editTableCancel(${idx})`);
    refreshEditTable(); 
}
function editTableAccept(idx){
    console.debug(`call editTableCancel(${idx})`);
    const row = document.getElementById(`editorRow-${idx}`);
    const cells = row.childNodes;
    const rowVals = state.table[idx];
    for (i = 0; i < rowVals.length; i++) {
        rowVals[i] = cells[i].textContent;
    }
    refreshEditTable(); 
}
function editTableAddRow(){
    console.debug(`call editTableAddRow()`);
    const table = state.table;
    const ncols = table[0].length;
    const newRow = Array(ncols).fill('0');
    table.push(newRow);
    refreshEditTable();
}
function refreshStatsV2(whichTab){
    console.debug(`call refreshStatsV2(${whichTab})`);
    const table = state.table;
    if (!table) {
        renderTableV2('tableStatsStudent');
        renderTableV2('tableStatsGroup');
        return;
    }
    const nrows = table.length;
    const colnames = table[0];
    const ncols = colnames.length;
    const groupStats = {};
    const errors = ["найдены следующие ошибки, пожалуйста, вернитесь и отредактируйте таблицу:"];
    const groupSet = new Set(); 
    for (rowNo=1; rowNo<nrows; rowNo++){
        const row = table[rowNo];
        const group = row[1];
        groupSet.add(group);
        if (row.length != ncols) {
            errors.push(`ряд ${row[0]} имеет длину ${row.length}, но заголовок таблицы содержит ${ncols} ячеек`);
        }
        for (colNo=2; colNo<ncols; colNo++){
            const s = row[colNo];
            const v = parseInt(s);
            if (v != v) { 
                errors.push(`ряд ${row[0]} колонка ${colnames[colNo]}: ${s} не является числом`);
            } else if ((1 > v) | (v > 5)) {
                errors.push(`ряд ${row[0]} колонка ${colnames[colNo]}: оценка должна быть от 1 до 5, но поставлена ${v}`);
            }
            row[colNo]=v;
        }
    }
    if (errors.length > 1) {
       
        state.tableStatsStudent = errors.map(msg => {return [msg, ];}); 
        renderTableV2('tableStatsStudent');
        state.tableStatsGroup = null;
        renderTableV2('tableStatsGroup'); 
        return;
    }
    const groups = [... groupSet]; 
    const t2 = table.slice(1,); 
    const stats = [
        ['предмет', ...colnames.slice(2,)], 
        ['среднее',],
        ['медиана',],
        ['кол-во 1',],
        ['кол-во 2', ],
        ['кол-во 3', ],
        ['кол-во 4', ],
        ['кол-во 5', ],
        ['процент 1', ],
        ['процент 2', ],
        ['процент 3', ],
        ['процент 4', ],
        ['процент 5', ]
    ];
    const plotDS = {labels: colnames.slice(2,), datasets: [{label: 'total', data: []}]};
    for (colNo = 2; colNo < ncols; colNo++) {
        const col = t2.map(row => {return row[colNo];})
        const avg = averageArr(col).toFixed(1);
        stats[1].push(avg);
        stats[2].push(medianArr(col));
        const counts = countGrades(col);
        for (i=0; i<5; i++) {
            stats[3+i].push(counts[i]);
            const percent = (counts[i]/col.length * 100).toFixed(1);
            stats[3+5+i].push(percent);
        }
        plotDS.datasets[0].data.push(avg);
    }
    if (whichTab == 'tableStats') {
        state.tableStatsStudent = stats;
        renderTableV2('tableStatsStudent');
    } else if (whichTab == 'plotStats') {
        renderBarChart('studentChart', plotDS);
    }
    const gstats = [['предмет', 'класс', ...colnames.slice(2,)], ];
    const gplotDS = {labels: colnames.slice(2,), datasets: []}; 
    for (const group of groups){
        const gstat = [
            ['среднее',],
            ['медиана',],
            ['кол-во 1',],
            ['кол-во 2', ],
            ['кол-во 3', ],
            ['кол-во 4', ],
            ['кол-во 5', ],
            ['процент 1', ],
            ['процент 2', ],
            ['процент 3', ],
            ['процент 4', ],
            ['процент 5', ],
        ]
        for (const row of gstat) {row.push(group);}
        const gplotD = {label: group, data: []};
        gplotDS.datasets.push(gplotD);

        for (colNo = 2; colNo < ncols; colNo++) {
            const col = t2.filter(row=>{return row[1] == group;}).map(row => {return row[colNo];})
            const avg = averageArr(col).toFixed(1);
            gstat[0].push(avg);
            gstat[1].push(medianArr(col));
            const counts = countGrades(col);
            for (i=0; i<5; i++) {
                gstat[2+i].push(counts[i]);
                const percent = (counts[i]/col.length * 100).toFixed(1);
                gstat[2+5+i].push(percent);
            } 
            gplotD.data.push(avg); 
        }
        for (const row of gstat) {gstats.push(row);} 
    }
    if (whichTab == 'tableStats') {
        state.tableStatsGroup = gstats;
        renderTableV2('tableStatsGroup');
    } else if (whichTab == 'plotStats') {
        renderBarChart('groupChart', gplotDS);
    }
}
function averageArr(xs){
    if (xs.length == 0) return 0;
    return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function medianArr(xs) {
    if (xs.length==0) return 0;
    const xss = xs.toSorted();
    const mid = Math.floor(xss.length / 2);
    if (xss.length%2) { 
        return xss[mid];
    } else { 
        return (xss[mid-1]+xss[mid])/2
    }
}
function countGrades(grades) {
    const counts = Array(5).fill(0); 
    for (const grade of grades) {
        counts[grade-1]++;
    }
    return counts;
}
function renderBarChart(canvasId, data){
    const objId = canvasId + "Obj"; 
    if (state[objId]) { state[objId].destroy();} 
    const canvas = document.getElementById(canvasId); 
    const ctx = canvas.getContext('2d');
    state[objId] = new Chart(ctx, { 
        type: 'bar',
        data: data,
        options: {scales:{y: {beginAtZero: true}}}
    });
}
window.addEventListener('DOMContentLoaded', main);