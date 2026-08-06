let pitchRow = [];
let articRow = [];

let pitches = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
let artics = ["ord", "stacc", "ten", "accent", "marc", "loure", "wedge", "harm", "slur", "gliss", "acc", "trem"];

const table = document.getElementById("table");

// generate table
for (let r = 0; r < 14; r++) {
    const row = document.createElement("tr");
    for (let c = 0; c < 14; c++) {
        let cell;
        if (r === 0 || r === 13 || c === 0 || c === 13) {
            cell = document.createElement("th");
        } else {
            cell = document.createElement("td");
        }
        row.appendChild(cell);
    }
    table.appendChild(row);
}

const corners = [
    table.rows[0].cells[0],
    table.rows[0].cells[13],
    table.rows[13].cells[0],
    table.rows[13].cells[13]
];

for (const cell of corners) {
    cell.style.visibility = "hidden";
    cell.style.border = "none";
}

function colourRow(r, colour) {
    for (let c = 0; c < table.rows[r].cells.length; c++) {
        table.rows[r].cells[c].style.backgroundColor = colour;
    }
}

function colourCol(c, colour) {
    for (let r = 0; r < table.rows.length; r++) {
        table.rows[r].cells[c].style.backgroundColor = colour;
    }
}

colourRow(0, "#ededed");
colourRow(13, "#ededed");
colourCol(0, "#ededed");
colourCol(13, "#ededed");

// ~~~ FUNCTIONS ~~~

function setPitch(c, r, content) {
    table.rows[r].cells[c].dataset.pitch = content;
}

function getPitch(c, r) {
    return table.rows[r].cells[c].dataset.pitch ?? "";
}

function setArtic(c, r, content) {
    table.rows[r].cells[c].dataset.artic = content;
}

function getArtic(c, r) {
    return table.rows[r].cells[c].dataset.artic ?? "";
}

function renderCell(c, r) {
    if (c === 0 || r === 0 || c === table.rows.length - 1 || r === table.rows.length - 1) {
        table.rows[r].cells[c].innerHTML = renderFilter(getPitch(c, r) + getArtic(c, r));
    } else {
        const pitch = getPitch(c, r);

        if (getPitch(c, r) === "") {
            table.rows[r].cells[c].innerHTML = "";
            return;
        }
        table.rows[r].cells[c].innerHTML = `<music-note pitch="${pitch}/4" duration="4" articulation="${getArtic(c, r)}"></music-note>`;
    }
}

function renderCells() {
    for (let r = 0; r < table.rows.length; r++) {
        for (let c = 0; c < table.rows[r].cells.length; c++) {
            renderCell(c, r);
        }
    }
}

function mod(a, b) {
    return ((a % b) + b) % b;
}

function interval(a, b) {
    return pitches.indexOf(getPitch(a, 1)) - pitches.indexOf(getPitch(b, 1));
}

function renderFilter(txt) {
    return (txt || "").replace("#", "&sharp;");
}

function inputPitch(id) {
    if (pitchRow.length > 11) return;

    document.getElementById("pitchDel").disabled = false;
    pitchRow.push(id);
    document.getElementById(id).disabled = true;

    let rLen = pitchRow.length;

    // pitches
    setPitch(rLen, 1, id); // pitch
    if (rLen >= 2) {
        // vertically previous cell - interval between final item and penultimate item on the first row
        setPitch(1, rLen, pitches[mod(pitches.indexOf(getPitch(1, rLen - 1)) - interval(rLen, rLen - 1), 12)]);
        setPitch(2, rLen, pitches[mod(pitches.indexOf(getPitch(1, rLen)) - interval(1, 2), 12)]);
    }

    for (let k = 3; k <= 12; k++) {
        if (rLen >= k) {
            for (let i = 2; i < rLen + 1; i++) {
                setPitch(k, i, pitches[mod(pitches.indexOf(getPitch(k - 1, i)) - interval(k - 1, k), 12)]);
            }
        }
    }

    // headings
    if (rLen < 2) {
        setPitch(0, rLen, "<b>P</b><sub>0</sub>");
        setPitch(13, rLen, "<b>R</b><sub>0</sub>");
        setPitch(rLen, 0, "<b>I</b><sub>0</sub>");
        setPitch(rLen, 13, "<b>RI</b><sub>0</sub>");
    } else {
        setPitch(0, rLen, `<b>P</b><sub>${mod(pitches.indexOf(getPitch(1, rLen)) - pitches.indexOf(pitchRow[0]), 12)}</sub>`);
        setPitch(13, rLen, `<b>R</b><sub>${mod(pitches.indexOf(getPitch(1, rLen)) - pitches.indexOf(pitchRow[0]), 12)}</sub>`);
        setPitch(rLen, 0, `<b>I</b><sub>${mod(pitches.indexOf(id) - pitches.indexOf(pitchRow[0]), 12)}</sub>`);
        setPitch(rLen, 13, `<b>RI</b><sub>${mod(pitches.indexOf(id) - pitches.indexOf(pitchRow[0]), 12)}</sub>`);
    }
    populateArtics();
    renderCells();
}

function deletePitch() {
    let rLen = pitchRow.length;
    if (rLen < 1) return;
    for (let r = 1; r < table.rows.length - 1; r++) {
        for (let c = 1; c < table.rows[r].cells.length - 1; c++) {
            if (r >= rLen || c >= rLen) {
                setPitch(c, r, "");
            }
        }
    }
    setPitch(0, rLen, "");
    setPitch(rLen, 0, "");
    setPitch(13, rLen, "");
    setPitch(rLen, 13, "");
    document.getElementById(pitchRow.pop()).disabled = false;
    if (pitchRow.length < 1) {
        document.getElementById("pitchDel").disabled = true;
    }
    renderCells();
}

function wTransform(notes, n) {
    let t = []; let i = -1;
    n++;
    while (t.length < notes.length) {
        for (let k = 0; k < n; k++) {
            do {
                i = (i + 1) % notes.length;
            } while (t.includes(notes[i]))
        }
        t.push(notes[i]);
    }
    return t;
}

function getNumbersOnly(s) {
    return s.replace(/\D/g, "");
}

function populateArtics() {
    for (let i = 1; i < pitchRow.length + 1; i++) {
        for (let k = 1; k < table.rows.length - 1; k++) {
            setArtic(k, i, "");
        }
        let n = getNumbersOnly(getPitch(0, i));
        let row = wTransform(articRow, n);
        for (let k = 1; k < row.length + 1; k++) {
            setArtic(k, i, row[k - 1]);
        }
    }
}

function inputArticulation(id) {
    if (pitchRow.length < 1) return;
    if (articRow.length > 11) return;

    document.getElementById("articDel").disabled = false;
    articRow.push(id);
    document.getElementById(id).disabled = true;

    let rLen = articRow.length;

    setArtic(rLen, 1, id); // base articulation

    populateArtics();
    renderCells();
}

function deleteArticulation() {
    let rLen = articRow.length;
    if (rLen < 1) return;

    document.getElementById(articRow.pop()).disabled = false;
    if (articRow.length < 1) {
        document.getElementById("articDel").disabled = true;
    }
    populateArtics();
    renderCells();
}

async function downloadPNG() {
    const canvas = await html2canvas(document.getElementById("table"), { scale: 4 } );

    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "table.png";
    a.click();
}