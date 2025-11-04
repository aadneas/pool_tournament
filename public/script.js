class PoolTournamentApp {
    constructor() {
        this.currentSection = 'participants';
        this.participants = [];
        this.bracket = { rounds: [] };
        this.results = [];
        this.selectedParticipantId = null;
        this.isAdminLoggedIn = false;
        this.adminPassword = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadParticipants();
        this.loadBracket();
        this.loadResults();
    }
    
    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });
        
        // Add participant
        document.getElementById('add-participant-btn').addEventListener('click', () => {
            this.showAddParticipantForm();
        });
        
        document.getElementById('cancel-add').addEventListener('click', () => {
            this.hideAddParticipantForm();
        });
        
        document.getElementById('participant-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addParticipant();
        });
        
        // Generate bracket
        document.getElementById('generate-bracket-btn').addEventListener('click', () => {
            this.generateBracket();
        });
        
        // Image upload modal
        const modal = document.getElementById('image-modal');
        const closeModal = document.querySelector('.close');
        
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Match detail modal
        const matchModal = document.getElementById('match-detail-modal');
        const closeMatchModal = document.querySelector('.match-detail-close');
        
        closeMatchModal.addEventListener('click', () => {
            matchModal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === matchModal) {
                matchModal.style.display = 'none';
            }
        });
        
        document.getElementById('image-upload-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadImage();
        });
        
        // Admin functionality
        document.getElementById('admin-login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.adminLogin();
        });
        
        document.getElementById('admin-logout-btn').addEventListener('click', () => {
            this.adminLogout();
        });
        
        document.getElementById('reset-tournament-btn').addEventListener('click', () => {
            this.resetTournament();
        });
        
        document.getElementById('reset-all-btn').addEventListener('click', () => {
            this.resetAll();
        });
    }
    
    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        
        // Update sections
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(section).classList.add('active');
        
        this.currentSection = section;
        
        // Refresh data for the section
        if (section === 'participants') {
            this.loadParticipants();
        } else if (section === 'brackets') {
            this.loadBracket();
        } else if (section === 'results') {
            this.loadResults();
        } else if (section === 'admin') {
            this.loadAdminPanel();
        }
    }
    
    async loadParticipants() {
        try {
            const response = await fetch('/api/participants');
            this.participants = await response.json();
            this.renderParticipants();
        } catch (error) {
            console.error('Error loading participants:', error);
        }
    }
    
    async addParticipant() {
        const name = document.getElementById('participant-name').value.trim();
        if (!name) return;
        
        if (!this.isAdminLoggedIn) {
            alert('Admin access required to add participants');
            return;
        }
        
        try {
            const response = await fetch('/api/participants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, password: this.adminPassword }),
            });
            
            if (response.ok) {
                const newParticipant = await response.json();
                this.participants.push(newParticipant);
                this.renderParticipants();
                this.hideAddParticipantForm();
                document.getElementById('participant-name').value = '';
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to add participant');
            }
        } catch (error) {
            console.error('Error adding participant:', error);
            alert('Error adding participant');
        }
    }
    
    showAddParticipantForm() {
        document.getElementById('add-participant-form').style.display = 'block';
        document.getElementById('participant-name').focus();
    }
    
    hideAddParticipantForm() {
        document.getElementById('add-participant-form').style.display = 'none';
    }
    
    renderParticipants() {
        const container = document.getElementById('participants-grid');
        const participantCount = this.participants.length;
        
        if (this.participants.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No participants yet</h3>
                    <p>Add some participants to get started!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="participant-count">
                <h3>Total Participants: ${participantCount}</h3>
            </div>
            <div class="participants-list">
                ${this.participants.map(participant => `
                    <div class="participant-card">
                        ${participant.image ? 
                            `<img src="${participant.image}" alt="${participant.name}" class="participant-image" onclick="app.openImageModal(${participant.id})">` :
                            `<div class="participant-placeholder" onclick="app.openImageModal(${participant.id})">📷</div>`
                        }
                        <div class="participant-name">${participant.name}</div>
                        <div class="participant-stats">
                            Wins: ${participant.wins || 0} | Losses: ${participant.losses || 0}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    openImageModal(participantId) {
        this.selectedParticipantId = participantId;
        document.getElementById('image-modal').style.display = 'block';
    }
    
    async uploadImage() {
        const fileInput = document.getElementById('image-input');
        const file = fileInput.files[0];
        
        if (!file || !this.selectedParticipantId) return;
        
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            const response = await fetch(`/api/participants/${this.selectedParticipantId}/image`, {
                method: 'POST',
                body: formData,
            });
            
            const updatedParticipant = await response.json();
            
            // Update local data
            const index = this.participants.findIndex(p => p.id === this.selectedParticipantId);
            if (index !== -1) {
                this.participants[index] = updatedParticipant;
            }
            
            this.renderParticipants();
            document.getElementById('image-modal').style.display = 'none';
            fileInput.value = '';
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    }
    
    async generateBracket() {
        if (this.participants.length < 2) {
            alert('Need at least 2 participants to generate a bracket!');
            return;
        }
        
        if (!this.isAdminLoggedIn) {
            alert('Admin access required to generate tournament bracket');
            return;
        }
        
        try {
            const response = await fetch('/api/brackets/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: this.adminPassword }),
            });
            
            if (response.ok) {
                this.bracket = await response.json();
                this.renderBracket();
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to generate bracket');
            }
        } catch (error) {
            console.error('Error generating bracket:', error);
            alert('Error generating bracket');
        }
    }
    
    async loadBracket() {
        try {
            const response = await fetch('/api/brackets');
            this.bracket = await response.json();
            this.renderBracket();
        } catch (error) {
            console.error('Error loading bracket:', error);
        }
    }
    
    renderBracket() {
        const container = document.getElementById('bracket-container');
        
        if (!this.bracket.rounds || this.bracket.rounds.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No bracket generated yet</h3>
                    <p>Generate a bracket to see the tournament structure!</p>
                </div>
            `;
            return;
        }
        
        // Create simple tree structure
        container.innerHTML = `
            <div class="bracket-tree">
                ${this.bracket.rounds.map((round, roundIndex) => `
                    <div class="bracket-round">
                        <h3>${this.getRoundName(roundIndex, this.bracket.rounds.length)}</h3>
                        <div class="bracket-matches" data-match-count="${round.matches.length}">
                            ${round.matches.map((match, matchIndex) => this.renderMatch(match, roundIndex, matchIndex)).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add vertical connectors after HTML is rendered
        this.addVerticalConnectors();
    }
    
    addVerticalConnectors() {
        const rounds = document.querySelectorAll('.bracket-round:not(:last-child)');
        
        rounds.forEach(round => {
            const matchesContainer = round.querySelector('.bracket-matches');
            const matchCount = parseInt(matchesContainer.getAttribute('data-match-count'));
            const matches = matchesContainer.querySelectorAll('.match-card');
            
            // Add vertical connector for every pair of matches (odd numbered matches)
            for (let i = 0; i < matchCount; i += 2) {
                if (i + 1 < matchCount) {
                    const firstMatch = matches[i];
                    const secondMatch = matches[i + 1];
                    
                    // Calculate the distance between the two matches
                    const firstRect = firstMatch.getBoundingClientRect();
                    const secondRect = secondMatch.getBoundingClientRect();
                    const distance = secondRect.top - firstRect.bottom;
                    
                    // Create vertical connector element
                    const connector = document.createElement('div');
                    connector.className = 'vertical-connector';
                    connector.style.cssText = `
                        position: absolute;
                        right: -4rem;
                        top: 50%;
                        width: 2px;
                        height: calc(100% + ${distance}px);
                        background: #1e3c72;
                        z-index: 0;
                    `;
                    
                    firstMatch.appendChild(connector);
                }
            }
        });
    }
    
    
    getRoundName(roundIndex, totalRounds) {
        const roundNumber = roundIndex + 1;
        const roundsFromEnd = totalRounds - roundIndex;
        
        // For incomplete tournaments, estimate total rounds needed
        let estimatedTotalRounds = totalRounds;
        if (totalRounds === 1 && this.participants.length > 2) {
            // Calculate how many rounds we need for current participants
            estimatedTotalRounds = Math.ceil(Math.log2(this.participants.length));
        }
        
        const estimatedRoundsFromEnd = estimatedTotalRounds - roundIndex;
        
        if (estimatedRoundsFromEnd === 1) return 'Final';
        if (estimatedRoundsFromEnd === 2) return 'Semifinal';
        if (estimatedRoundsFromEnd === 3) return 'Quarterfinal';
        if (estimatedRoundsFromEnd === 4) return 'Round of 16';
        if (estimatedRoundsFromEnd === 5) return 'Round of 32';
        
        return `Round ${roundNumber}`;
    }
    
    renderMatch(match, roundIndex, matchIndex) {
        const isCompleted = match.completed;
        const isBye = !match.player2 && match.player1;
        const isTBD = !match.player1 && !match.player2;
        const hasOnePlayer = (match.player1 && !match.player2) || (!match.player1 && match.player2);
        
        if (isTBD) {
            return `
                <div class="match-card tbd" onclick="app.openMatchDetail(${match.id})">
                    <div class="match-players">
                        <div class="player">
                            <div class="bracket-player-image-placeholder">?</div>
                            <div class="player-name">TBD</div>
                        </div>
                        <div class="vs">VS</div>
                        <div class="player">
                            <div class="bracket-player-image-placeholder">?</div>
                            <div class="player-name">TBD</div>
                        </div>
                    </div>
                    <div class="match-status">Waiting for previous matches</div>
                </div>
            `;
        }
        
        if (hasOnePlayer && !isCompleted) {
            const player = match.player1 || match.player2;
            return `
                <div class="match-card waiting" onclick="app.openMatchDetail(${match.id})">
                    <div class="match-players">
                        <div class="player">
                            ${player.image ? 
                                `<img src="${player.image}" alt="${player.name}" class="bracket-player-image">` :
                                `<div class="bracket-player-image-placeholder">👤</div>`
                            }
                            <div class="player-name">${player.name}</div>
                        </div>
                        <div class="vs">VS</div>
                        <div class="player">
                            <div class="bracket-player-image-placeholder">?</div>
                            <div class="player-name">TBD</div>
                        </div>
                    </div>
                    <div class="match-status">Waiting for opponent</div>
                </div>
            `;
        }
        
        return `
            <div class="match-card ${isCompleted ? 'completed' : ''}" onclick="app.openMatchDetail(${match.id})">
                <div class="match-players">
                    <div class="player ${match.winner?.id === match.player1?.id ? 'winner' : ''}">
                        ${match.player1?.image ? 
                            `<img src="${match.player1.image}" alt="${match.player1.name}" class="bracket-player-image">` :
                            `<div class="bracket-player-image-placeholder">👤</div>`
                        }
                        <div class="player-name">${this.truncateName(match.player1?.name || 'TBD')}</div>
                    </div>
                    ${!isBye ? `
                        <div class="vs">VS</div>
                        <div class="player ${match.winner?.id === match.player2?.id ? 'winner' : ''}">
                            ${match.player2?.image ? 
                                `<img src="${match.player2.image}" alt="${match.player2.name}" class="bracket-player-image">` :
                                `<div class="bracket-player-image-placeholder">👤</div>`
                            }
                            <div class="player-name">${this.truncateName(match.player2?.name || 'TBD')}</div>
                        </div>
                    ` : '<div class="bye-indicator">BYE</div>'}
                </div>
                ${isCompleted ? `
                    <div class="match-result" style="text-align: center; margin-top: 0.5rem; font-size: 0.85rem;">
                        <strong style="color: #28a745;">🏆 ${this.truncateName(match.winner?.name || 'Unknown')}</strong>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    truncateName(name, maxLength = 12) {
        if (!name) return 'Unknown';
        return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
    }
    
    async recordMatchResult(matchId, winnerId) {
        if (!this.isAdminLoggedIn) {
            alert('Admin access required to record match results');
            return;
        }
        
        try {
            const response = await fetch(`/api/matches/${matchId}/result`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ winnerId, password: this.adminPassword }),
            });
            
            if (response.ok) {
                const result = await response.json();
                this.bracket = result.bracket;
                
                // Refresh all data
                await this.loadParticipants();
                this.renderBracket();
                this.loadResults();
            } else {
                const error = await response.json();
                console.error('Match result error:', error);
                alert(error.error || 'Failed to record match result');
            }
        } catch (error) {
            console.error('Error recording match result:', error);
            alert('Error recording match result: ' + error.message);
        }
    }
    
    async loadResults() {
        try {
            const response = await fetch('/api/results');
            this.results = await response.json();
            this.renderResults();
        } catch (error) {
            console.error('Error loading results:', error);
        }
    }
    
    renderResults() {
        const container = document.getElementById('results-container');
        
        if (this.results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No results yet</h3>
                    <p>Results will appear here as matches are completed!</p>
                </div>
            `;
            return;
        }
        
        // Sort results by timestamp (newest first)
        const sortedResults = [...this.results].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        container.innerHTML = sortedResults.map(result => `
            <div class="result-card">
                <div class="result-header">
                    <div class="result-winner">🏆 ${result.winner?.name || 'Unknown'}</div>
                    <div class="result-timestamp">${this.formatDate(result.timestamp)}</div>
                </div>
                <div class="result-details">
                    ${result.winner?.name || 'Unknown'} defeated ${result.loser?.name || 'Unknown'}
                </div>
            </div>
        `).join('');
    }
    
    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Admin functionality
    loadAdminPanel() {
        if (!this.isAdminLoggedIn) {
            document.getElementById('admin-login').style.display = 'flex';
            document.getElementById('admin-panel').style.display = 'none';
        } else {
            document.getElementById('admin-login').style.display = 'none';
            document.getElementById('admin-panel').style.display = 'block';
            this.renderAdminParticipants();
        }
    }
    
    async adminLogin() {
        const password = document.getElementById('admin-password').value;
        
        if (!password) {
            alert('Please enter a password');
            return;
        }
        
        try {
            const response = await fetch('/api/admin/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });
            
            if (response.ok) {
                this.isAdminLoggedIn = true;
                this.adminPassword = password; // Store for later requests
                this.loadAdminPanel();
                document.getElementById('admin-password').value = '';
            } else {
                alert('Invalid admin password!');
                document.getElementById('admin-password').value = '';
            }
        } catch (error) {
            console.error('Error during admin login:', error);
            alert('Error connecting to server');
        }
    }
    
    adminLogout() {
        this.isAdminLoggedIn = false;
        this.adminPassword = null;
        this.loadAdminPanel();
    }
    
    renderAdminParticipants() {
        const container = document.getElementById('admin-participants-list');
        
        if (this.participants.length === 0) {
            container.innerHTML = '<p>No participants to manage</p>';
            return;
        }
        
        container.innerHTML = this.participants.map(participant => `
            <div class="admin-participant-card">
                ${participant.image ? 
                    `<img src="${participant.image}" alt="${participant.name}" class="admin-participant-image">` :
                    `<div class="admin-participant-placeholder">👤</div>`
                }
                <div class="admin-participant-name">${participant.name}</div>
                <div class="admin-participant-stats">
                    W: ${participant.wins || 0} | L: ${participant.losses || 0}
                </div>
                <button class="btn btn-danger" onclick="app.removeParticipant(${participant.id})" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">
                    Remove
                </button>
            </div>
        `).join('');
    }
    
    async removeParticipant(participantId) {
        const participant = this.participants.find(p => p.id === participantId);
        
        if (!confirm(`Are you sure you want to remove ${participant?.name}? This action cannot be undone.`)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/admin/participants/${participantId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: this.adminPassword }),
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert(result.message);
                await this.loadParticipants();
                this.renderAdminParticipants();
            } else {
                alert(result.error || 'Failed to remove participant');
            }
        } catch (error) {
            console.error('Error removing participant:', error);
            alert('Error removing participant');
        }
    }
    
    async resetTournament() {
        if (!confirm('Are you sure you want to reset all tournament results? This will clear the bracket and all match results, but keep participants.')) {
            return;
        }
        
        try {
            const response = await fetch('/api/admin/reset-tournament', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: this.adminPassword }),
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert(result.message);
                await this.loadParticipants();
                await this.loadBracket();
                await this.loadResults();
                this.renderAdminParticipants();
            } else {
                alert(result.error || 'Failed to reset tournament');
            }
        } catch (error) {
            console.error('Error resetting tournament:', error);
            alert('Error resetting tournament');
        }
    }
    
    async resetAll() {
        if (!confirm('Are you sure you want to reset EVERYTHING? This will remove all participants, results, and uploaded images. This action cannot be undone!')) {
            return;
        }
        
        try {
            const response = await fetch('/api/admin/reset-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: this.adminPassword }),
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert(result.message);
                await this.loadParticipants();
                await this.loadBracket();
                await this.loadResults();
                this.renderAdminParticipants();
            } else {
                alert(result.error || 'Failed to reset all data');
            }
        } catch (error) {
            console.error('Error resetting all data:', error);
            alert('Error resetting all data');
        }
    }
    
    // Match detail functionality
    openMatchDetail(matchId) {
        const match = this.findMatchById(matchId);
        if (!match) {
            alert('Match not found');
            return;
        }
        
        this.renderMatchDetail(match);
        document.getElementById('match-detail-modal').style.display = 'block';
    }
    
    findMatchById(matchId) {
        for (let round of this.bracket.rounds) {
            const match = round.matches.find(m => m.id === matchId);
            if (match) {
                // Add round info to match
                return { ...match, roundIndex: this.bracket.rounds.indexOf(round) };
            }
        }
        return null;
    }
    
    renderMatchDetail(match) {
        const roundName = this.getRoundName(match.roundIndex, this.bracket.rounds.length);
        const isCompleted = match.completed;
        const isBye = !match.player2 && match.player1;
        const isTBD = !match.player1 && !match.player2;
        const hasOnePlayer = (match.player1 && !match.player2) || (!match.player1 && match.player2);
        
        // Update round and title
        document.getElementById('match-detail-round').textContent = roundName;
        document.getElementById('match-detail-title').textContent = isBye ? 'Bye Match' : 'Match Details';
        
        // Render players
        const playersContainer = document.getElementById('match-detail-players');
        
        if (isTBD) {
            playersContainer.innerHTML = `
                <div class="match-detail-player">
                    <div class="match-detail-player-placeholder">?</div>
                    <div class="match-detail-player-name">TBD</div>
                    <div class="match-detail-player-stats">Waiting for previous matches</div>
                </div>
                <div class="match-detail-vs">VS</div>
                <div class="match-detail-player">
                    <div class="match-detail-player-placeholder">?</div>
                    <div class="match-detail-player-name">TBD</div>
                    <div class="match-detail-player-stats">Waiting for previous matches</div>
                </div>
            `;
        } else if (hasOnePlayer) {
            const player = match.player1 || match.player2;
            playersContainer.innerHTML = `
                <div class="match-detail-player">
                    ${player.image ? 
                        `<img src="${player.image}" alt="${player.name}" class="match-detail-player-image">` :
                        `<div class="match-detail-player-placeholder">👤</div>`
                    }
                    <div class="match-detail-player-name">${player.name}</div>
                    <div class="match-detail-player-stats">W: ${player.wins || 0} | L: ${player.losses || 0}</div>
                </div>
                <div class="match-detail-vs">VS</div>
                <div class="match-detail-player">
                    <div class="match-detail-player-placeholder">?</div>
                    <div class="match-detail-player-name">TBD</div>
                    <div class="match-detail-player-stats">Waiting for opponent</div>
                </div>
            `;
        } else if (isBye) {
            playersContainer.innerHTML = `
                <div class="match-detail-player winner">
                    ${match.player1.image ? 
                        `<img src="${match.player1.image}" alt="${match.player1.name}" class="match-detail-player-image">` :
                        `<div class="match-detail-player-placeholder">👤</div>`
                    }
                    <div class="match-detail-player-name">${match.player1.name}</div>
                    <div class="match-detail-player-stats">W: ${match.player1.wins || 0} | L: ${match.player1.losses || 0}</div>
                </div>
                <div class="match-detail-vs">BYE</div>
                <div class="match-detail-player" style="opacity: 0.3;">
                    <div class="match-detail-player-placeholder">-</div>
                    <div class="match-detail-player-name">No Opponent</div>
                    <div class="match-detail-player-stats">Automatic advance</div>
                </div>
            `;
        } else {
            playersContainer.innerHTML = `
                <div class="match-detail-player ${match.winner?.id === match.player1?.id ? 'winner' : ''}">
                    ${match.player1.image ? 
                        `<img src="${match.player1.image}" alt="${match.player1.name}" class="match-detail-player-image">` :
                        `<div class="match-detail-player-placeholder">👤</div>`
                    }
                    <div class="match-detail-player-name">${match.player1.name}</div>
                    <div class="match-detail-player-stats">W: ${match.player1.wins || 0} | L: ${match.player1.losses || 0}</div>
                </div>
                <div class="match-detail-vs">VS</div>
                <div class="match-detail-player ${match.winner?.id === match.player2?.id ? 'winner' : ''}">
                    ${match.player2.image ? 
                        `<img src="${match.player2.image}" alt="${match.player2.name}" class="match-detail-player-image">` :
                        `<div class="match-detail-player-placeholder">👤</div>`
                    }
                    <div class="match-detail-player-name">${match.player2.name}</div>
                    <div class="match-detail-player-stats">W: ${match.player2.wins || 0} | L: ${match.player2.losses || 0}</div>
                </div>
            `;
        }
        
        // Render status
        const statusContainer = document.getElementById('match-detail-status');
        if (isCompleted) {
            statusContainer.innerHTML = `
                <div class="completed">
                    <strong>🏆 Winner: ${match.winner?.name || 'Unknown'}</strong>
                </div>
            `;
        } else if (isTBD || hasOnePlayer) {
            statusContainer.innerHTML = `
                <div class="pending">
                    <strong>⏳ Match not ready</strong>
                </div>
            `;
        } else {
            statusContainer.innerHTML = `
                <div class="pending">
                    <strong>🔄 Match ready to play</strong>
                </div>
            `;
        }
        
        // Render actions
        const actionsContainer = document.getElementById('match-detail-actions');
        if (!isCompleted && !isBye && match.player1 && match.player2 && this.isAdminLoggedIn) {
            actionsContainer.innerHTML = `
                <button class="btn btn-success" onclick="app.recordMatchResultFromDetail(${match.id}, ${match.player1.id})">
                    ${match.player1.name} Wins
                </button>
                <button class="btn btn-success" onclick="app.recordMatchResultFromDetail(${match.id}, ${match.player2.id})">
                    ${match.player2.name} Wins
                </button>
            `;
        } else if (!this.isAdminLoggedIn && !isCompleted && match.player1 && match.player2) {
            actionsContainer.innerHTML = `
                <div style="text-align: center; color: #666;">
                    <p>🔒 Admin access required to record results</p>
                </div>
            `;
        } else {
            actionsContainer.innerHTML = '';
        }
    }
    
    async recordMatchResultFromDetail(matchId, winnerId) {
        await this.recordMatchResult(matchId, winnerId);
        // Close modal and refresh
        document.getElementById('match-detail-modal').style.display = 'none';
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PoolTournamentApp();
});