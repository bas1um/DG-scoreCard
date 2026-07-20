// ==========================================
// 1. GLOBALA FUNKTIONER (Används på ny-bana.html)
// ==========================================

// Registrera Service Worker för PWA-stöd (Android-krav)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(reg => console.log("Service Worker aktiv!", reg.scope))
      .catch(err => console.log("Service Worker kunde inte registreras:", err));
  });
}
// Skapa korgar efter valt antal med synliga nummer och förvalt par 3
function addInputFields(number) {
    const container = document.getElementById("input-container");
    if (!container) return;

    container.innerHTML = ''; // Rensa gamla korgar

    for (let i = 1; i <= number; i++) {
        // Skapa en behållare för varje korg så siffra och input hänger ihop
        let korgBox = document.createElement("div");
        korgBox.className = "korg-input-box";

        // Skapa den kronologiska siffran
        let label = document.createElement("span");
        label.innerText = "Korg " + i;

        // Skapa själva inputfältet för par
        let input = document.createElement("input");
        input.type = "number";
        input.name = "korg" + i;
        input.min = "1";
        input.value = "3"; // Par 3 som standard!

        // Lägg till siffra och input i lådan, och sedan ut på sidan
        korgBox.appendChild(label);
        korgBox.appendChild(input);
        container.appendChild(korgBox);
    }
}
// Går tillbaka till startsidan
function goBack() {
    window.location.href = "index.html";
}

// Sparar banan och dess korg-par till LocalStorage
function saveAndRedirect() {
    const newListInput = document.getElementById('ban-namn-input');
    const listName = newListInput ? newListInput.value.trim() : '';

    if (listName === '') {
        alert("Vänligen fyll i ett namn på banan.");
        return;
    }

    // Hämta alla skapade korg-inputs
    const korgInputs = document.querySelectorAll('#input-container input');
    const holes = [];

    // Loopa igenom alla korgar och spara deras par-värde
    korgInputs.forEach((input, index) => {
        holes.push({
            hole: index + 1,
            par: parseInt(input.value) || 3 // Tar inskrivet par, annars standard par 3
        });
    });

    // Skapa det nya ban-objektet
    const newCourse = { 
        id: Date.now().toString(), 
        name: listName, 
        holes: holes 
    };

    // Hämta gamla banor, lägg till den nya och spara i LocalStorage
    const LOCAL_STORAGE_LIST_KEY = 'task.lists';
    let lists = JSON.parse(localStorage.getItem(LOCAL_STORAGE_LIST_KEY)) || [];
    lists.push(newCourse);
    localStorage.setItem(LOCAL_STORAGE_LIST_KEY, JSON.stringify(lists));

    // Sätt den nya banan som automatiskt vald när man kommer tillbaka till startsidan
    localStorage.setItem('task.selectedListId', newCourse.id);

    // Skicka tillbaka användaren till startsidan
    window.location.href = "index.html";
}


// ==========================================
// 2. SIDSPECIFIK LOGIK (Körs när sidan laddats)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // Hämtar element (dessa finns bara på index.html)
    let menuToggle = document.querySelector('.player-num');
    let addplayer = document.querySelector('.addplayer');
    let spelarNamnContainer = document.getElementById('spelarNamnContainer');
    const list = document.querySelectorAll('.addplayer li');
    const courseDropdown = document.getElementById('courseDropdown');
    const deleteListButton = document.querySelector('[data-delete-list-button]');
    const startBtn = document.getElementById('startBtn');

    // LocalStorage-nycklar
    const LOCAL_STORAGE_LIST_KEY = 'task.lists';
    const LOCAL_STORAGE_SELECTED_LIST_ID_KEY = 'task.selectedListId';
    let lists = JSON.parse(localStorage.getItem(LOCAL_STORAGE_LIST_KEY)) || [];
    let selectedListId = localStorage.getItem(LOCAL_STORAGE_SELECTED_LIST_ID_KEY);

    // --- LOGIK ENBART FÖR STARTSIDAN (INDEX.HTML) ---
    
    // Säkerställ att elementen finns innan vi lägger till klick-event (så det inte kraschar på ny-bana.html)
    if (menuToggle && addplayer) {
        menuToggle.onclick = function () {
            addplayer.classList.toggle('active');
            menuToggle.classList.toggle('active');
        }
    }

    // Hantera val av antal spelare (Cirkelmenyn)
    if (list.length > 0 && spelarNamnContainer) {
        function activeLink() {
            list.forEach((item) => item.classList.remove('active'));
            this.classList.add("active");

            spelarNamnContainer.innerHTML = '';
            let selectedPlayerNumber = parseInt(this.querySelector('button').textContent);

            for (let i = 0; i < selectedPlayerNumber; i++) {
                let inputField = document.createElement('input');
                inputField.type = 'text';
                inputField.placeholder = 'Spelare ' + (i + 1);
                spelarNamnContainer.appendChild(inputField);
            }
        }

        list.forEach((item) => item.addEventListener("click", activeLink));

        // Förval: Ladda 1 spelare direkt vid start
        const defaultActive = document.querySelector('.addplayer li.active');
        if (defaultActive) {
            activeLink.call(defaultActive);
        }
    }

    // Banhantering i Dropdownen på startsidan
    if (courseDropdown) {
        function renderCourses() {
            courseDropdown.innerHTML = '<option value="" disabled selected>-- Välj bana --</option>';
            
            lists.forEach(list => {
                const option = document.createElement('option');
                option.value = list.id;
                option.innerText = list.name;
                if (list.id === selectedListId) {
                    option.selected = true;
                }
                courseDropdown.appendChild(option);
            });
        }
        
        renderCourses();

        courseDropdown.addEventListener('change', e => {
            selectedListId = e.target.value;
            localStorage.setItem(LOCAL_STORAGE_SELECTED_LIST_ID_KEY, selectedListId);
        });

        if (deleteListButton) {
            deleteListButton.addEventListener('click', e => {
                if (!selectedListId) return alert("Välj en bana du vill ta bort först!");
                
                lists = lists.filter(list => list.id !== selectedListId);
                selectedListId = null;
                localStorage.setItem(LOCAL_STORAGE_LIST_KEY, JSON.stringify(lists));
                localStorage.setItem(LOCAL_STORAGE_SELECTED_LIST_ID_KEY, selectedListId);
                renderCourses();
            });
        }
    }

    // Packa ihop all data inför rundan och skicka till spela.html
    if (startBtn && courseDropdown) {
        startBtn.addEventListener('click', (e) => {
            if (!courseDropdown.value) {
                e.preventDefault(); 
                alert("Du måste välja en bana först!");
                return;
            }

            const inputFields = document.querySelectorAll('.spelar-namn input');
            let players = [];
            
            inputFields.forEach((input, index) => {
                let name = input.value.trim() || `Spelare ${index + 1}`;
                players.push({
                    id: index + 1,
                    name: name,
                    scores: {} // Här sparas poängen sen, t.ex. { "1": 3, "2": 4 }
                });
            });

            // Hitta hela banobjektet (så vi får med hålen och deras par!)
            const activeCourse = lists.find(l => l.id === courseDropdown.value);

            const currentRound = {
                course: activeCourse,
                players: players,
                startTime: new Date().toISOString()
            };

            localStorage.setItem('activeRound', JSON.stringify(currentRound));
        });
    }

    // --- LOGIK ENBART FÖR SKAPA BANA (NY-BANA.HTML) ---
    // --- LOGIK ENBART FÖR SPELA RUNDA (SPELA.HTML) ---
    const courseTitle = document.getElementById('course-title');
    
    // Om vi är på spela.html så finns detta element i DOMen
    if (courseTitle) {
        // Hämta rundan som startades från LocalStorage
        let activeRound = JSON.parse(localStorage.getItem('activeRound'));

        // Om ingen runda är aktiv, skicka tillbaka till startsidan
        if (!activeRound) {
            window.location.href = "index.html";
            return;
        }

        let currentHoleIndex = 0; // Vi börjar alltid på första korgen (index 0)

        // Element-referenser på spela.html
        const holeNumberText = document.getElementById('hole-number');
        const holeParText = document.getElementById('hole-par');
        const playersListContainer = document.getElementById('players-list');
        const prevHoleBtn = document.getElementById('prev-hole-btn');
        const nextHoleBtn = document.getElementById('next-hole-btn');
        const endRoundBtn = document.getElementById('end-round-btn');

        // Sätt banans namn i headern
        courseTitle.innerText = activeRound.course.name;

        // Funktion för att räkna ut totalpoäng relativt till par för en spelare
        function calculateTotalRelativeScore(player) {
            let total = 0;
            // Loopa igenom alla hål som registrerats hittills i rundan
            activeRound.course.holes.forEach(h => {
                const score = player.scores[h.hole];
                if (score) {
                    total += (score - h.par);
                }
            });
            
            if (total === 0) return "E"; // Even par
            return total > 0 ? `+${total}` : `${total}`;
        }

        // Huvudfunktion för att rita ut korgen och spelarna
        function renderHole() {
            const currentHole = activeRound.course.holes[currentHoleIndex];
            
            // Uppdatera texten för korgnummer och par
            holeNumberText.innerText = `Korg ${currentHole.hole} / ${activeRound.course.holes.length}`;
            holeParText.innerText = `Par ${currentHole.par}`;

            // Rensa spelarlistan inför uppritning
            playersListContainer.innerHTML = '';

            // Rita ut varje spelare
            activeRound.players.forEach((player, pIndex) => {
                // Om spelaren inte har kastat på detta hål än, förvalda till hålets par (bekvämt!)
                if (!player.scores[currentHole.hole]) {
                    player.scores[currentHole.hole] = currentHole.par;
                }

                const currentScore = player.scores[currentHole.hole];
                const totalRelative = calculateTotalRelativeScore(player);

                // Skapa spelarkortet
                const playerCard = document.createElement('div');
                playerCard.className = 'player-card';

                playerCard.innerHTML = `
                    <div class="player-name-side">
                        <span class="p-name">${player.name}</span>
                        <span class="p-total">Totalt: ${totalRelative}</span>
                    </div>
                    <div class="stepper">
                        <button class="minus" data-p-index="${pIndex}">-</button>
                        <span class="current-score">${currentScore}</span>
                        <button class="plus" data-p-index="${pIndex}">+</button>
                    </div>
                `;

                playersListContainer.appendChild(playerCard);
            });

            // Spara ändringar i LocalStorage så man inte förlorar data om sidan laddas om
            localStorage.setItem('activeRound', JSON.stringify(activeRound));
        }

        // Lyssna på klick för Plus/Minus (använder event delegation eftersom knapparna skapas dynamiskt)
        playersListContainer.addEventListener('click', e => {
            const currentHole = activeRound.course.holes[currentHoleIndex];
            const pIndex = e.target.getAttribute('data-p-index');
            
            if (pIndex === null) return; // Klickade inte på en knapp

            if (e.target.classList.contains('plus')) {
                activeRound.players[pIndex].scores[currentHole.hole]++;
            } else if (e.target.classList.contains('minus')) {
                // Hindra spelaren från att gå under 1 kast
                if (activeRound.players[pIndex].scores[currentHole.hole] > 1) {
                    activeRound.players[pIndex].scores[currentHole.hole]--;
                }
            }
            renderHole(); // Rita om för att se nya siffran direkt
        });

        // Bläddra till nästa/föregående korg
        nextHoleBtn.addEventListener('click', () => {
            if (currentHoleIndex < activeRound.course.holes.length - 1) {
                currentHoleIndex++;
                renderHole();
            }
        });

        prevHoleBtn.addEventListener('click', () => {
            if (currentHoleIndex > 0) {
                currentHoleIndex--;
                renderHole();
            }
        });

        // Avsluta rundan
        endRoundBtn.addEventListener('click', () => {
    if (confirm("Är du säker på att du vill avsluta rundan och se resultatet?")) {
        window.location.href = "resultat.html"; // Skickar vidare till resultatsidan
    }
});

        // Kör igång första uppritningen direkt!
        renderHole();
    }
    const newListForm = document.querySelector('[data-new-list-form]');
    if (newListForm) {
        newListForm.addEventListener('submit', e => {
            e.preventDefault(); // Hindrar sidan från att laddas om ifall man trycker Enter i textfältet
            saveAndRedirect();
        });
    }
    // --- LOGIK ENBART FÖR RESULTATSIDAN (RESULTAT.HTML) ---
    const resultatContainer = document.getElementById('scorecard-table');
    
    if (resultatContainer) {
        const activeRound = JSON.parse(localStorage.getItem('activeRound'));

        if (!activeRound) {
            window.location.href = "index.html";
            return;
        }

        document.getElementById('res-course-name').innerText = activeRound.course.name;

        const thead = resultatContainer.querySelector('thead');
        const tbody = resultatContainer.querySelector('tbody');

        // 1. SKAPA RUBRIKRUTOR (Hål 1, Hål 2... Total)
        let headerRow = '<tr><th>Hål</th>';
        activeRound.course.holes.forEach(h => {
            headerRow += `<th>${h.hole}</th>`;
        });
        headerRow += '<th>Tot</th></tr>';
        thead.innerHTML = headerRow;

        // 2. SKAPA RAD FÖR BANANS PAR
        let parRow = '<tr class="par-row"><td>Par</td>';
        let totalPar = 0;
        activeRound.course.holes.forEach(h => {
            parRow += `<td>${h.par}</td>`;
            totalPar += h.par;
        });
        parRow += `<td><strong>${totalPar}</strong></td></tr>`;
        tbody.innerHTML += parRow;

            // 3. SKAPA RADER FÖR SPELARNA (Nu med färgkodning även på totalen!)
    activeRound.players.forEach(player => {
        let playerRow = `<tr><td><strong>${player.name}</strong></td>`;
        let totalScore = 0;
        let totalRelative = 0;

        activeRound.course.holes.forEach(h => {
            const score = player.scores[h.hole] || 0;
            totalScore += score;
            
            let scoreClass = ''; 

            if (score > 0) {
                totalRelative += (score - h.par);
                
                if (score < h.par) {
                    scoreClass = 'class="score-under"'; 
                } else if (score > h.par) {
                    scoreClass = 'class="score-over"';  
                }
            }

            playerRow += `<td ${scoreClass}>${score > 0 ? score : '-'}</td>`;
        });

        // 1. Formatera texten för totalen (t.ex. +2, E, -1)
        let relativeText = totalRelative === 0 ? "E" : (totalRelative > 0 ? `+${totalRelative}` : totalRelative);

        // 2. Bestäm färgklass för den totala poängrutan
        let totalClass = '';
        if (totalRelative < 0) {
            totalClass = 'class="score-under"'; // Grön om man är under par totalt
        } else if (totalRelative > 0) {
            totalClass = 'class="score-over"';  // Röd om man är över par totalt
        }

        // 3. Lägg till klassen på den sista td-rutan
        playerRow += `<td ${totalClass}><strong>${totalScore}</strong> <span class="res-relative">(${relativeText})</span></td></tr>`;
        tbody.innerHTML += playerRow;
    });

        // "Tillbaka till start"-knappen rensar rundan ur minnet
        const goHomeBtn = document.getElementById('go-home-btn');
        if (goHomeBtn) {
            goHomeBtn.addEventListener('click', () => {
                localStorage.removeItem('activeRound');
                window.location.href = "index.html";
            });
        }
    }
});