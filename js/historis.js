import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getDatabase,
    ref,
    get,
    set,
    remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


// ========================================
// FIREBASE
// ========================================

const firebaseConfig = {

    apiKey: "AIzaSyCo1B0mW8h8HcTIfVZcFyAzVdn0EnYh92g",

    authDomain: "website0-2291b.firebaseapp.com",

    databaseURL:
        "https://website0-2291b-default-rtdb.asia-southeast1.firebasedatabase.app",

    projectId: "website0-2291b",

    storageBucket:
        "website0-2291b.firebasestorage.app",

    messagingSenderId: "185379743094",

    appId:
        "1:185379743094:web:dbefea90b74b7924900657"

};


const app = initializeApp(firebaseConfig);

const db = getDatabase(app);


// ========================================
// ELEMENT HTML
// ========================================
// ========================================
// ELEMENT HTML
// ========================================

const tbody =
    document.getElementById("historyBody");

const totalRecord =
    document.getElementById("totalRecord");

const filterDate =
    document.getElementById("filterDate");

const searchInput =
    document.getElementById("searchData");

const btnExcel =
    document.getElementById("btnExcel");

const btnPDF =
    document.getElementById("btnPDF");

const btnReset =
    document.getElementById("btnReset");

// ========================================
// DATA
// ========================================

let semuaData = [];
let dataFilter = [];
let historyChart = null;

const MAX_HISTORY = 720;
// ========================================
// ARSIP HISTORY KE MEMORI
// ========================================

async function arsipKeMemoriHistoris() {

    try {

        // Ambil data memori yang sudah ada
        const memoriRef = ref(db, "memoriHistoris");
        const snapshotMemori = await get(memoriRef);

        const memori = snapshotMemori.exists()
            ? snapshotMemori.val()
            : {};


        // Cari slot memori yang masih kosong
        let slotKosong = null;

        for (let i = 1; i <= 3; i++) {

            if (!memori[`memori${i}`]) {

                slotKosong = `memori${i}`;
                break;

            }

        }


        // Kalau semua slot penuh
        if (!slotKosong) {

            alert(
                "Memori Historis sudah penuh. " +
                "Silakan hapus salah satu memori terlebih dahulu."
            );

            return false;

        }


        // ========================================
        // URUTKAN DARI DATA TERLAMA
        // ========================================

        const dataUrutLama = [...semuaData].sort((a, b) => {

            const A = new Date(
                `${a.tanggal} ${a.jam.replace(/-/g, ":")}`
            );

            const B = new Date(
                `${b.tanggal} ${b.jam.replace(/-/g, ":")}`
            );

            return A - B;

        });


        // ========================================
        // AMBIL TEPAT 720 DATA
        // ========================================

        const dataArsip =
            dataUrutLama.slice(0, MAX_HISTORY);


        // ========================================
        // SISANYA
        // ========================================

        const dataSisa =
            dataUrutLama.slice(MAX_HISTORY);


        console.log(
            "Data masuk memori:",
            dataArsip.length
        );

        console.log(
            "Data tersisa di history:",
            dataSisa.length
        );


        // ========================================
        // SIMPAN KE MEMORI
        // ========================================

        await set(
            ref(db, `memoriHistoris/${slotKosong}`),
            {
                waktuDisimpan:
                    new Date().toISOString(),

                totalData:
                    dataArsip.length,

                data:
                    dataArsip
            }
        );


        // ========================================
        // HAPUS HISTORY LAMA
        // ========================================

        await remove(
            ref(db, "history")
        );


        // ========================================
        // KEMBALIKAN DATA SISA
        // ========================================

        for (const item of dataSisa) {

            await set(
                ref(
                    db,
                    `history/${item.tanggal}/${item.jam}`
                ),
                {
    rpm:
        item.rpm ?? 0,

    wind:
        item.wind ?? 0,

    temperature:
        item.temperature ?? 0,

    voltage_bat:
        item.voltage_bat ?? 0,

    current_bat:
        item.current_bat ?? 0,

    power_bat:
        item.power_bat ?? 0,

    voltage_gen:
        item.voltage_gen ?? 0,

    current_gen:
        item.current_gen ?? 0,

    power_gen:
        item.power_gen ?? 0,

    battery:
        item.battery ?? 0,

    batteryStatus:
        item.batteryStatus ?? ""
}
            );

        }


        alert(
            `${dataArsip.length} data berhasil ` +
            `disimpan ke ${slotKosong}.`
        );


        return true;


    } catch (error) {

        console.error(
            "Gagal menyimpan Memori Historis:",
            error
        );

        alert(
            "Gagal menyimpan data ke Memori Historis."
        );

        return false;

    }

}
// ========================================
// LOAD HISTORY
// ========================================

async function loadHistory() {

    try {

        const historyRef =
            ref(db, "history");

        const snapshot =
            await get(historyRef);


        semuaData = [];


        // Jika tidak ada data
        if (!snapshot.exists()) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="13">
                        Tidak ada data.
                    </td>
                </tr>
            `;

            totalRecord.textContent =
                "0 Record";

            return;
        }


        const history =
            snapshot.val();


        // ========================================
        // BACA TANGGAL
        // ========================================

        Object.keys(history).forEach(tanggal => {


            // Pastikan hanya membaca
            // node tanggal
            if (
                !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)
            ) {
                return;
            }


            // ========================================
            // BACA JAM
            // ========================================

            Object.keys(history[tanggal]).forEach(jam => {


                const data =
                    history[tanggal][jam];


                semuaData.push({

                    tanggal: tanggal,

                    jam: jam,

                    ...data

                });

            });

        });


        // ========================================
        // URUTKAN DATA
        // TERBARU DI ATAS
        // ========================================

        semuaData.sort((a, b) => {

            const A =
                new Date(
                    `${a.tanggal} ${a.jam.replace(/-/g, ":")}`
                );

            const B =
                new Date(
                    `${b.tanggal} ${b.jam.replace(/-/g, ":")}`
                );

            return B - A;

        });


        // ========================================
        // TAMPILKAN
        // ========================================

        // ========================================
// CEK BATAS 720 DATA
// ========================================

if (semuaData.length > MAX_HISTORY) {

    console.log(
        "Data sudah mencapai 720 record."
    );

    const berhasil =
        await arsipKeMemoriHistoris();

    if (berhasil) {

        // Baca ulang history
        await loadHistory();

        return;

    }

}


// ========================================
// TAMPILKAN DATA
// ========================================

tampilkanData(semuaData);

dataFilter = [...semuaData];

updateChart(dataFilter);

console.log(
    "Data historis berhasil dibaca:",
    semuaData.length
);

        console.log(
            "Data historis berhasil dibaca:",
            semuaData.length
        );


    } catch (error) {

        console.error(
            "Gagal membaca data historis:",
            error
        );

        tbody.innerHTML = `
            <tr>
                <td colspan="13">
                    Gagal membaca data historis.
                </td>
            </tr>
        `;

    }

}


// ========================================
// TAMPILKAN DATA
// ========================================

function tampilkanData(data) {

    tbody.innerHTML = "";


    if (data.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="13">
                    Tidak ada data.
                </td>
            </tr>
        `;

        totalRecord.textContent =
            "0 Record";

        return;

    }


    data.forEach((item, index) => {

        tbody.innerHTML += `

            <tr>

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${item.tanggal ?? "-"}
                </td>

                <td>
                    ${
                        item.jam
                        ? item.jam.replace(/-/g, ":")
                        : "-"
                    }
                </td>

                <td>
                    ${item.rpm ?? "-"}
                </td>

                <td>
                    ${item.wind ?? "-"} m/s
                </td>

                <td>
                    ${
                        item.temperature != null
                        ? Number(item.temperature).toFixed(1)
                        : "-"
                    } °C
                </td>
<td>
    ${
        item.voltage_gen != null
        ? Number(item.voltage_gen).toFixed(2)
        : "-"
    } V
</td>

<td>
    ${
        item.current_gen != null
        ? Number(item.current_gen).toFixed(3)
        : "-"
    } mA
</td>

<td>
    ${
        item.power_gen != null
        ? Number(item.power_gen).toFixed(3)
        : "-"
    } mW
</td>

<td>
    ${
        item.voltage_bat != null
        ? Number(item.voltage_bat).toFixed(2)
        : "-"
    } V
</td>

<td>
    ${
        item.current_bat != null
        ? Number(item.current_bat).toFixed(3)
        : "-"
    } mA
</td>

<td>
    ${
        item.power_bat != null
        ? Number(item.power_bat).toFixed(3)
        : "-"
    } mW
</td>

<td>
    ${item.battery ?? "-"}%
</td>

            </tr>

        `;

    });


    totalRecord.textContent =
        `${data.length} Record`;

}


// ========================================
// JALANKAN
// ========================================

loadHistory();


// ========================================
// REFRESH SETIAP 2 MENIT
// ========================================

setInterval(
    loadHistory,
    120000
);
// ========================================
// GRAFIK HISTORIS
// ========================================

// ========================================
// GRAFIK HISTORIS
// ========================================

function updateChart(data) {

    const ctx = document.getElementById("historyChart");

    if (!ctx) {
        console.log("Canvas historyChart tidak ditemukan");
        return;
    }

    // Parameter yang sedang dipilih
    const parameterSelect =
        document.getElementById("parameterSelect");

    const parameter =
        parameterSelect ? parameterSelect.value : "temperature";

    // Konfigurasi setiap parameter
    const parameterConfig = {

        rpm: {
            label: "RPM",
            unit: "RPM",
            key: "rpm"
        },

        wind: {
            label: "Kecepatan Angin",
            unit: "m/s",
            key: "wind"
        },

        temperature: {
            label: "Suhu",
            unit: "°C",
            key: "temperature"
        },

               // =========================
        // BATERAI
        // =========================

        voltage: {
            label: "Tegangan Baterai",
            unit: "V",
            key: "voltage_bat"
        },

        current: {
            label: "Arus Baterai",
            unit: "mA",
            key: "current_bat"
        },

        power: {
            label: "Daya Baterai",
            unit: "mW",
            key: "power_bat"
        },

        // =========================
        // GENERATOR
        // =========================

        generatorVoltage: {
            label: "Tegangan Generator",
            unit: "V",
            key: "voltage_gen"
        },

        generatorCurrent: {
            label: "Arus Generator",
            unit: "mA",
            key: "current_gen"
        },

        generatorPower: {
            label: "Daya Generator",
            unit: "mW",
            key: "power_gen"
        },

        // =========================
        // STATUS BATERAI
        // =========================

        battery: {
            label: "Baterai",
            unit: "%",
            key: "battery"
        }

    };

    const config =
        parameterConfig[parameter] ||
        parameterConfig.temperature;


    // ========================================
    // DATA GRAFIK
    // ========================================

    // Data grafik dibuat dari waktu terlama
    // menuju waktu terbaru
    const dataGrafik = [...data].reverse();


    // Label waktu
    const labels = dataGrafik.map(item => {

        const jam = item.jam
            ? item.jam.replace(/-/g, ":")
            : "";

        return `${item.tanggal || ""} ${jam}`;

    });


    // Nilai parameter yang dipilih
    const values = dataGrafik.map(item => {

        return Number(
            item[config.key] ?? 0
        );

    });


    // ========================================
    // HAPUS GRAFIK LAMA
    // ========================================

    if (historyChart) {

        historyChart.destroy();
        historyChart = null;

    }


    // ========================================
    // BUAT GRAFIK BARU
    // ========================================

    historyChart = new Chart(ctx, {

        type: "line",

        data: {

            labels: labels,

            datasets: [

                {
                    label:
                        `${config.label} (${config.unit})`,

                    data: values,

                    borderWidth: 2,

                    tension: 0.3,

                    pointRadius: 2,

                    pointHoverRadius: 5,

                    fill: false

                }

            ]

        },


        options: {

            responsive: true,

            maintainAspectRatio: false,


            interaction: {

                mode: "index",

                intersect: false

            },


            plugins: {

                legend: {

                    display: true,

                    position: "top"

                },


                title: {

                    display: true,

                    text:
                        `${config.label} terhadap Waktu`,

                    font: {

                        size: 16,

                        weight: "bold"

                    }

                },


                tooltip: {

                    mode: "index",

                    intersect: false,

                    callbacks: {

                        label: function(context) {

                            return (
                                `${config.label}: ` +
                                `${context.parsed.y} ` +
                                `${config.unit}`
                            );

                        }

                    }

                }

            },


            scales: {

                x: {

                    title: {

                        display: true,

                        text: "Waktu"

                    },

                    ticks: {

                        maxTicksLimit: 12

                    }

                },


                y: {

                    title: {

                        display: true,

                        text:
                            `${config.label} (${config.unit})`

                    },

                    beginAtZero: false

                }

            }

        }

    });

}
// ========================================
// GANTI PARAMETER GRAFIK
// ========================================

const parameterSelect =
    document.getElementById("parameterSelect");

if (parameterSelect) {

    parameterSelect.addEventListener(
        "change",
        () => {

            updateChart(dataFilter);

        }
    );

}
// ========================================
// FILTER PENCARIAN
// ========================================

searchInput.addEventListener("input", () => {

    const keyword =
        searchInput.value.toLowerCase().trim();

    dataFilter = semuaData.filter(item => {

        return Object.values(item)
            .join(" ")
            .toLowerCase()
            .includes(keyword);

    });

    tampilkanData(dataFilter);
    updateChart(dataFilter);

});


// ========================================
// FILTER TANGGAL
// ========================================

filterDate.addEventListener("change", () => {

    const tanggal =
        filterDate.value;

    if (!tanggal) {

        dataFilter = [...semuaData];

    } else {

        dataFilter =
            semuaData.filter(
                item => item.tanggal === tanggal
            );

    }

    tampilkanData(dataFilter);
    updateChart(dataFilter);

});


// ========================================
// DOWNLOAD EXCEL
// ========================================

btnExcel.addEventListener("click", () => {

    if (dataFilter.length === 0) {

        alert("Tidak ada data untuk diunduh.");
        return;

    }

   const excelData =
    dataFilter.map(item => ({

        "Tanggal":
            item.tanggal ?? "-",

        "Jam":
            item.jam
                ? item.jam.replace(/-/g, ":")
                : "-",

        "RPM":
            item.rpm ?? "-",

        "Kecepatan Angin (m/s)":
            item.wind ?? "-",

        "Suhu (°C)":
            item.temperature ?? "-",

        // GENERATOR
        "Tegangan Generator (V)":
            item.voltage_gen ?? "-",

        "Arus Generator (mA)":
            item.current_gen ?? "-",

        "Daya Generator (mW)":
            item.power_gen ?? "-",

        // BATERAI
        "Tegangan Baterai (V)":
            item.voltage_bat ?? "-",

        "Arus Baterai (mA)":
            item.current_bat ?? "-",

        "Daya Baterai (mW)":
            item.power_bat ?? "-",

        "Baterai (%)":
            item.battery ?? "-"

    }));

    const worksheet =
        XLSX.utils.json_to_sheet(excelData);

    const workbook =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Historis"
    );


    XLSX.writeFile(
        workbook,
        "Historis_VENTALUX.xlsx"
    );

});


// ========================================
// DOWNLOAD PDF
// ========================================

btnPDF.addEventListener("click", () => {

    if (dataFilter.length === 0) {

        alert("Tidak ada data untuk diunduh.");
        return;

    }


    const { jsPDF } =
        window.jspdf;


    const doc =
        new jsPDF("landscape");


    doc.setFontSize(16);

    doc.text(
        "Historis Monitoring VENTALUX",
        14,
        15
    );


    const rows =
    dataFilter.map(item => [

        item.tanggal ?? "-",

        item.jam
            ? item.jam.replace(/-/g, ":")
            : "-",

        item.rpm ?? "-",

        item.wind ?? "-",

        item.temperature ?? "-",

        // GENERATOR
        item.voltage_gen ?? "-",

        item.current_gen ?? "-",

        item.power_gen ?? "-",

        // BATERAI
        item.voltage_bat ?? "-",

        item.current_bat ?? "-",

        item.power_bat ?? "-",

        item.battery ?? "-"

    ]);


    doc.autoTable({

       head: [[
    "Tanggal",
    "Jam",
    "RPM",
    "Angin",
    "Suhu",
    "Volt Gen",
    "Arus Gen",
    "Daya Gen",
    "Volt Bat",
    "Arus Bat",
    "Daya Bat",
    "Baterai"
]],
        body: rows,

        startY: 25,

        theme: "grid",

        styles: {

            fontSize: 8

        }

    });


    doc.save(
        "Historis_VENTALUX.pdf"
    );

});
// ========================================
// RESET HISTORIS
// ========================================

btnReset.addEventListener("click", async () => {

    const yakin = confirm(
        "Apakah Anda yakin ingin menghapus seluruh data historis?\n\n" +
        "Semua data dan grafik pada halaman Historis akan dihapus " +
        "dan sistem akan mulai mengumpulkan data baru dari 0."
    );

    if (!yakin) {
        return;
    }

    try {

        // ========================================
        // HAPUS DATA HISTORY DI FIREBASE
        // ========================================

        await remove(
            ref(db, "history")
        );


        // ========================================
        // KOSONGKAN DATA DI MEMORI WEBSITE
        // ========================================

        semuaData = [];
        dataFilter = [];


        // ========================================
        // HAPUS GRAFIK
        // ========================================

        if (historyChart) {

            historyChart.destroy();

            historyChart = null;

        }


        // ========================================
        // KOSONGKAN FILTER
        // ========================================

        filterDate.value = "";
        searchInput.value = "";


        // ========================================
        // KEMBALIKAN PARAMETER DEFAULT
        // ========================================

        if (parameterSelect) {

            parameterSelect.value =
                "temperature";

        }


        // ========================================
        // KOSONGKAN TABEL
        // ========================================

        tampilkanData([]);


        // ========================================
        // PESAN BERHASIL
        // ========================================

        alert(
            "Data historis berhasil dihapus.\n\n" +
            "Sistem siap mengumpulkan data baru dari 0."
        );


    } catch (error) {

        console.error(
            "Gagal menghapus data historis:",
            error
        );

        alert(
            "Gagal menghapus data historis."
        );

    }

});