// ======================================================
// SMART CAMPUS - MAIN.JS
// BACKEND CONNECTED VERSION
// ======================================================


// ======================================================
// BACKEND CONFIGURATION
// ======================================================

const BACKEND_URL = window.SMART_CAMPUS_API_URL || "https://smart-campus-automation.onrender.com";


// ======================================================
// ROOM FACTORY
// ======================================================

const room = (
    id,
    floor,
    block,
    occupied = false,
    warning = false
) => ({
    id,
    campus: "Campus 25",
    floor,
    block,
    building: block,
    occupied,
    temperature: 26,
    humidity: 58,
    light: occupied || warning,
    fan: occupied,
    ac: false,
    power: 0,
    energyToday: 1.2,
    warning
});


// ======================================================
// INITIAL FRONTEND ROOM DATA
// ======================================================

const Campus = {

    rooms: [

        {
            ...room(
                "A101",
                "First Floor",
                "A Block",
                true
            ),
            temperature: 27.4,
            humidity: 61,
            energyToday: 6.42
        },

        {
            ...room(
                "A102",
                "First Floor",
                "A Block",
                false
            ),
            temperature: 26.1,
            humidity: 58,
            energyToday: 1.21
        },

        {
            ...room(
                "A103",
                "First Floor",
                "A Block",
                true
            ),
            temperature: 25.8,
            humidity: 59,
            ac: true,
            energyToday: 9.15
        },

        {
            ...room(
                "A104",
                "First Floor",
                "A Block",
                false,
                true
            ),
            temperature: 28.2,
            humidity: 63,
            energyToday: 2.15
        },

        ...Array.from(
            {
                length: 14
            },
            (_, i) =>
                room(
                    `A${105 + i}`,
                    "First Floor",
                    "A Block",
                    i % 3 === 0
                )
        ),

        ...Array.from(
            {
                length: 22
            },
            (_, i) =>
                room(
                    `B${101 + i}`,
                    "First Floor",
                    "B Block",
                    i % 2 === 0
                )
        ),

        ...[
            "C101",
            "C104",
            "C105",
            "C106"
        ].map(
            (id, i) =>
                room(
                    id,
                    "First Floor",
                    "C Block",
                    i === 0
                )
        ),

        ...Array.from(
            {
                length: 18
            },
            (_, i) =>
                room(
                    `A${301 + i}`,
                    "Third Floor",
                    "A Block",
                    i % 3 === 1
                )
        ),

        ...Array.from(
            {
                length: 22
            },
            (_, i) =>
                room(
                    `B${301 + i}`,
                    "Third Floor",
                    "B Block",
                    i % 2 === 1
                )
        ),

        ...[
            "C301",
            "C303"
        ].map(
            (id, i) =>
                room(
                    id,
                    "Third Floor",
                    "C Block",
                    !!i
                )
        )

    ],

    alerts: [
        [
            "warning",
            "A104",
            "Room is empty but appliances are still running.",
            "just now"
        ]
    ]

};


// ======================================================
// PAGE
// ======================================================

const page = document.body.dataset.page;


// ======================================================
// DATE / TIME
// ======================================================

const DateTime = {

    compact(date = new Date()) {

        return new Intl.DateTimeFormat(
            undefined,
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        ).format(date);

    },

    time(date = new Date()) {

        return new Intl.DateTimeFormat(
            undefined,
            {
                hour: "numeric",
                minute: "2-digit"
            }
        ).format(date);

    },

    relative(value) {

        const seconds = Math.max(
            0,
            Math.floor(
                (Date.now() - new Date(value).getTime()) / 1000
            )
        );


        if (seconds < 45) {

            return "Just now";

        }


        if (seconds < 3600) {

            return `${Math.floor(seconds / 60)} min ago`;

        }


        if (seconds < 86400) {

            return `${Math.floor(seconds / 3600)} hr ago`;

        }


        return new Intl.DateTimeFormat(
            undefined,
            {
                month: "short",
                day: "numeric"
            }
        ).format(new Date(value));

    }

};


window.DateTime = DateTime;


// ======================================================
// CONSTANTS
// ======================================================

const CAMPUS_STORE_KEY = "campus25-simulation-v2";

const SIMULATION_INTERVAL = 5000;

const AUTO_OFF_DELAY = 30000;

const ENERGY_RATE = 8;


// ======================================================
// CAMPUS STATE
// ======================================================

const campusState = (() => {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(
                    CAMPUS_STORE_KEY
                )
            );


        if (saved) {

            Object.assign(
                Campus,
                saved
            );

        }

    } catch (error) {

        console.error(
            "Local campus state error:",
            error
        );

    }


    Campus.campus = "Campus 25";

    Campus.energySavedToday =
        Campus.energySavedToday || 0;

    Campus.estimatedCostSaved =
        Campus.estimatedCostSaved || 0;

    Campus.totalPower =
        Campus.totalPower || 0;

    Campus.energyToday =
        Campus.energyToday ||
        Campus.rooms.reduce(
            (total, r) =>
                total + Number(r.energyToday || 0),
            0
        );

    Campus.alertObjects =
        Campus.alertObjects || [];

    Campus.simulationRunning = false;

    Campus.automationEnabled = true;


    Campus.rooms.forEach(r => {

        r.appliances =
            r.appliances || {

                light: !!r.light,

                fan: !!r.fan,

                ac: !!r.ac

            };


        r.powerModel =
            r.powerModel || {

                light: 0,

                fan: 0,

                ac: 0,

                total: 0

            };


        if (r.emptySince === undefined) {

            r.emptySince =
                r.occupied
                    ? null
                    : Date.now();

        }


        if (r.autoOffTriggered === undefined) {

            r.autoOffTriggered = false;

        }

    });


    return Campus;

})();


// ======================================================
// SECOND FLOOR DATA
// ======================================================

const secondFloorIds = [

    "A211",
    "A213",

    "B201",
    "B202",
    "B204",
    "B205",
    "B206",
    "B207",
    "B208",
    "B209",
    "B210",
    "B211",
    "B212",
    "B213",
    "B214",
    "B215",
    "B216",
    "B217",
    "B218",
    "B219",
    "B220",
    "B221",

    "C201",
    "C203",
    "C211",
    "C212",
    "C213"

];


secondFloorIds.forEach(
    (id, i) => {

        if (
            !campusState.rooms.some(
                r => r.id === id
            )
        ) {

            const block =
                id.startsWith("A")
                    ? "A Block"
                    : id.startsWith("B")
                        ? "B Block"
                        : "C Block";


            const r =
                room(
                    id,
                    "Second Floor",
                    block,
                    i % 3 === 0
                );


            r.appliances = {

                light: r.light,

                fan: r.fan,

                ac: r.ac

            };


            r.powerModel = {

                light: 0,

                fan: 0,

                ac: 0,

                total: 0

            };


            r.emptySince =
                r.occupied
                    ? null
                    : Date.now();


            r.autoOffTriggered = false;


            campusState.rooms.push(r);

        }

    }
);


// ======================================================
// GROUND FLOOR DATA
// ======================================================

const groundFloorIds = [

    "A006",
    "A007",
    "A008",
    "A009",
    "A011",
    "A013",
    "A015",

    "A101",
    "A102",
    "A103",
    "A104",
    "A105",

    "B001",
    "B002",
    "B004",
    "B005",
    "B006",
    "B007",
    "B008",
    "B009",
    "B011",
    "B012",
    "B013",
    "B014",
    "B015",
    "B016",
    "B017",
    "B018",
    "B019",
    "B020",
    "B021",
    "B022",

    "C01",
    "C02"

];


groundFloorIds.forEach(
    (id, i) => {

        if (
            !campusState.rooms.some(
                r =>
                    r.id === id &&
                    r.floor === "Ground Floor"
            )
        ) {

            const block =
                id.startsWith("A")
                    ? "A Block"
                    : id.startsWith("B")
                        ? "B Block"
                        : "C Block";


            const r =
                room(
                    id,
                    "Ground Floor",
                    block,
                    i % 3 === 1
                );


            r.appliances = {

                light: r.light,

                fan: r.fan,

                ac: r.ac

            };


            r.powerModel = {

                light: 0,

                fan: 0,

                ac: 0,

                total: 0

            };


            r.emptySince =
                r.occupied
                    ? null
                    : Date.now();


            r.autoOffTriggered = false;


            campusState.rooms.push(r);

        }

    }
);


// ======================================================
// HELPER
// ======================================================

function syncRoomAppliances(room) {

    room.light =
        !!room.appliances?.light;

    room.fan =
        !!room.appliances?.fan;

    room.ac =
        !!room.appliances?.ac;

}


// ======================================================
// BACKEND → FRONTEND SYNC
// ======================================================

async function syncFromBackend() {

    try {

        const healthResponse = await fetch(
            `${BACKEND_URL}/api/health`,
            { cache: "no-store" }
        );
        if (!healthResponse.ok) throw new Error(`Backend health HTTP ${healthResponse.status}`);

        const response =
            await fetch(
                `${BACKEND_URL}/api/rooms`,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Backend HTTP ${response.status}`
            );

        }


        const backendRooms =
            await response.json();

        const [summaryResponse, energyResponse, alertsResponse] = await Promise.all([
            fetch(`${BACKEND_URL}/api/dashboard/summary`, { cache: "no-store" }),
            fetch(`${BACKEND_URL}/api/analytics/energy`, { cache: "no-store" }),
            fetch(`${BACKEND_URL}/api/alerts`, { cache: "no-store" })
        ]);
        if (!summaryResponse.ok || !energyResponse.ok || !alertsResponse.ok) throw new Error("Backend analytics request failed");
        const summary = await summaryResponse.json();
        const energy = await energyResponse.json();
        const liveAlerts = await alertsResponse.json();

        // The backend room list is the single source of truth. Replace the
        // local demo collection so every dashboard/page view uses the same set.
        Campus.rooms = Object.entries(backendRooms).map(([id, data]) => ({
            id,
            campus: "Campus 25",
            floor: data.floor || "First Floor",
            block: data.block || "A Block",
            building: data.block || "A Block",
            occupied: !!data.occupied,
            temperature: Number(data.temperature || 0),
            humidity: Number(data.humidity || 0),
            light: !!data.light,
            fan: !!data.fan,
            ac: !!data.ac,
            power: Number(data.power || 0),
            energyToday: Number(data.energyToday || 0),
            warning: liveAlerts.some(alert => alert.roomId === id && !alert.resolved),
            appliances: { light: !!data.light, fan: !!data.fan, ac: !!data.ac },
            powerModel: {
                light: data.light ? 0.08 : 0,
                fan: data.fan ? 0.07 : 0,
                ac: data.ac ? 1.2 : 0,
                total: Number(data.power || 0)
            }
        }));


        Object.entries(
            backendRooms
        ).forEach(
            ([roomId, backendRoom]) => {

                const frontendRoom =
                    campusState.rooms.find(
                        r => r.id === roomId
                    );


                if (!frontendRoom) {

                    return;

                }


                frontendRoom.occupied =
                    !!backendRoom.occupied;


                frontendRoom.temperature =
                    Number(
                        backendRoom.temperature
                    );


                frontendRoom.light =
                    !!backendRoom.light;


                frontendRoom.fan =
                    !!backendRoom.fan;


                frontendRoom.ac =
                    !!backendRoom.ac;


                frontendRoom.power =
                    Number(
                        backendRoom.power || 0
                    );


                frontendRoom.appliances = {

                    light:
                        !!backendRoom.light,

                    fan:
                        !!backendRoom.fan,

                    ac:
                        !!backendRoom.ac

                };


                frontendRoom.powerModel = {

                    light:
                        backendRoom.light
                            ? 0.08
                            : 0,

                    fan:
                        backendRoom.fan
                            ? 0.07
                            : 0,

                    ac:
                        backendRoom.ac
                            ? 1.2
                            : 0,

                    total:
                        Number(
                            backendRoom.power || 0
                        )

                };

            }
        );


        // Campus total power
        campusState.totalPower =
            Object.values(
                backendRooms
            ).reduce(
                (total, r) =>
                    total +
                    Number(r.power || 0),
                0
            );


        campusState.totalPower =
            Number(
                campusState.totalPower.toFixed(2)
            );


        campusState.lastUpdated =
            Date.now();

        Campus.energyToday = Number(energy.totalEnergyToday || summary.energyToday || 0);
        Campus.energySavedToday = Number(energy.energySavedToday || summary.energySavedToday || 0);
        Campus.totalPower = Number(summary.totalPower ?? energy.totalPower ?? campusState.totalPower);
        Campus.alertObjects = liveAlerts;
        Campus.alerts = liveAlerts.map(a => [a.severity || "warning", a.type || "alert", a.message || "", a.timestamp || ""]);
        Campus.energyAnalytics = {
            summary,
            analytics: energy,
            alerts: liveAlerts
        };
        Campus.backendReady = true;
        const status = document.querySelector("#backendStatus");
        if (status) { status.textContent = "● ONLINE"; status.style.color = "#22c55e"; }


        // Update dashboard
        refreshDashboardLive();


        // Update rooms page if available
        if (
            typeof window.refreshRoomsLive ===
            "function"
        ) {

            window.refreshRoomsLive();

        }

        if (
            typeof window.refreshEnergyLive ===
            "function"
        ) {

            window.refreshEnergyLive();

        }


    } catch (error) {

        console.error(
            "Backend connection error:",
            error
        );
        const status = document.querySelector("#backendStatus");
        if (status) { status.textContent = "● OFFLINE"; status.style.color = "#f87171"; }
        const energyStatus = document.querySelector("#energyStatus");
        if (energyStatus) { energyStatus.textContent = "● OFFLINE"; energyStatus.style.color = "#EF4444"; }

    }

}


// ======================================================
// BACKEND UPDATE HELPER
// ======================================================

async function updateBackendRoom(
    roomId,
    data
) {

    try {

        const response =
            await fetch(
                `${BACKEND_URL}/api/rooms/${roomId}`,
                {

                    method: "PATCH",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(data)

                }
            );


        if (!response.ok) {

            throw new Error(
                `Backend update failed: ${response.status}`
            );

        }


        const result =
            await response.json();


        return result.room;

    } catch (error) {

        console.error(
            "Backend update error:",
            error
        );


        return null;

    }

}


// ======================================================
// DEVICE UPDATE
// ======================================================

async function updateBackendDevice(
    roomId,
    device,
    state
) {
    try {

        const response = await fetch(
            `${BACKEND_URL}/api/rooms/${roomId}/device`,
            {
                method: "PATCH",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    device: device,
                    state: state === true
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                `Device update failed: ${response.status}`
            );
        }

        const result = await response.json();

        // Backend is the ONLY source of truth for alerts.
        // Fetch fresh alerts immediately after device update.
        const alertsResponse = await fetch(
            `${BACKEND_URL}/api/alerts`,
            {
                cache: "no-store"
            }
        );

        if (alertsResponse.ok) {

            const alerts =
                await alertsResponse.json();

            Campus.alertObjects =
                Array.isArray(alerts)
                    ? alerts
                    : [];

            Campus.alerts =
                Campus.alertObjects.map(
                    alert => [
                        alert.severity || "warning",
                        alert.roomId ||
                            alert.type ||
                            "alert",
                        alert.message || "",
                        alert.timestamp || ""
                    ]
                );
        }

        return result.room;

    } catch (error) {

        console.error(
            "Device update error:",
            error
        );

        return null;
    }
}

// ======================================================
// SAVE LOCAL UI STATE
// ======================================================

function saveLocalState() {

    campusState.lastUpdated =
        Date.now();


    localStorage.setItem(
        CAMPUS_STORE_KEY,
        JSON.stringify(campusState)
    );


    window.dispatchEvent(
        new CustomEvent(
            "campus-state-change"
        )
    );

}


// ======================================================
// SIMULATION ENGINE
// ======================================================

const SimulationEngine = {

    timer: null,


    sync(room) {

        syncRoomAppliances(room);


        room.powerModel = {

            light:
                room.light
                    ? 0.08
                    : 0,

            fan:
                room.fan
                    ? 0.07
                    : 0,

            ac:
                room.ac
                    ? 1.2
                    : 0,

            total: 0

        };


        room.powerModel.total =
            Number(
                (
                    room.powerModel.light +
                    room.powerModel.fan +
                    room.powerModel.ac +
                    (room.spikePower || 0)
                ).toFixed(2)
            );


        room.power =
            room.powerModel.total;

    },


    recalc() {

        campusState.totalPower = 0;


        campusState.rooms.forEach(
            room => {

                this.sync(room);

                campusState.totalPower +=
                    Number(
                        room.power || 0
                    );

            }
        );


        campusState.totalPower =
            Number(
                campusState.totalPower.toFixed(2)
            );

    },


    save() {

        saveLocalState();

    },


    alert(
        roomId,
        type,
        severity,
        message
    ) {

        if (
            campusState.alertObjects.some(
                a =>
                    a.roomId === roomId &&
                    a.type === type &&
                    !a.resolved
            )
        ) {

            return;

        }


        campusState.alertObjects.unshift({

            id: Date.now(),

            roomId,

            type,

            severity,

            message,

            timestamp: Date.now(),

            resolved: false

        });


        campusState.alerts.unshift([

            severity === "critical"
                ? "warning"
                : severity,

            roomId,

            message,

            "just now"

        ]);

    },


    resolve(
        roomId,
        type
    ) {

        campusState.alertObjects

            .filter(
                a =>
                    a.roomId === roomId &&
                    a.type === type
            )

            .forEach(
                a =>
                    a.resolved = true
            );

    },


    async toggleAppliance(
    id,
    device
) {

    const r =
        campusState.rooms.find(
            x => x.id === id
        );

    if (!r) {
        return;
    }

    const newState =
        !r.appliances[device];

    // Send device change to production backend first.
    const backendRoom =
        await updateBackendDevice(
            id,
            device,
            newState
        );

    if (!backendRoom) {
        return;
    }

    // Backend response is the source of truth.
    r.occupied =
        !!backendRoom.occupied;

    r.light =
        !!backendRoom.light;

    r.fan =
        !!backendRoom.fan;

    r.ac =
        !!backendRoom.ac;

    r.power =
        Number(
            backendRoom.power || 0
        );

    r.appliances = {
        light:
            !!backendRoom.light,

        fan:
            !!backendRoom.fan,

        ac:
            !!backendRoom.ac
    };

    // Refresh dashboard immediately.
    refreshDashboardLive();

    // Save UI state.
    saveLocalState();

    return backendRoom;

},


    async setOccupancy(
        id,
        occupied
    ) {

        const r =
            campusState.rooms.find(
                x => x.id === id
            );


        if (!r) {

            return;

        }


        const backendRoom =
            await updateBackendRoom(
                id,
                {
                    occupied
                }
            );


        if (!backendRoom) {

            return;

        }


        r.occupied =
            !!backendRoom.occupied;

        r.temperature =
            Number(
                backendRoom.temperature
            );

        r.light =
            !!backendRoom.light;

        r.fan =
            !!backendRoom.fan;

        r.ac =
            !!backendRoom.ac;

        r.power =
            Number(
                backendRoom.power || 0
            );


        r.appliances = {

            light:
                !!backendRoom.light,

            fan:
                !!backendRoom.fan,

            ac:
                !!backendRoom.ac

        };


        refreshDashboardLive();

        saveLocalState();

    },


    async spike() {

        const r =
            campusState.rooms.find(
                x => x.id === "A104"
            );


        if (!r) {

            return;

        }


        r.spikePower = 1.75;

        r.warning = true;


        this.alert(
            r.id,
            "energy",
            "critical",
            `${r.id} is consuming unusually high energy (rule-based anomaly).`
        );


        this.recalc();

        this.save();


        toast(
            `Energy spike simulated in ${r.id}`
        );


        setTimeout(
            () => {

                r.spikePower = 0;

                r.warning = false;

                this.resolve(
                    r.id,
                    "energy"
                );


                this.recalc();

                this.save();

            },
            30000
        );

    },


    start() {

        console.log(
            "Backend live mode active."
        );


        campusState.simulationRunning =
            true;


        clearInterval(
            this.timer
        );


        this.timer =
            setInterval(
                syncFromBackend,
                SIMULATION_INTERVAL
            );


        syncFromBackend();

    },


    pause() {

        campusState.simulationRunning =
            false;


        clearInterval(
            this.timer
        );


        this.timer = null;

    },


    reset() {

        localStorage.removeItem(
            CAMPUS_STORE_KEY
        );


        location.reload();

    },


    demo() {

        const r =
            campusState.rooms.find(
                x => x.id === "A104"
            );


        if (!r) {

            return;

        }


        // Start demo with appliances ON
        updateBackendRoom(
            "A104",
            {
                occupied: false,
                light: true,
                fan: true,
                ac: false
            }
        );


        toast(
            "Demo started: A104 empty-room automation sequence running."
        );


        setTimeout(
            syncFromBackend,
            1000
        );

    }

};


// ======================================================
// GLOBAL ACCESS
// ======================================================

window.campusState =
    campusState;

window.SimulationEngine =
    SimulationEngine;

window.syncFromBackend =
    syncFromBackend;

window.updateBackendRoom =
    updateBackendRoom;

window.updateBackendDevice =
    updateBackendDevice;


// ======================================================
// START BACKEND SYNC
// ======================================================

// IMPORTANT:
// Do NOT start the old frontend simulation.
// Backend is now the source of truth.

syncFromBackend();

setInterval(
    syncFromBackend,
    2000
);


// ======================================================
// NAVIGATION
// ======================================================

const nav = [

    [
        "dashboard.html",
        "Dashboard",
        "dashboard"
    ],

    [
        "campus-map.html",
        "Campus Map",
        "map"
    ],

    [
        "rooms.html",
        "Rooms",
        "rooms"
    ],

    [
        "energy.html",
        "Energy Analytics",
        "energy"
    ],

    [
        "alerts.html",
        "Alerts",
        "alerts"
    ],

    [
        "ai-insights.html",
        "AI Insights",
        "ai"
    ]

];


// ======================================================
// COMMON SHELL
// ======================================================

function shell(
    title,
    subtitle,
    content
) {

    app.innerHTML = `

        <div class="shell">

            <aside
                class="sidebar"
                id="sidebar"
            >

                <div class="logo">
                    <span>⚡</span>
                    Smart Campus
                </div>


                <nav class="nav">

                    ${nav.map(
                        n => `

                        <a
                            class="${page === n[2] ? "active" : ""}"
                            href="${n[0]}"
                        >
                            ${n[1]}
                        </a>

                    `
                    ).join("")}

                </nav>


                <nav class="nav nav-bottom">

                    <a href="settings.html">
                        ⚙ Settings
                    </a>

                    <a
                        href="index.html"
                        id="logout"
                    >
                        ↪ Logout
                    </a>

                </nav>

            </aside>


            <main class="main">

                <header class="header">

                    <div>

                        <button
                            class="menu"
                            id="menu"
                        >
                            ☰
                        </button>

                        <h1>
                            ${title}
                        </h1>

                        <p>
                            ${subtitle}
                        </p>

                    </div>


                    <div class="profile">

                        <span id="localClock"></span>

                        🔔

                        <div class="avatar">
                            A
                        </div>

                        <span>
                            Admin
                        </span>

                    </div>

                </header>


                <section class="content">

                    ${content}

                </section>

            </main>

        </div>

    `;


    const updateClock = () => {

        const clock =
            document.querySelector(
                "#localClock"
            );


        if (clock) {

            clock.textContent =
                DateTime.time();

        }

    };


    updateClock();


    setInterval(
        updateClock,
        1000
    );


    const menu =
        document.querySelector(
            "#menu"
        );


    const sidebar =
        document.querySelector(
            "#sidebar"
        );


    const logout =
        document.querySelector(
            "#logout"
        );


    menu?.addEventListener(
        "click",
        () =>
            sidebar.classList.toggle(
                "open"
            )
    );


    logout?.addEventListener(
        "click",
        () =>
            sessionStorage.removeItem(
                "smartCampusLogin"
            )
    );

}


// ======================================================
// BADGE
// ======================================================

function badge(
    value,
    type
) {

    return `

        <span
            class="badge ${type || String(value).toLowerCase()}"
        >
            ${value}
        </span>

    `;

}


// ======================================================
// ROOM POWER
// ======================================================

function roomPower(r) {

    return r.power || 0;

}


// ======================================================
// TOAST
// ======================================================

function toast(msg) {

    const e =
        document.createElement(
            "div"
        );


    e.className = "toast";

    e.textContent = msg;


    document.body.append(e);


    setTimeout(
        () => e.remove(),
        2800
    );

}


// ======================================================
// DASHBOARD HTML
// ======================================================

function dashboardHTML() {

    const occupied =
        Campus.rooms.filter(
            r => r.occupied
        ).length;


    const alerts =
        (
            Campus.alertObjects || []
        ).filter(
            a => !a.resolved
        ).length;


    return `
        <div id="backendStatus" style="font-size:12px;color:#22c55e;margin-bottom:10px">● ONLINE</div>

        <div class="kpis">

            ${[

                [
                    "▦",
                    "Rooms Occupied",
                    `${occupied} / ${Campus.rooms.length}`,
                    "Live occupancy"
                ],

                [
                    "◉",
                    "Live Load",
                    `${Campus.totalPower.toFixed(2)} kW`,
                    "Current campus load"
                ],

                [
                    "⚡",
                    "Energy Today",
                    `${Campus.energyToday.toFixed(2)} kWh`,
                    "₹" +
                    (
                        Campus.energyToday *
                        ENERGY_RATE
                    ).toFixed(0)
                ],

                [
                    "↘",
                    "Energy Saved",
                    `${Campus.energySavedToday.toFixed(3)} kWh`,
                    "₹" +
                    Campus.estimatedCostSaved +
                    " saved"
                ],

                [
                    "!",
                    "Active Alerts",
                    alerts,
                    "Unresolved alerts"
                ]

            ].map(
                k => `

                    <div class="card">

                        <div class="kpi-head">

                            <span>
                                ${k[1]}
                            </span>

                            <span class="kpi-icon">
                                ${k[0]}
                            </span>

                        </div>


                        <div class="value">
                            ${k[2]}
                        </div>


                        <div class="sub">
                            ${k[3]}
                        </div>

                    </div>

                `
            ).join("")}

        </div>


        <div class="layout">

            <div class="card">

                <div class="section-title">

                    <h2>
                        Live Room Status
                    </h2>

                    <a href="rooms.html">
                        View all rooms →
                    </a>

                </div>


                <div class="table-wrap">

                    <table class="table">

                        <thead>

                            <tr>

                                <th>ROOM</th>

                                <th>LOCATION</th>

                                <th>OCCUPANCY</th>

                                <th>TEMP.</th>

                                <th>LIGHT</th>

                                <th>FAN</th>

                                <th>AC</th>

                                <th>POWER</th>

                            </tr>

                        </thead>


                        <tbody>

                            ${Campus.rooms
                                .slice(0, 6)
                                .map(
                                    r => `

                                    <tr
                                        class="clickable"
                                        data-room="${r.id}"
                                    >

                                        <td>
                                            <strong>
                                                ${r.id}
                                            </strong>
                                        </td>


                                        <td>
                                            ${r.block}
                                        </td>


                                        <td>
                                            ${badge(
                                                r.occupied
                                                    ? "Occupied"
                                                    : "Empty",
                                                r.occupied
                                                    ? "occupied"
                                                    : "empty"
                                            )}
                                        </td>


                                        <td>
                                            ${r.temperature}°C
                                        </td>


                                        <td>
                                            ${badge(
                                                r.light
                                                    ? "ON"
                                                    : "OFF",
                                                r.light
                                                    ? "on"
                                                    : "off"
                                            )}
                                        </td>


                                        <td>
                                            ${badge(
                                                r.fan
                                                    ? "ON"
                                                    : "OFF",
                                                r.fan
                                                    ? "on"
                                                    : "off"
                                            )}
                                        </td>


                                        <td>
                                            ${badge(
                                                r.ac
                                                    ? "ON"
                                                    : "OFF",
                                                r.ac
                                                    ? "on"
                                                    : "off"
                                            )}
                                        </td>


                                        <td>
                                            ${Number(
                                                r.power || 0
                                            ).toFixed(2)}
                                            kW
                                        </td>

                                    </tr>

                                `
                                )
                                .join("")}

                        </tbody>

                    </table>

                </div>

            </div>


            <div class="card">

                <div class="section-title">

                    <h2>
                        Recent Alerts
                    </h2>

                    <a href="alerts.html">
                        View all
                    </a>

                </div>


                <div class="alerts">

                    ${Campus.alerts
                        .slice(0, 4)
                        .map(
                            a => `

                            <div class="alert">

                                <strong>
                                    ${a[1]} ·
                                    ${a[0].toUpperCase()}
                                </strong>

                                <p>
                                    ${a[2]}
                                </p>

                                <small>
                                    ${a[3]}
                                </small>

                            </div>

                        `
                        )
                        .join("")}

                </div>

            </div>

        </div>

    `;

}


// ======================================================
// LIVE DASHBOARD REFRESH
// ======================================================

function refreshDashboardLive() {

    if (
        page !== "dashboard"
    ) {

        return;

    }


    const rows =
        document.querySelector(
            ".table tbody"
        );


    if (rows) {

        rows.innerHTML =
            Campus.rooms
                .slice(0, 6)
                .map(
                    r => `

                    <tr
                        class="clickable"
                        data-room="${r.id}"
                    >

                        <td>
                            <strong>
                                ${r.id}
                            </strong>
                        </td>


                        <td>
                            ${r.block}
                        </td>


                        <td>

                            ${badge(
                                r.occupied
                                    ? "Occupied"
                                    : "Empty",

                                r.occupied
                                    ? "occupied"
                                    : "empty"
                            )}

                        </td>


                        <td>
                            ${r.temperature}°C
                        </td>


                        <td>

                            ${badge(
                                r.light
                                    ? "ON"
                                    : "OFF",

                                r.light
                                    ? "on"
                                    : "off"
                            )}

                        </td>


                        <td>

                            ${badge(
                                r.fan
                                    ? "ON"
                                    : "OFF",

                                r.fan
                                    ? "on"
                                    : "off"
                            )}

                        </td>


                        <td>

                            ${badge(
                                r.ac
                                    ? "ON"
                                    : "OFF",

                                r.ac
                                    ? "on"
                                    : "off"
                            )}

                        </td>


                        <td>

                            ${Number(
                                r.power || 0
                            ).toFixed(2)}
                            kW

                        </td>

                    </tr>

                `
                )
                .join("");

    }


    const values =
        document.querySelectorAll(
            ".kpis .value"
        );


    const occupied =
        Campus.rooms.filter(
            r => r.occupied
        ).length;


    const alerts =
        (
            campusState.alertObjects || []
        ).filter(
            a => !a.resolved
        ).length;


    if (values[0]) {

        values[0].textContent =
            occupied +
            " / " +
            Campus.rooms.length;

    }


    if (values[1]) {

        values[1].textContent =
            Campus.totalPower.toFixed(2) +
            " kW";

    }


    if (values[2]) {

        values[2].textContent =
            Campus.energyToday.toFixed(2) +
            " kWh";

    }


    if (values[3]) {

        values[3].textContent =
            Campus.energySavedToday.toFixed(3) +
            " kWh";

    }


    if (values[4]) {

        values[4].textContent =
            alerts;

    }


    document
        .querySelectorAll(
            "[data-room]"
        )
        .forEach(
            element => {

                element.onclick =
                    () => {

                        location.href =
                            "rooms.html?room=" +
                            encodeURIComponent(
                                element.dataset.room
                            );

                    };

            }
        );

}


// ======================================================
// SETTINGS
// ======================================================

function settingsPage() {

    shell(
        "Settings",
        "Manage your campus preferences.",

        `

        <div class="settings">

            <div class="card">

                <h2>
                    Campus Information
                </h2>


                <div class="setting-grid">

                    <label>

                        Campus Name

                        <input
                            value="Campus 25"
                        >

                    </label>


                    <label>

                        Admin Email

                        <input
                            value="admin@smartcampus.com"
                        >

                    </label>

                </div>

            </div>


            <div class="card">

                <h2>
                    Automation
                </h2>


                <div class="setting-line">

                    <span>
                        Auto turn-off in empty rooms
                    </span>


                    <button
                        class="switch ${campusState.automationEnabled ? "on" : ""}"
                        id="automationToggle"
                    >
                    </button>

                </div>

            </div>

        </div>

        `
    );


    const automationToggle =
        document.querySelector(
            "#automationToggle"
        );


    automationToggle?.addEventListener(
        "click",
        () => {

            campusState.automationEnabled =
                !campusState.automationEnabled;


            automationToggle.classList.toggle(
                "on"
            );


            saveLocalState();

        }
    );

}


// ======================================================
// LOGIN
// ======================================================

const loginForm =
    document.querySelector(
        "#loginForm"
    );


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async e => {

            e.preventDefault();


            const email =
                document.querySelector(
                    "#email"
                );


            const password =
                document.querySelector(
                    "#password"
                );


            const loginError =
                document.querySelector(
                    "#loginError"
                );


            if (
                email.value.trim() ===
                    "admin@smartcampus.com" &&
                password.value ===
                    "admin123"
            ) {

                sessionStorage.smartCampusLogin =
                    "true";


                location.href =
                    "dashboard.html";

            } else {

                if (loginError) {

                    loginError.textContent =
                        "Use the provided demo credentials.";

                }

            }

        }
    );

}


// ======================================================
// DASHBOARD
// ======================================================

if (
    page === "dashboard"
) {

    shell(
        "Campus 25 Dashboard",
        "Here's what's happening across Campus 25 today.",
        dashboardHTML()
    );


    content.insertAdjacentHTML(
        "afterbegin",

        `

        <div class="campus-context card">

            <div>

                <span class="eyebrow">
                    ACTIVE CAMPUS
                </span>


                <strong>

                    Campus 25

                    <span class="live-indicator">
                        ● LIVE
                    </span>

                </strong>


                <p class="sub">

                    Last updated:

                    <span id="lastUpdated">
                        ${DateTime.relative(
                            campusState.lastUpdated ||
                            Date.now()
                        )}
                    </span>

                </p>

            </div>


            <a
                class="btn primary"
                href="campus-map.html"
            >
                Open Campus Map
            </a>

        </div>


        <div class="simulation-controls card">

            <strong>
                Backend Controls
            </strong>

            <span class="sub">
                Connected to Smart Campus Backend
            </span>


            <div>

                <button
                    class="btn filter"
                    data-sim="start"
                >
                    Start Live Sync
                </button>


                <button
                    class="btn filter"
                    data-sim="pause"
                >
                    Pause Sync
                </button>


                <button
                    class="btn filter"
                    data-sim="occupancy"
                >
                    Toggle A104
                </button>


                <button
                    class="btn filter"
                    data-sim="spike"
                >
                    Energy Spike
                </button>


                <button
                    class="btn filter"
                    data-sim="demo"
                >
                    Run Demo Scenario
                </button>


                <button
                    class="btn filter"
                    data-sim="reset"
                >
                    Reset
                </button>

            </div>

        </div>

        `
    );


    refreshDashboardLive();


    document
        .querySelectorAll(
            "[data-sim]"
        )
        .forEach(
            button => {

                button.onclick =
                    async () => {

                        const action =
                            button.dataset.sim;


                        if (
                            action ===
                            "start"
                        ) {

                            SimulationEngine.start();

                        }

                        else if (
                            action ===
                            "pause"
                        ) {

                            SimulationEngine.pause();

                        }

                        else if (
                            action ===
                            "occupancy"
                        ) {

                            const r =
                                Campus.rooms.find(
                                    r =>
                                        r.id ===
                                        "A104"
                                );


                            if (r) {

                                await SimulationEngine.setOccupancy(
                                    r.id,
                                    !r.occupied
                                );

                            }

                        }

                        else if (
                            action ===
                            "spike"
                        ) {

                            await SimulationEngine.spike();

                        }

                        else if (
                            action ===
                            "demo"
                        ) {

                            SimulationEngine.demo();

                        }

                        else if (
                            action ===
                            "reset"
                        ) {

                            SimulationEngine.reset();

                        }


                        if (
                            action !==
                            "reset"
                        ) {

                            toast(
                                "Action applied"
                            );

                        }

                    };

            }
        );


    window.addEventListener(
        "campus-state-change",
        refreshDashboardLive
    );


    setInterval(
        () => {

            const el =
                document.querySelector(
                    "#lastUpdated"
                );


            if (el) {

                el.textContent =
                    DateTime.relative(
                        campusState.lastUpdated ||
                        Date.now()
                    );

            }

        },
        1000
    );

}


// ======================================================
// SETTINGS PAGE
// ======================================================

if (
    page === "settings"
) {

    settingsPage();

}


// ======================================================
// AI INSIGHTS
// ======================================================

if (
    page === "ai"
) {

    shell(

        "AI Insights",

        "Demo insights based on Campus 25 patterns.",

        `

        <div class="page-heading">

            <div>

                <h2>

                    AI Energy Insights

                    <span class="demo-badge">
                        DEMO / SIMULATED
                    </span>

                </h2>


                <p class="muted">
                    Rule-based prototype insights — no real AI model is running.
                </p>

            </div>

        </div>


        <div class="ai-grid">

            ${[

                [
                    "Occupancy Prediction",
                    "A101",
                    "2 PM – 3 PM",
                    "Predicted occupancy: 12%"
                ],

                [
                    "Energy Forecast",
                    "Tomorrow",
                    "Expected campus use",
                    "368 kWh"
                ],

                [
                    "Saving Opportunity",
                    "A104",
                    "Automation status",
                    "Empty-room control can reduce wastage."
                ],

                [
                    "Rule-based Anomaly",
                    "A104",
                    "Consumption pattern",
                    "Use Energy Spike for a demonstration."
                ]

            ].map(
                x => `

                <article class="card">

                    <span class="kpi-icon">
                        ✦
                    </span>

                    <h3>
                        ${x[0]}
                    </h3>

                    <strong>
                        ${x[1]}
                    </strong>

                    <p class="muted">
                        ${x[2]}
                    </p>

                    <p>
                        ${x[3]}
                    </p>

                </article>

            `
            ).join("")}

        </div>

        `

    );

}
