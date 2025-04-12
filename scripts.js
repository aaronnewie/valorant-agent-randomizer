// State management
const state = {
    players: [],
    playerColors: {},
    activeRole: 'all'
};

// Color management
const colorManager = {
    generateColor() {
        const hue = Math.floor(Math.random() * 360);
        const saturation = Math.floor(Math.random() * 30) + 70;
        const lightness = Math.floor(Math.random() * 20) + 40;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    },

    getUniqueColor() {
        let color;
        do {
            color = this.generateColor();
        } while (Object.values(state.playerColors).includes(color));
        return color;
    }
};

// Player management
const playerManager = {
    addPlayer(name) {
        if (!name || state.players.includes(name)) return null;
        
        const color = colorManager.getUniqueColor();
        state.players.push(name);
        state.playerColors[name] = color;
        
        this.renderPlayer(name, color);
        this.saveState();
        return true;
    },

    renderPlayer(name, color) {
        const legendItem = document.createElement('div');
        legendItem.className = `legend-item player-${name}`;
        legendItem.innerHTML = `
            <div class="color-box" style="background-color: ${color}"></div>
            <span class="player-name">${name}</span>
            <button class="delete-player" data-player="${name}">×</button>
        `;

        const legendGrid = document.querySelector('.legend-grid');
        const newPlayerInput = document.querySelector('.new-player');
        if (legendGrid && newPlayerInput) {
            legendGrid.insertBefore(legendItem, newPlayerInput);
        }
    },

    deletePlayer(name) {
        state.players = state.players.filter(p => p !== name);
        delete state.playerColors[name];
        
        document.querySelector(`.legend-item.player-${name}`)?.remove();
        document.querySelectorAll(`.agent-card.player-${name}`).forEach(card => {
            card.className = 'agent-card';
            card.querySelector('.player').textContent = 'Unassigned';
        });
        
        this.saveState();
    },

    saveState() {
        localStorage.setItem('valorantPlayers', JSON.stringify({
            players: state.players,
            colors: state.playerColors
        }));
    },

    loadState() {
        const saved = localStorage.getItem('valorantPlayers');
        if (saved) {
            const data = JSON.parse(saved);
            state.players = data.players;
            state.playerColors = data.colors;
            
            state.players.forEach(name => {
                this.renderPlayer(name, state.playerColors[name]);
            });
        }
    }
};

// Agent management
const agentManager = {
    randomizeAgents() {
        if (state.players.length === 0) {
            alert('Add at least one player first!');
            return;
        }

        // Reset assignments
        document.querySelectorAll('.agent-card').forEach(card => {
            card.className = 'agent-card';
            card.querySelector('.player').textContent = 'Unassigned';
        });

        // Get all agents
        const agents = Array.from(document.querySelectorAll('.agent-card'));
        const shuffledAgents = [...agents].sort(() => Math.random() - 0.5);
        
        // Distribute agents evenly
        shuffledAgents.forEach((agent, index) => {
            const playerIndex = index % state.players.length;
            const playerName = state.players[playerIndex];
            this.assignAgentToPlayer(agent, playerName);
        });
    },

    assignAgentToPlayer(agentCard, playerName) {
        agentCard.className = `agent-card player-${playerName}`;
        const playerElem = agentCard.querySelector('.player');
        if (playerElem) {
            playerElem.textContent = playerName;
            playerElem.style.color = state.playerColors[playerName];
        }
    }
};

// Event handlers
function initializeEventListeners() {
    // New player input
    const newPlayerInput = document.querySelector('.new-player-input');
    newPlayerInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            playerManager.addPlayer(e.target.value.trim());
            e.target.value = '';
        }
    });

    // Delete player buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-player')) {
            const playerName = e.target.dataset.player;
            if (confirm(`Delete ${playerName}?`)) {
                playerManager.deletePlayer(playerName);
            }
        }
    });

    // Randomize button
    document.getElementById('randomizer-btn')?.addEventListener('click', () => {
        agentManager.randomizeAgents();
    });

    // Role filter buttons
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const role = btn.dataset.role;
            document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.agent-grid').forEach(section => {
                section.classList.toggle('active', 
                    role === 'all' || section.id === `${role}-section`
                );
            });
        });
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    playerManager.loadState();
    initializeEventListeners();
    initializeSortableLegend();
});