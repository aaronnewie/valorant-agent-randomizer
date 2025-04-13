// Player management
const playerColors = {};
let players = [];

// Constants for configuration
const CONFIG = {
    MAX_PLAYERS: 10,
    MIN_NAME_LENGTH: 2,
    MAX_NAME_LENGTH: 20,
    SAVE_KEY: 'valorantPlayers'
};

// Get a random HSL color that's visible on dark background
function getNextColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 30) + 70; // 70-100%
    const lightness = Math.floor(Math.random() * 20) + 50;  // 50-70%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Function to safely encode player names for CSS classes
function encodeForCSS(name) {
    // Replace any non-alphanumeric characters with their unicode code points
    return name.replace(/[^a-zA-Z0-9]/g, char => {
        return '_' + char.charCodeAt(0);
    });
}

// Function to add a new player
function addNewPlayer() {
    const playerName = document.querySelector('.new-player-input').value.trim();
    if (playerName) {
        if (playerName.length > CONFIG.MAX_NAME_LENGTH) {
            alert(`Player name must be ${CONFIG.MAX_NAME_LENGTH} characters or less`);
            return;
        }
        
        const color = generateUniqueColor();
        if (addPlayerToLegend(playerName, color)) {
            // Clear input and close form
            document.querySelector('.new-player-input').value = '';
            document.querySelector('.new-player-form').style.display = 'none';
        }
    }
}

// Function to generate a unique color
function generateUniqueColor() {
    const existingColors = Object.values(playerColors);
    let newColor = getNextColor();
    let attempts = 0;
    
    // Try to generate a color that's not too similar to existing ones
    while (existingColors.includes(newColor) && attempts < 10) {
        newColor = getNextColor();
        attempts++;
    }
    
    return newColor;
}

// Function to add a player to the legend
function addPlayerToLegend(name, color) {
    if (players.includes(name)) {
        alert('Player name already exists!');
        return false;
    }

    const cssName = encodeForCSS(name);
    playerColors[name] = color;
    players.push(name);
    
    const playerStyle = document.createElement('style');
    playerStyle.setAttribute('data-player', name);
    playerStyle.textContent = `
        .player-${cssName} { color: ${color}; }
        .agent-card.player-${cssName} .player { color: ${color}; }
        .legend-item.player-${cssName} .color-box { 
            background-color: ${color};
            box-shadow: 0 0 8px ${color}4D;
        }
    `;
    document.head.appendChild(playerStyle);

    const legendGrid = document.querySelector('.legend-grid');
    const legendItem = document.createElement('div');
    legendItem.className = `legend-item player-${cssName}`;
    legendItem.dataset.playerName = name; // Store original name as data attribute
    legendItem.innerHTML = `
        <div class="color-box"></div>
        <span contenteditable="true">${name}</span>
        <button class="delete-player" aria-label="Delete ${name}">×</button>
    `;

    legendGrid.appendChild(legendItem);

    // Add delete handler
    legendItem.querySelector('.delete-player').addEventListener('click', (e) => {
        e.stopPropagation();
        deletePlayer(name);
    });

    // Add rename handler
    const nameSpan = legendItem.querySelector('span');
    nameSpan.addEventListener('blur', () => {
        const newName = nameSpan.textContent.trim();
        if (newName && newName !== name && !players.includes(newName)) {
            renamePlayer(name, newName);
        } else {
            nameSpan.textContent = name; // Reset to original name
        }
    });

    nameSpan.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            nameSpan.blur();
        }
    });

    savePlayers();
    return true;
}

// Function to delete a player
function deletePlayer(name) {
    const cssName = encodeForCSS(name);
    const legendItem = document.querySelector(`.legend-item.player-${cssName}`);
    if (legendItem) {
        legendItem.remove();
    }

    // Remove player's color style
    document.querySelectorAll('style').forEach(style => {
        if (style.getAttribute('data-player') === name) {
            style.remove();
        }
    });

    // Unassign player from all agents
    document.querySelectorAll(`.agent-card.player-${cssName}`).forEach(card => {
        card.classList.remove(`player-${cssName}`);
        const playerElem = card.querySelector('.player');
        if (playerElem) {
            playerElem.textContent = 'Unassigned';
            playerElem.style.color = 'white';
        }
    });

    // Remove from players array and colors
    players = players.filter(p => p !== name);
    delete playerColors[name];
    savePlayers();
}

// Function to rename a player
function renamePlayer(oldName, newName) {
    if (players.includes(newName)) {
        alert('Player name already exists!');
        return false;
    }

    const color = playerColors[oldName];
    delete playerColors[oldName];
    playerColors[newName] = color;

    // Update players array
    const index = players.indexOf(oldName);
    if (index !== -1) {
        players[index] = newName;
    }

    // Update CSS classes
    const oldStyle = document.querySelector(`style[data-player="${oldName}"]`);
    if (oldStyle) {
        oldStyle.remove();
    }

    const newStyle = document.createElement('style');
    newStyle.setAttribute('data-player', newName);
    newStyle.textContent = `
        .player-${encodeForCSS(newName)} { color: ${color}; }
        .legend-item.player-${encodeForCSS(newName)} .color-box { 
            background-color: ${color};
            box-shadow: 0 0 8px ${color}4D;
        }
    `;
    document.head.appendChild(newStyle);

    // Update legend item
    const legendItem = document.querySelector(`.legend-item.player-${encodeForCSS(oldName)}`);
    if (legendItem) {
        legendItem.className = `legend-item player-${encodeForCSS(newName)}`;
        const deleteBtn = legendItem.querySelector('.delete-player');
        if (deleteBtn) {
            deleteBtn.setAttribute('aria-label', `Delete ${newName}`);
        }
    }

    // Update agent cards
    document.querySelectorAll(`.agent-card.player-${encodeForCSS(oldName)}`).forEach(card => {
        card.classList.remove(`player-${encodeForCSS(oldName)}`);
        card.classList.add(`player-${encodeForCSS(newName)}`);
        const playerElem = card.querySelector('.player');
        if (playerElem) {
            playerElem.textContent = newName;
        }
    });

    savePlayers();
    return true;
}

// Function to save players to localStorage
function savePlayers() {
    const playerData = {
        players: players,
        colors: playerColors,
        exportDate: new Date().toISOString()
    };
    localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(playerData));
}

// Function to load players from localStorage
function loadPlayers() {
    const savedData = localStorage.getItem(CONFIG.SAVE_KEY);
    if (savedData) {
        try {
            const { players: savedPlayers, colors } = JSON.parse(savedData);
            // Clear existing players first
            players = [];
            Object.keys(playerColors).forEach(key => delete playerColors[key]);
            document.querySelectorAll('.legend-item').forEach(item => {
                if (!item.classList.contains('legend-controls')) {
                    item.remove();
                }
            });
            // Add saved players
            savedPlayers.forEach(name => {
                if (!document.querySelector(`.legend-item.player-${encodeForCSS(name)}`)) {
                    addPlayerToLegend(name, colors[name]);
                }
            });
        } catch (error) {
            console.error('Error loading players:', error);
        }
    }
}

// Function to assign an agent to a player
function assignAgentToPlayer(agentCard, playerName) {
    // Remove any existing player classes
    players.forEach(player => {
        agentCard.classList.remove(`player-${encodeForCSS(player)}`);
    });
    
    // Add the new player class
    agentCard.classList.add(`player-${encodeForCSS(playerName)}`);
    
    // Update the player name text
    const playerElem = agentCard.querySelector('.player');
    if (playerElem) {
        playerElem.textContent = playerName;
        // Ensure the color is applied
        playerElem.style.color = playerColors[playerName];
    }
}

// Function to randomize agents
function randomizeAgents() {
    console.log('Randomizing agents...');
    
    // First, reset all agent assignments
    document.querySelectorAll('.agent-card').forEach(card => {
        const playerElem = card.querySelector('.player');
        if (playerElem) {
            playerElem.textContent = 'Unassigned';
            playerElem.style.color = 'var(--text-primary)'; // Reset color
        }
        // Remove all player classes
        card.className = 'agent-card';
    });

    if (players.length === 0) {
        alert('Add players first!');
        return;
    }

    // Get all visible agent cards based on current role selection
    const visibleSections = Array.from(document.querySelectorAll('.agent-grid')).filter(section => 
        section.style.display !== 'none'
    );
    
    const agentCards = [];
    visibleSections.forEach(section => {
        agentCards.push(...Array.from(section.querySelectorAll('.agent-card')));
    });
    
    console.log(`Found ${agentCards.length} visible agent cards`);
    
    // Shuffle the cards
    const shuffledCards = [...agentCards].sort(() => Math.random() - 0.5);
    
    // Assign at least one agent to each player
    const playersWithAgents = {};
    players.forEach(player => playersWithAgents[player] = 0);
    
    let cardIndex = 0;
    players.forEach(player => {
        if (cardIndex < shuffledCards.length) {
            assignAgentToPlayer(shuffledCards[cardIndex], player);
            playersWithAgents[player]++;
            cardIndex++;
        }
    });
    
    // Distribute remaining agents
    while (cardIndex < shuffledCards.length) {
        const player = players[Math.floor(Math.random() * players.length)];
        assignAgentToPlayer(shuffledCards[cardIndex], player);
        playersWithAgents[player]++;
        cardIndex++;
    }
    
    console.log('Randomization complete!');
}

// Function to handle role changes
function handleRoleChange(selectedButton) {
    console.log('Role button clicked:', selectedButton.getAttribute('data-role'));
    
    // Update active state of buttons
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
    });
    selectedButton.classList.add('active');
    selectedButton.setAttribute('aria-selected', 'true');

    const selectedRole = selectedButton.getAttribute('data-role');
    const sections = document.querySelectorAll('.agent-grid');

    // Show/hide sections based on role
    sections.forEach(section => {
        if (selectedRole === 'all' || section.id === `${selectedRole}-section`) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
    
    console.log('Role selection updated');
}

document.addEventListener('DOMContentLoaded', () => {
    // Get UI elements
    const addPlayerBtn = document.getElementById('add-player-btn');
    const newPlayerForm = document.querySelector('.new-player-form');
    const newPlayerInput = document.querySelector('.new-player-input');
    const randomizeBtn = document.getElementById('randomizer-btn');
    const roleButtons = document.querySelectorAll('.role-btn');
    const collapseBtn = document.querySelector('.collapse-legend');
    const legend = document.querySelector('.player-legend');
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    
    console.log('Initializing Valorant Agent Randomizer...');
    
    // Initially hide the form
    if (newPlayerForm) {
        newPlayerForm.style.display = 'none';
    }
    
    // 1. PLAYER MANAGEMENT
    // Setup Add Player button
    if (addPlayerBtn && newPlayerForm && newPlayerInput) {
        console.log('Setting up Add Player button');
        
        // Create submit button for the form
        const submitBtn = document.createElement('button');
        submitBtn.type = 'button';
        submitBtn.className = 'submit-player-btn';
        submitBtn.textContent = 'Add';
        newPlayerForm.appendChild(submitBtn);
        
        // Toggle form visibility when clicking Add Player button
        addPlayerBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isVisible = newPlayerForm.style.display === 'flex';
            newPlayerForm.style.display = isVisible ? 'none' : 'flex';
            if (!isVisible) {
                newPlayerInput.focus();
            }
        });
        
        // Add player on submit button click
        submitBtn.addEventListener('click', function() {
            addNewPlayer();
        });
        
        // Add player on Enter key
        newPlayerInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addNewPlayer();
            }
        });
        
        // Hide form when clicking outside
        document.addEventListener('click', function(e) {
            if (newPlayerForm.style.display === 'flex' && 
                !newPlayerForm.contains(e.target) && 
                !addPlayerBtn.contains(e.target)) {
                newPlayerForm.style.display = 'none';
            }
        });
    } else {
        console.error('Add player elements not found!');
    }
    
    // 2. RANDOMIZE BUTTON
    if (randomizeBtn) {
        console.log('Setting up Randomize button');
        randomizeBtn.addEventListener('click', function() {
            console.log('Randomize button clicked');
            randomizeAgents();
        });
    } else {
        console.error('Randomize button not found!');
    }
    
    // 3. ROLE BUTTONS
    if (roleButtons && roleButtons.length > 0) {
        console.log('Setting up Role buttons');
        roleButtons.forEach((button, index) => {
            button.addEventListener('click', function() {
                console.log('Role button clicked:', this.getAttribute('data-role'));
                handleRoleChange(this);
            });
            button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
        });
        
        // Initialize sections visibility
        const allRoleButton = document.querySelector('.role-btn[data-role="all"]');
        if (allRoleButton) {
            handleRoleChange(allRoleButton);
        }
    } else {
        console.error('Role buttons not found!');
    }
    
    // 4. COLLAPSE BUTTON
    if (collapseBtn && legend) {
        console.log('Setting up Collapse button');
        let isCollapsed = false;
        
        collapseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Collapse button clicked');
            
            isCollapsed = !isCollapsed;
            if (isCollapsed) {
                legend.classList.add('collapsed');
                // Change icon to expand (plus sign)
                this.querySelector('svg').innerHTML = '<path fill="currentColor" d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z"/>';
                this.setAttribute('aria-label', 'Expand legend');
                
                // Hide all content except the header
                const legendContent = legend.querySelector('.legend-content');
                if (legendContent) {
                    legendContent.style.display = 'none';
                }
            } else {
                legend.classList.remove('collapsed');
                // Change icon to collapse (minus sign)
                this.querySelector('svg').innerHTML = '<path fill="currentColor" d="M19 13H5v-2h14v2z"/>';
                this.setAttribute('aria-label', 'Collapse legend');
                
                // Show the content again
                const legendContent = legend.querySelector('.legend-content');
                if (legendContent) {
                    legendContent.style.display = 'flex';
                }
            }
        });
    } else {
        console.error('Collapse button or legend not found!');
    }

    // 5. SCROLL TO TOP BUTTON
    if (scrollToTopBtn) {
        console.log('Setting up Scroll to Top button');
        
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        });

        scrollToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // 6. HELPER FUNCTIONS
    // Function to add a new player
    function addNewPlayer() {
        const playerName = newPlayerInput.value.trim();
        if (playerName) {
            if (playerName.length > CONFIG.MAX_NAME_LENGTH) {
                alert(`Player name must be ${CONFIG.MAX_NAME_LENGTH} characters or less`);
                return;
            }
            
            const color = generateUniqueColor();
            if (addPlayerToLegend(playerName, color)) {
                // Clear input but keep form open for next player
                newPlayerInput.value = '';
                newPlayerInput.focus();
            }
        }
    }
    
    // Load any saved players
    loadPlayers();
    
    console.log('Initialization complete!');
});