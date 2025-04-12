// Player management
const playerColors = {};
let players = [];

// Predefined colors for players
const predefinedColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5',
    '#9B59B6', '#3498DB', '#F1C40F', '#E74C3C', '#1ABC9C', '#F39C12'
];

function getNextColor() {
    // Get the next unused color from predefined colors
    const usedColors = Object.values(playerColors);
    const nextColor = predefinedColors.find(color => !usedColors.includes(color));
    return nextColor || predefinedColors[Math.floor(Math.random() * predefinedColors.length)];
}

function addPlayerToLegend(name, color) {
    playerColors[name] = color;
    players.push(name);
    
    const playerStyle = document.createElement('style');
    playerStyle.textContent = `
        .player-${name} { color: ${color}; }
        .legend-item.player-${name} .color-box { 
            background-color: ${color};
            box-shadow: 0 0 8px ${color}4D;
        }
    `;
    document.head.appendChild(playerStyle);

    const legendGrid = document.querySelector('.legend-grid');
    const legendItem = document.createElement('div');
    legendItem.className = `legend-item player-${name}`;
    legendItem.innerHTML = `
        <div class="color-box"></div>
        <span>${name}</span>
        <button class="delete-player" aria-label="Delete ${name}">×</button>
    `;

    // Insert before the legend controls
    const legendControls = document.querySelector('.legend-controls');
    legendGrid.insertBefore(legendItem, legendControls);

    // Add delete handler
    legendItem.querySelector('.delete-player').addEventListener('click', (e) => {
        e.stopPropagation();
        deletePlayer(name);
    });

    savePlayers();
    return legendItem;
}

function deletePlayer(name) {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
        const legendItem = document.querySelector(`.legend-item.player-${name}`);
        if (legendItem) {
            legendItem.remove();
        }

        // Remove player's color style
        document.querySelectorAll('style').forEach(style => {
            if (style.textContent.includes(`.player-${name}`)) {
                style.remove();
            }
        });

        // Unassign player from all agents
        document.querySelectorAll(`.agent-card.player-${name}`).forEach(card => {
            card.classList.remove(`player-${name}`);
            const playerElem = card.querySelector('.player');
            if (playerElem) {
                playerElem.textContent = 'Unassigned';
            }
        });

        // Remove from players array and colors
        players = players.filter(p => p !== name);
        delete playerColors[name];
        savePlayers();
    }
}

// Save/Load players
function savePlayers() {
    const playerData = {
        players: players,
        colors: playerColors
    };
    localStorage.setItem('valorantPlayers', JSON.stringify(playerData));
}

function loadPlayers() {
    const savedData = localStorage.getItem('valorantPlayers');
    if (savedData) {
        try {
            const { players: savedPlayers, colors } = JSON.parse(savedData);
            savedPlayers.forEach(name => {
                if (!document.querySelector(`.legend-item.player-${name}`)) {
                    playerColors[name] = colors[name];
                    addPlayerToLegend(name, colors[name]);
                }
            });
        } catch (error) {
            console.error('Error loading players:', error);
        }
    }
}

// Randomizer functionality
function randomizeAgents() {
    if (players.length === 0) {
        alert('Add at least one player first!');
        return;
    }

    // Reset all agent assignments
    document.querySelectorAll('.agent-card').forEach(card => {
        card.className = 'agent-card';
        const playerElem = card.querySelector('.player');
        if (playerElem) {
            playerElem.textContent = 'Unassigned';
        }
    });

    // Get all agents by role
    const roles = {
        duelist: Array.from(document.querySelectorAll('#duelist-section .agent-card')),
        controller: Array.from(document.querySelectorAll('#controller-section .agent-card')),
        initiator: Array.from(document.querySelectorAll('#initiator-section .agent-card')),
        sentinel: Array.from(document.querySelectorAll('#sentinel-section .agent-card'))
    };

    // Assign agents to players
    const playerAssignments = {};
    players.forEach(player => {
        playerAssignments[player] = [];
    });

    // Assign at least one agent to each player first
    for (const player of players) {
        const allAgents = Object.values(roles).flat();
        const unassignedAgents = allAgents.filter(agent => 
            agent.querySelector('.player').textContent === 'Unassigned'
        );
        
        if (unassignedAgents.length > 0) {
            const randomAgent = unassignedAgents[Math.floor(Math.random() * unassignedAgents.length)];
            assignAgentToPlayer(randomAgent, player);
            playerAssignments[player].push(randomAgent);
        }
    }

    // Distribute remaining agents
    Object.values(roles).flat().forEach(agent => {
        if (agent.querySelector('.player').textContent === 'Unassigned') {
            const randomPlayer = players[Math.floor(Math.random() * players.length)];
            assignAgentToPlayer(agent, randomPlayer);
            playerAssignments[randomPlayer].push(agent);
        }
    });
}

function assignAgentToPlayer(agentCard, playerName) {
    agentCard.className = `agent-card player-${playerName}`;
    const playerElem = agentCard.querySelector('.player');
    if (playerElem) {
        playerElem.textContent = playerName;
    }
}

// Initialize the new player input
function initializeNewPlayerInput() {
    const newPlayerBox = document.querySelector('.new-player .color-box');
    const newPlayerInput = document.querySelector('.new-player-input');
    const legendGrid = document.querySelector('.legend-grid');
    const initialColor = getNextColor();
    
    // Set initial color
    newPlayerBox.style.backgroundColor = initialColor;
    newPlayerBox.style.boxShadow = `0 0 8px ${initialColor}4D`;

    // Move new player input to bottom
    legendGrid.appendChild(document.querySelector('.legend-item.new-player'));

    // Focus the input initially
    newPlayerInput.focus();

    // Handle input events
    newPlayerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const name = e.target.value.trim();
            if (name) {
                addPlayerToLegend(name, initialColor);
                // Reset input and get new color for next player
                e.target.value = '';
                const nextColor = getNextColor();
                newPlayerBox.style.backgroundColor = nextColor;
                newPlayerBox.style.boxShadow = `0 0 8px ${nextColor}4D`;
                // Re-focus the input after adding a player
                setTimeout(() => e.target.focus(), 0);
            }
        }
    });
}

// Make player names editable
function makeNamesEditable() {
    document.addEventListener('click', (e) => {
        const span = e.target;
        if (!span.closest('.legend-item') || span.classList.contains('new-player-input')) return;
        
        // If clicking the delete button, don't start editing
        if (e.target.classList.contains('delete-player')) return;

        const nameSpan = span.tagName === 'SPAN' ? span : span.querySelector('span');
        if (!nameSpan) return;

        const currentName = nameSpan.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'editable-name';
        
        function handleEdit() {
            const newName = input.value.trim();
            if (newName && newName !== currentName) {
                // Update player name everywhere
                const playerClass = Array.from(span.closest('.legend-item').classList)
                    .find(cls => cls.startsWith('player-'));
                
                // Update agent cards
                document.querySelectorAll(`.agent-card.${playerClass}`).forEach(card => {
                    const playerElem = card.querySelector('.player');
                    if (playerElem) {
                        playerElem.textContent = newName;
                    }
                });

                // Update player array and storage
                const index = players.indexOf(currentName);
                if (index !== -1) {
                    players[index] = newName;
                    playerColors[newName] = playerColors[currentName];
                    delete playerColors[currentName];
                    savePlayers();
                }
            }
            nameSpan.textContent = newName || currentName;
            input.remove();
        }

        input.addEventListener('blur', handleEdit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleEdit();
                e.preventDefault();
            }
        });

        nameSpan.textContent = '';
        nameSpan.appendChild(input);
        input.focus();
        input.select();
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadPlayers();

    // Reset all button
    document.getElementById('reset-all').addEventListener('click', () => {
        if (confirm('This will remove all players and reset all agent assignments. Are you sure?')) {
            // Clear all player assignments
            document.querySelectorAll('.agent-card').forEach(card => {
                card.className = 'agent-card';
                const playerElem = card.querySelector('.player');
                if (playerElem) {
                    playerElem.textContent = 'Unassigned';
                }
            });

            // Remove all player styles
            document.querySelectorAll('style').forEach(style => {
                if (style.textContent.includes('color-box')) {
                    style.remove();
                }
            });

            // Clear legend items
            document.querySelectorAll('.legend-item').forEach(item => {
                if (!item.classList.contains('legend-controls') && !item.classList.contains('new-player')) {
                    item.remove();
                }
            });

            // Reset state
            players = [];
            Object.keys(playerColors).forEach(key => delete playerColors[key]);
            localStorage.removeItem('valorantPlayers');
        }
    });

    // Randomizer button
    document.getElementById('randomizer-btn').addEventListener('click', randomizeAgents);

    // Show all sections by default
    document.querySelectorAll('.agent-grid').forEach(section => {
        section.classList.add('active');
    });

    // Role button functionality
    document.querySelectorAll('.role-btn').forEach((button, index) => {
        button.addEventListener('click', () => handleRoleChange(button));
        button.setAttribute('tabindex', '0');
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    });

    // Keyboard shortcuts
    const shortcuts = {
        'a': 'all',
        'd': 'duelist',
        'c': 'controller',
        'i': 'initiator',
        's': 'sentinel',
        '?': 'help'
    };

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        
        if (e.key in shortcuts && !e.ctrlKey && !e.altKey && !e.metaKey) {
            if (shortcuts[e.key] === 'help') {
                toggleHelpDialog();
            } else {
                const button = document.querySelector(`.role-btn[data-role="${shortcuts[e.key]}"]`);
                if (button) {
                    handleRoleChange(button);
                    button.focus();
                }
            }
        }

        if (e.key === 'Escape') {
            const helpDialog = document.querySelector('.keyboard-help');
            if (!helpDialog.hasAttribute('hidden')) {
                helpDialog.setAttribute('hidden', '');
            }
        }
    });

    // Help dialog functionality
    const helpDialog = document.querySelector('.keyboard-help');
    const closeDialogBtn = document.querySelector('.close-dialog');
    
    function toggleHelpDialog() {
        const isHidden = helpDialog.hasAttribute('hidden');
        if (isHidden) {
            helpDialog.removeAttribute('hidden');
        } else {
            helpDialog.setAttribute('hidden', '');
        }
    }

    closeDialogBtn?.addEventListener('click', () => {
        helpDialog.setAttribute('hidden', '');
    });

    initializeNewPlayerInput();
    makeNamesEditable();
});

function handleRoleChange(button) {
    // Remove active class from all buttons
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
    });

    // Add active class to clicked button
    button.classList.add('active');
    button.setAttribute('aria-selected', 'true');

    const role = button.dataset.role;
    localStorage.setItem('activeRole', role);

    // Remove active class from all sections
    document.querySelectorAll('.agent-grid').forEach(section => {
        section.classList.remove('active');
    });

    if (role === 'all') {
        // Show all sections
        document.querySelectorAll('.agent-grid').forEach(section => {
            section.classList.add('active');
        });
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    } else {
        // Show only the selected section
        const section = document.getElementById(`${role}-section`);
        if (section) {
            section.classList.add('active');
            const headerOffset = document.querySelector('header').offsetHeight + 20;
            const sectionTop = section.getBoundingClientRect().top + window.pageYOffset - headerOffset;
            window.scrollTo({
                top: sectionTop,
                behavior: 'smooth'
            });
        }
    }
}