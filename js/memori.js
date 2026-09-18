import { db } from "./firebase.js";
import {
    ref,
    get,
    set,
    remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ========================================
// VARIABEL UTAMA
// ========================================

let memoryChart = null;
let dataMemoriAktif = [];
let namaMemoriAktif = "";


// ========================================
// AMBIL DATA MEMORI DARI FIREBASE
// ========================================

async function loadMemori() {

    try {

        const snapshot = await get(
            ref(db, "memoriHistoris")
        );

        const semuaMemori = snapshot.exists()
            ? snapshot.val()
            : {};


        for (let i = 1; i <= 3; i++) {

            const namaMemori = `memori${i}`;
            const memori = semuaMemori[namaMemori];


            // Elemen HTML
            const status = document.getElementById(
                `statusMemori${i}`
            );

            const total = document.getElementById(
                `totalMemori${i}`
            );

            const waktu = document.getElementById(
                `waktuMemori${i}`
            );

            const btnLihat = document.getElementById(
                `lihatMemori${i}`
            );

            const btnDownload = document.getElementById(
                `downloadMemori${i}`
            );

            const btnHapus = document.getElementById(
                `hapusMemori${i}`
            );


            // ========================================
            // JIKA MEMORI TERISI
            // ========================================

            if (memori && memori.data) {

                const jumlahData =
                    memori.totalData ||
                    Object.keys(memori.data).length;


                status.textContent = "Tersimpan";

                status.classList.remove("empty");
                status.classList.add("filled");


                total.textContent =
                    `${jumlahData} Data`;


                // Format waktu penyimpanan
                if (memori.waktuDisimpan) {

                    const tanggal =
                        new Date(memori.waktuDisimpan);

                    waktu.textContent =
                        tanggal.toLocaleString("id-ID");

                } else {

                    waktu.textContent =
                        "Waktu tidak tersedia";

                }


                // Aktifkan tombol
                btnLihat.disabled = false;
                btnDownload.disabled = false;
                btnHapus.disabled = false;


                // Tombol LIHAT
                btnLihat.onclick = () => {

                    tampilkanMemori(
                        namaMemori,
                        memori
                    );

                };


                // Tombol DOWNLOAD
                btnDownload.onclick = () => {

                    downloadMemori(
                        namaMemori,
                        memori
                    );

                };


                // Tombol HAPUS
                btnHapus.onclick = () => {

                    hapusMemori(namaMemori);

                };

            }


            // ========================================
            // JIKA MEMORI KOSONG
            // ========================================

            else {

                status.textContent = "Kosong";

                status.classList.remove("filled");
                status.classList.add("empty");


                total.textContent = "0 Data";

                waktu.textContent =
                    "Belum ada arsip";


                btnLihat.disabled = true;
                btnDownload.disabled = true;
                btnHapus.disabled = true;

            }

        }

    } catch (error) {

        console.error(
            "Gagal memuat Memori Historis:",
            error
        );

    }

}


// ========================================
// TAMPILKAN DATA MEMORI
// ========================================

function tampilkanMemori(namaMemori, memori) {

    const detailSection =
        document.getElementById(
            "memoryDetailSection"
        );

    const judul =
        document.getElementById(
            "judulDetailMemori"
        );

    const info =
        document.getElementById(
            "infoDetailMemori"
        );


    // Ubah object Firebase menjadi array
    dataMemoriAktif = Array.isArray(memori.data)
        ? memori.data
        : Object.values(memori.data);

    namaMemoriAktif = namaMemori;


    // Urutkan dari lama ke terbaru
    dataMemoriAktif.sort((a, b) => {

        const waktuA =
            new Date(
                `${a.tanggal} ${a.jam.replace(/-/g, ":")}`
            );

        const waktuB =
            new Date(
                `${b.tanggal} ${b.jam.replace(/-/g, ":")}`
            );

        return waktuA - waktuB;

    });


    // Judul detail
    judul.textContent =
        `Detail ${namaMemori.replace("memori", "Memori Historis ")}`;

    info.textContent =
        `${dataMemoriAktif.length} data hasil arsip monitoring.`;


    // Tampilkan section
    detailSection.classList.add("show");


    // Tampilkan tabel
    tampilkanTabelMemori(dataMemoriAktif);


    // Tampilkan grafik
    tampilkanGrafikMemori(dataMemoriAktif);


    // Scroll ke detail
    detailSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// ========================================
// TAMPILKAN TABEL
// ========================================

function tampilkanTabelMemori(data) {

    const tbody =
        document.getElementById(
            "memoryTableBody"
        );

    tbody.innerHTML = "";


    data.forEach((item, index) => {

        const row = document.createElement("tr");

        row.innerHTML = `
    <td>${index + 1}</td>
    <td>${item.tanggal || "-"}</td>
    <td>${item.jam ? item.jam.replace(/-/g, ":") : "-"}</td>
    <td>${item.rpm ?? "-"}</td>
    <td>${item.wind ?? "-"}</td>
    <td>${item.temperature ?? "-"}</td>

    <!-- GENERATOR -->
    <td>
    ${
        item.voltage_gen != null
            ? Number(item.voltage_gen).toFixed(2)
            : "-"
    }
</td>

<td>
    ${
        item.current_gen != null
            ? Number(item.current_gen).toFixed(3)
            : "-"
    }
</td>

<td>
    ${
        item.power_gen != null
            ? Number(item.power_gen).toFixed(3)
            : "-"
    }
</td>

<td>
    ${
        item.voltage_bat != null
            ? Number(item.voltage_bat).toFixed(2)
            : "-"
    }
</td>

<td>
    ${
        item.current_bat != null
            ? Number(item.current_bat).toFixed(3)
            : "-"
    }
</td>

<td>
    ${
        item.power_bat != null
            ? Number(item.power_bat).toFixed(3)
            : "-"
    }
</td>

<td>
    ${item.battery ?? "-"}%
</td>
`;

        tbody.appendChild(row);

    });

}


// ========================================
// TAMPILKAN GRAFIK
// ========================================
// ========================================
// TAMPILKAN GRAFIK MEMORI
// ========================================

function tampilkanGrafikMemori(data) {

    const canvas =
        document.getElementById("memoryChart");

    if (!canvas) return;


    // Parameter yang dipilih
    const parameterSelect =
        document.getElementById(
            "memoryParameterSelect"
        );

    const parameter =
        parameterSelect
            ? parameterSelect.value
            : "temperature";


    // ========================================
    // KONFIGURASI PARAMETER
    // ========================================

    const parameterConfig = {

    // =========================
    // TURBIN
    // =========================

    rpm: {
        label: "RPM Turbin",
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

    const dataGrafik = [...data];

    const labels = dataGrafik.map(item => {

        const jam = item.jam
            ? item.jam.replace(/-/g, ":")
            : "";

        return `${item.tanggal || ""} ${jam}`;

    });


    const values = dataGrafik.map(item => {

        return Number(
            item[config.key] ?? 0
        );

    });


    // ========================================
    // HAPUS GRAFIK SEBELUMNYA
    // ========================================

    if (memoryChart) {

        memoryChart.destroy();
        memoryChart = null;

    }


    // ========================================
    // BUAT GRAFIK
    // ========================================

    memoryChart = new Chart(canvas, {

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
                        `${Number(context.parsed.y).toFixed(3)} ` +
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
// GANTI PARAMETER GRAFIK MEMORI
// ========================================

const memoryParameterSelect =
    document.getElementById(
        "memoryParameterSelect"
    );

if (memoryParameterSelect) {

    memoryParameterSelect.addEventListener(
        "change",
        () => {

            tampilkanGrafikMemori(
                dataMemoriAktif
            );

        }
    );

}


// ========================================
// DOWNLOAD MEMORI - EXCEL
// ========================================
// ========================================
// DOWNLOAD MEMORI - EXCEL
// ========================================
// ========================================
// DOWNLOAD MEMORI - EXCEL + GRAFIK
// ========================================

// ========================================
// DOWNLOAD MEMORI - EXCEL + SEMUA GRAFIK
// ========================================

async function downloadMemori(namaMemori, memori) {

    try {

        const data = Array.isArray(memori.data)
            ? memori.data
            : Object.values(memori.data || {});


        if (data.length === 0) {

            alert("Data memori tidak tersedia.");
            return;

        }


        // ========================================
        // BUAT WORKBOOK
        // ========================================

        const workbook =
            new ExcelJS.Workbook();


        workbook.creator = "VENTALUX";
        workbook.created = new Date();


        // ========================================
        // SHEET 1 - DATA MONITORING
        // ========================================

        const sheetData =
            workbook.addWorksheet(
                "Data Monitoring"
            );


        sheetData.columns = [

            {
                header: "No",
                key: "no",
                width: 8
            },

            {
                header: "Tanggal",
                key: "tanggal",
                width: 15
            },

            {
                header: "Jam",
                key: "jam",
                width: 12
            },

            {
                header: "RPM",
                key: "rpm",
                width: 12
            },

            {
                header: "Kecepatan Angin (m/s)",
                key: "wind",
                width: 22
            },

            {
                header: "Suhu (°C)",
                key: "temperature",
                width: 15
            },
// GENERATOR
{
    header: "Tegangan Generator (V)",
    key: "voltage_gen",
    width: 22
},

{
    header: "Arus Generator (mA)",
    key: "current_gen",
    width: 22
},

{
    header: "Daya Generator (mW)",
    key: "power_gen",
    width: 22
},

// BATERAI
{
    header: "Tegangan Baterai (V)",
    key: "voltage_bat",
    width: 20
},

{
    header: "Arus Baterai (mA)",
    key: "current_bat",
    width: 20
},

{
    header: "Daya Baterai (mW)",
    key: "power_bat",
    width: 20
},
            {
                header: "Baterai (%)",
                key: "battery",
                width: 15
            }

        ];


        data.forEach((item, index) => {

          sheetData.addRow({

    no: index + 1,

    tanggal:
        item.tanggal || "-",

    jam:
        item.jam
            ? item.jam.replace(/-/g, ":")
            : "-",

    rpm:
        item.rpm ?? "-",

    wind:
        item.wind ?? "-",

    temperature:
        item.temperature ?? "-",

    // =========================
    // GENERATOR
    // =========================

    voltage_gen:
        item.voltage_gen ?? "-",

    current_gen:
    item.current_gen != null
        ? Number(item.current_gen).toFixed(3)
        : "-",

power_gen:
    item.power_gen != null
        ? Number(item.power_gen).toFixed(3)
        : "-",

    // =========================
    // BATERAI
    // =========================

   voltage_bat:
    item.voltage_bat != null
        ? Number(item.voltage_bat).toFixed(2)
        : "-",

current_bat:
    item.current_bat != null
        ? Number(item.current_bat).toFixed(3)
        : "-",

power_bat:
    item.power_bat != null
        ? Number(item.power_bat).toFixed(3)
        : "-",

    battery:
        item.battery ?? "-"

});

        });


        // Format header
        sheetData.getRow(1).font = {
            bold: true
        };


        sheetData.getRow(1).alignment = {
            horizontal: "center",
            vertical: "middle"
        };


        // ========================================
        // SHEET 2 - GRAFIK
        // ========================================

        const sheetGrafik =
            workbook.addWorksheet(
                "Grafik"
            );


        sheetGrafik.getCell("A1").value =
            `Grafik ${namaMemori.replace(
                "memori",
                "Memori Historis "
            )}`;


        sheetGrafik.getCell("A1").font = {
            bold: true,
            size: 16
        };


        // ========================================
        // PARAMETER GRAFIK
        // ========================================

        const parameterList = [
    { key: "rpm", label: "RPM Turbin", unit: "RPM" },
    { key: "wind", label: "Kecepatan Angin", unit: "m/s" },
    { key: "temperature", label: "Suhu", unit: "°C" },

    // GENERATOR
    { key: "voltage_gen", label: "Tegangan Generator", unit: "V" },
    { key: "current_gen", label: "Arus Generator", unit: "mA" },
    { key: "power_gen", label: "Daya Generator", unit: "mW" },

    // BATERAI
    { key: "voltage_bat", label: "Tegangan Baterai", unit: "V" },
    { key: "current_bat", label: "Arus Baterai", unit: "mA" },
    { key: "power_bat", label: "Daya Baterai", unit: "mW" },
    { key: "battery", label: "Baterai", unit: "%" }
];


        // ========================================
        // BUAT CANVAS SEMENTARA
        // ========================================

        const canvas =
            document.createElement("canvas");

        canvas.width = 1200;
        canvas.height = 550;

        const ctx =
            canvas.getContext("2d");


        // ========================================
        // BUAT SETIAP GRAFIK
        // ========================================

        for (const parameter of parameterList) {

            const labels = data.map(item => {

                const jam = item.jam
                    ? item.jam.replace(/-/g, ":")
                    : "";

                return `${item.tanggal || ""} ${jam}`;

            });


            const values = data.map(item =>

                Number(
                    item[parameter.key] ?? 0
                )

            );


            // Hapus grafik sebelumnya
            const existingChart =
                Chart.getChart(canvas);

            if (existingChart) {
                existingChart.destroy();
            }


            // Buat grafik
            const chart =
                new Chart(ctx, {

                    type: "line",

                    data: {

                        labels: labels,

                        datasets: [

                            {

                                label:
                                    `${parameter.label} (${parameter.unit})`,

                                data: values,

                                borderWidth: 2,

                                tension: 0.3,

                                pointRadius: 2,

                                fill: false

                            }

                        ]

                    },


                    options: {

                        responsive: false,

                        animation: false,

                        plugins: {

                            legend: {
                                display: true
                            },

                            title: {

                                display: true,

                                text:
                                    `${parameter.label} terhadap Waktu`,

                                font: {
                                    size: 18
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

                                    maxTicksLimit: 15

                                }

                            },


                            y: {

                                title: {

                                    display: true,

                                    text:
                                        `${parameter.label} (${parameter.unit})`

                                }

                            }

                        }

                    }

                });


            // ========================================
            // AMBIL GAMBAR GRAFIK
            // ========================================

            const imageData =
                canvas.toDataURL(
                    "image/png",
                    1.0
                );


            // Posisi grafik
            const rowStart =
                3 +
                (
                    parameterList.indexOf(parameter)
                    * 28
                );


            // Judul grafik
            sheetGrafik.getCell(
                `A${rowStart}`
            ).value =
                `${parameter.label} terhadap Waktu`;


            sheetGrafik.getCell(
                `A${rowStart}`
            ).font = {

                bold: true,

                size: 13

            };


            // Masukkan gambar ke Excel
            const imageId =
                workbook.addImage({

                    base64: imageData,

                    extension: "png"

                });


            sheetGrafik.addImage(
                imageId,
                {

                    tl: {

                        col: 0,

                        row: rowStart

                    },

                    ext: {

                        width: 900,

                        height: 400

                    }

                }
            );


            // Hapus chart sementara
            chart.destroy();

        }


        // ========================================
        // DOWNLOAD FILE
        // ========================================

        const buffer =
            await workbook.xlsx.writeBuffer();


        const blob =
            new Blob(
                [buffer],
                {
                    type:
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                }
            );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href = url;


        link.download =
            `${namaMemori}_Data_dan_Grafik.xlsx`;


        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);


        URL.revokeObjectURL(url);


        alert(
            "Data dan seluruh grafik berhasil diunduh."
        );


    } catch (error) {

        console.error(
            "Gagal mengunduh Memori Historis:",
            error
        );


        alert(
            "Gagal membuat file Excel."
        );

    }

}


// ========================================
// HAPUS MEMORI
// ========================================

async function hapusMemori(namaMemori) {

    const yakin = confirm(
        `Yakin ingin menghapus ${namaMemori}?`
    );

    if (!yakin) return;


    try {

        await remove(
            ref(
                db,
                `memoriHistoris/${namaMemori}`
            )
        );


        alert(
            `${namaMemori} berhasil dihapus.`
        );


        // Tutup detail jika memori aktif dihapus
        if (namaMemoriAktif === namaMemori) {

            const detailSection =
                document.getElementById(
                    "memoryDetailSection"
                );

            detailSection.classList.remove("show");

            if (memoryChart) {

                memoryChart.destroy();
                memoryChart = null;

            }

            dataMemoriAktif = [];
            namaMemoriAktif = "";

        }


        // Muat ulang status memori
        loadMemori();

    } catch (error) {

        console.error(
            "Gagal menghapus memori:",
            error
        );

        alert(
            "Gagal menghapus memori."
        );

    }

}


// ========================================
// TUTUP DETAIL MEMORI
// ========================================

document
    .getElementById("tutupDetail")
    .addEventListener("click", () => {

        const detailSection =
            document.getElementById(
                "memoryDetailSection"
            );

        detailSection.classList.remove("show");

    });


// ========================================
// JALANKAN SAAT HALAMAN DIBUKA
// ========================================

loadMemori();
// ========================================
// RAPIIKAN MEMORI 1 LAMA
// 837 DATA -> 720 MEMORI + SISANYA HISTORY
// JALANKAN SEKALI SAJA
// ========================================
