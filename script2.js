/*сюда сохраняются все глобальные переменные (так удобнее)*/
const state = {}; 
/*
первая функция, к-рая настраиватет все остальные
вызывается в конце скрипта через 
window.addEventListener('DOMContentLoaded', main);
*/
function main() {
    console.debug("call main");
    const fileInp = document.getElementById('fileInput');
    fileInp.addEventListener('change', fileInputOnChange);
    state.fileInput = fileInp;
    // сохраняем список вкладок
    state.tabs = document.getElementsByClassName("tab");
    // прикрепляем вызов функции к каждой кнопке главного меню
    // (это можно прописать и вручную, но с ростом числа кнопок это становится сложнее)
    const menuItems = document.getElementsByClassName("tablink");
    // const menuItems = document.querySelectorAll('nav ul li a');
    for (const item of menuItems){
        const tabId = item.getAttribute('href').substring(1);
        item.addEventListener('click', (event) => {
            event.preventDefault(); // Отменить стандартное поведение ссылок
            switchToTab(tabId);
        });
    }
    state.menuItems = menuItems;
    // сохраняем элемент, в котором будет редактируемая таблица
    state.tableEdit = document.getElementById("editTableDiv");
}
/*переключение между вкладками по имени вкладки*/
function switchToTab(tabName) {
    console.debug('call switchToTab');
    const tabs = state.tabs;
    for (const tab of tabs) { // показываем нужную вкладку, скрываем остальные
        if (tab.id == tabName) {tab.style.display="block";} 
        else {tab.style.display = "none";}
    }
    // в зависимости от вкладки вызываем ф-цию, которая ее обновляет
    if (tabName == 'uploadTable') {renderTableV2('table');}
    else if (tabName == 'editTable') {refreshEditTable();}
    else if (tabName == 'tableStats') {refreshStatsV2(tabName);} // тут было проще сделать одну функцию на 2 вкладки
    else if (tabName == 'plotStats') {refreshStatsV2(tabName);}
}
/* выполняется, когда загружают файл во вкладке "загрузить таблицу" */
function fileInputOnChange() {
    console.debug('call fileInputOnChange');
    const file = state.fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) { // выполнится, когда файл будет прочитан
            // https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications
            const txt = event.target.result;
            state.table = parseTable(txt); // читаем таблицу, сохраняем в state
            renderTableV2('table'); // renderTableV2 ищет таблицы по имени
            state.fileInput.value = ""; // стираем файл из списка, 
            // чтобы можно было его загрузить повторно
        };
        reader.readAsText(file);
    }
}
/* читает таблицу из текста в массив*/
function parseTable(txt, sep=";", linesep="\n") {
    console.debug('call parseTable');
    // тупо заменить переносы строки удобнее, чем думать, какие они
    const rows = txt.replace('\r\n', '\n').split(linesep);
    const table = [];
    for (const row of rows) {
        const columns = row.split(sep);
        table.push(columns);
    }
    return table;
}
/* отображает таблицу, сохраненную в state[tableId] */ 
function renderTableV2(tableId, showDownloadButton=true) {
    console.debug(`call renderTableV2(${tableId})`);
    const divId = tableId + 'Div'; // предполагается, что div названы сообразно с ключами в state
    const table = state[tableId];
    const div = document.getElementById(divId);
    if (!table) { // таблицы еще нет
        div.innerHTML = '<p>⚠️таблица не найдена</p>';
        console.log(`table ${tableId} not found`);
        return;
    };
    // добавляем кнопки для скачивания
    let html = '';
    if (showDownloadButton) {
    html += `<button class="buttonNormal1" onclick="downloadTableById('${tableId}', 'txt')">⇩ скачать .txt</button>`;
    html += `<button class="buttonNormal1" onclick="downloadTableById('${tableId}', 'csv')">⇩ скачать .csv</button>`;
    html += `<button class="buttonNormal1" onclick="downloadTableById('${tableId}', 'xls')">⇩ скачать .xls</button>`;
    }
    html += `<table id="${tableId}"><thead>` // теги начала таблицы
    const header = table[0];
    for (const cell of header) {html += `<th>${cell}</th>`;} // заголовок делаем отдельно
    html += "</thead><tbody>"; // закрываем заголовок, начинаем тело таблицы
    for (const row of table.slice(1)) {
        html += "<tr>";
        for (const cell of row) {html +=`<td>${cell}</td>`;}
        html += "</tr>";
    }
    html += "</tbody></table>"; // закрываем таблицу, вставляем полученный текст в html страницы
    div.innerHTML = html;
}
/* скачивает таблицу, сохраненную в state[tableId] в виде текста*/
function downloadTableById(tableId, format='txt', sep=';', linesep='\n'){
    console.debug(`call downloadTableById(${tableId})`);
    table = state[tableId];
    let csv = '\uFEFF'; // соединяем все ячейки в строку (начинается с UTF-8 Byte Order Mark)
    for (const row of table) {
        for (const v of row) {
            // на всякий случай, заменяем переводы строки и кавычки, чтобы csv был корректным
            const s = `${v}`.replace(/(\r\n|\n|\r)/gm, " ").replace(/"/g, '""');
            csv += s + sep;
        }
        csv += linesep;
    }
    if (format == 'csv') { mimetype = 'text/csv;charset=utf-8';} 
    else if (format == 'txt') {mimetype = 'text/plain;charset=utf-8';} 
    else {mimetype = 'application/octet-stream';}
    const blob = new Blob([csv], { type: mimetype}); // создаем новый массив байтов (типа как для картинок и тп)
    const url = URL.createObjectURL(blob); // прикрепляем массив к гиперссылке ("а")
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = tableId+('.' + format);
    document.body.appendChild(downloadLink);
    downloadLink.click(); // кликаем по ссылке
    document.body.removeChild(downloadLink); // удаляем файл и ссылку со страницы
    URL.revokeObjectURL(url);
}
/*
• вкладка для создания или редактирования журнала и сохранения в файл
◦ разместить таблицу для просмотра имеющихся значений
◦ разместить поля для ввода ФИО и оценок ученика
◦ кнопка удаления записи отдельного ученика
◦ кнопка для редактирования записей выбранного ученика */
function refreshEditTable(){
    console.debug('call refreshEditTable');
    const table = state.table;
    if (!table) { // таблицы еще нет
        state.tableEdit.innerHTML = '<p>⚠️таблица не найдена</p>';
        console.log(`table not found`);
        return;
    };
    // поскольку редактируемая таблица ссылается на основную, начинаем с кнопки для сохранения основной
    let html = '<button class="buttonNormal1" onclick="downloadTableById(\'table\')">⇩ скачать</button>'
    html += '<table id="editableTable">';
    table.forEach((row, index) => { // наращиваем таблицу, аналогично renderTableV2
        if(index == 0) {      html += '<thead><tr>';} 
        else if(index == 1) { html += `<tbody><tr id="editorRow-${index}">`;} // запоминание номера сделает изменение быстрее
        else {                html += `<tr id="editorRow-${index}">`;}
        row.forEach(cell => {
            if(index == 0) {  html += `<th>${cell}</th>`;} 
            else {            html += `<td>${cell}</td>`;}
        });
        if (index != 0) { // добавляем две колонки с кнопками
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
/* удаляет строку из таблицы*/
function editTableDelete(idx){
    console.debug(`call editTableDelete(${idx})`);
    state.table.splice(idx, 1);
    refreshEditTable();
}
/* делает строку редактируемой*/
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
/* отменяет редактирование строки*/
function editTableCancel(idx){
    console.debug(`call editTableCancel(${idx})`);
    refreshEditTable(); // правильнее было бы обратно поправить ряд, но мне лень
}
/* сохраняет редактируемую строку (считывает ячейки ряда обратно в state.table)*/
function editTableAccept(idx){
    console.debug(`call editTableCancel(${idx})`);
    const row = document.getElementById(`editorRow-${idx}`);
    const cells = row.childNodes;
    const rowVals = state.table[idx];
    for (i = 0; i < rowVals.length; i++) {
        rowVals[i] = cells[i].textContent;
    }
    refreshEditTable(); // опять-таки, лень
}
/* добавляет новую строчку в state.table*/
function editTableAddRow(){
    console.debug(`call editTableAddRow()`);
    const table = state.table;
    const ncols = table[0].length;
    const newRow = Array(ncols).fill('0');
    table.push(newRow);
    refreshEditTable();
}
/*считает статистику и передает функции к-рая рисует таблицы/графики */
function refreshStatsV2(whichTab){
    console.debug(`call refreshStatsV2(${whichTab})`);
    const table = state.table;
    if (!table) {
        // если нет таблицы, напишут сообщения об ошибке
        renderTableV2('tableStatsStudent');
        renderTableV2('tableStatsGroup');
        return;
    }
    const nrows = table.length;
    const colnames = table[0];
    const ncols = colnames.length;
    const groupStats = {};
    const errors = ["найдены следующие ошибки, пожалуйста, вернитесь и отредактируйте таблицу:"];
    // конвертируем колонки, начиная с 3ей (индекс 2) в Int, проверяем корректность таблицы
    const groupSet = new Set(); // для названий групп, Set хранит только 1 копию каждого значения
    for (rowNo=1; rowNo<nrows; rowNo++){
        const row = table[rowNo];
        const group = row[1];
        groupSet.add(group);
        if (row.length != ncols) {
            errors.push(`ряд ${row[0]} имеет длину ${row.length}, но заголовок таблицы содержит ${ncols} ячеек`);
        }
        // const grades = row.slice(2,).map(parseInt); // можно так, но тогда не получится записать ошибки
        for (colNo=2; colNo<ncols; colNo++){
            const s = row[colNo];
            const v = parseInt(s);
            if (v != v) { // v это IEEE Nan, Nan != Nan по этому стандарту
                errors.push(`ряд ${row[0]} колонка ${colnames[colNo]}: ${s} не является числом`);
            } else if ((1 > v) | (v > 5)) {
                errors.push(`ряд ${row[0]} колонка ${colnames[colNo]}: оценка должна быть от 1 до 5, но поставлена ${v}`);
            }
            row[colNo]=v;
        }
    }
    if (errors.length > 1) {
        // вместо нормальной таблицы выводим обшибки, если они есть
        state.tableStatsStudent = errors.map(msg => {return [msg, ];}); // делаем из массива таблицу с 1 колонкой
        renderTableV2('tableStatsStudent');
        state.tableStatsGroup = null;
        renderTableV2('tableStatsGroup'); // выведет сообщение, что нет такой таблицы
        return;
    }
    const groups = [... groupSet]; // конвертируем в массив
    const t2 = table.slice(1,); // обрезаем заголовок для удобства
    // заготовка таблицы со статистикой по всем студентам
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
    // заготовка данных для графика
    const plotDS = {labels: colnames.slice(2,), datasets: [{label: 'total', data: []}]};
    for (colNo = 2; colNo < ncols; colNo++) {
        const col = t2.map(row => {return row[colNo];}) // извлекаем колонку с нужным номером
        // считаем что надо и записываем в таблицу со статистикой / хэшмап для графика
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
    // в зависимости от того, на какой мы вкладке, обновляем график или таблицу
    if (whichTab == 'tableStats') {
        state.tableStatsStudent = stats;
        renderTableV2('tableStatsStudent');
    } else if (whichTab == 'plotStats') {
        // renderBarChart('studentChart', { // раскомментировать этот кусок, чтобы потренироваться на тестовых данных
            // labels: ['abc', 'def', 'ghi'], 
            // datasets: [
            //     {label: 'x', data: [10, 12, 8]},
            // ]});
        renderBarChart('studentChart', plotDS);
    }

    //повторяем то же самое с разбивкой по классам
    const gstats = [['предмет', 'класс', ...colnames.slice(2,)], ];
    const gplotDS = {labels: colnames.slice(2,), datasets: []}; // данные для графика собираем сюда
    for (const group of groups){
        // новая секция таблицы для одного класса
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
        // добавляем группу в каждую строчку таблицы название группы
        for (const row of gstat) {row.push(group);}
        // добавляем в данные для графика группу
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
            gplotD.data.push(avg); // добавляем среднее к данным для графика
        }
        for (const row of gstat) {gstats.push(row);} // добавляем секцию таблицы к общей таблицы
    }
    if (whichTab == 'tableStats') {
        state.tableStatsGroup = gstats;
        renderTableV2('tableStatsGroup');
    } else if (whichTab == 'plotStats') {
        // renderBarChart('groupChart' { // на тестовых данных
        //     labels: ['abc', 'def', 'ghi'], 
        //     datasets: [
        //         {label: 'x', data: [10, 5, 12]},
        //         {label: 'y', data: [10, 15, 8]},
        //     ]});
        renderBarChart('groupChart', gplotDS);
    }
}
/*среднее массива*/
function averageArr(xs){
    if (xs.length == 0) return 0;
    return xs.reduce((a, b) => a + b, 0) / xs.length;
}
/*медиана массива*/
function medianArr(xs) {
    if (xs.length==0) return 0;
    const xss = xs.toSorted();
    const mid = Math.floor(xss.length / 2);
    if (xss.length%2) { // нечетное
        return xss[mid];
    } else { // четное
        return (xss[mid-1]+xss[mid])/2
    }
}
/*считаем оценки*/
function countGrades(grades) {
    const counts = Array(5).fill(0); // счетчики оценок от 1 до 5 по порядку
    for (const grade of grades) {
        counts[grade-1]++;
    }
    return counts;
}
/*строим столбчатый график на элементе с canvasId*/
function renderBarChart(canvasId, data){
    const objId = canvasId + "Obj"; // ключ по которому находим менеджер графика
    if (state[objId]) { state[objId].destroy();} // если менеджер графика есть, уничтожаем его
    const canvas = document.getElementById(canvasId); // находим canvas
    const ctx = canvas.getContext('2d');
    state[objId] = new Chart(ctx, { // создаем менеджер графика и передаем туда данные
        type: 'bar',
        data: data,
        options: {scales:{y: {beginAtZero: true}}}
    });
}
window.addEventListener('DOMContentLoaded', main);