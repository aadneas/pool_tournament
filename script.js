class PoolTournamentApp {
    constructor() {
        this.currentSection = 'participants';
        this.participants = [];
        this.bracket = { rounds: [] };
        this.results = [];
        this.groups = { stage: 'not-started', groups: [], matches: [] };
        this.selectedParticipantId = null;
        this.isAdminLoggedIn = false;
        this.adminPassword = null;
        this.tournamentManager = window.tournamentManager;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadParticipants();
        this.loadGroups();
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
        
        // Manual tiebreaker modal
        const tiebreakerModal = document.getElementById('manual-tiebreaker-modal');
        const closeTiebreakerModal = tiebreakerModal.querySelector('.close');
        
        closeTiebreakerModal.addEventListener('click', () => {
            tiebreakerModal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === tiebreakerModal) {
                tiebreakerModal.style.display = 'none';
            }
        });
        
        document.getElementById('complete-manual-tiebreakers').addEventListener('click', () => {
            this.completeManualTiebreakers();
        });
        
        document.getElementById('cancel-tiebreakers').addEventListener('click', () => {
            tiebreakerModal.style.display = 'none';
        });

        // Insert participant modal
        const insertModal = document.getElementById('insert-participant-modal');
        const closeInsertModal = insertModal.querySelector('.close');
        
        closeInsertModal.addEventListener('click', () => {
            insertModal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === insertModal) {
                insertModal.style.display = 'none';
            }
        });
        
        document.getElementById('insert-participant-btn').addEventListener('click', () => {
            this.showInsertParticipantModal();
        });
        
        document.getElementById('participant-select').addEventListener('change', () => {
            this.updateInsertionPreview();
        });
        
        document.getElementById('group-select').addEventListener('change', () => {
            this.updateInsertionPreview();
        });
        
        document.getElementById('confirm-insert-participant').addEventListener('click', () => {
            this.insertParticipant();
        });
        
        document.getElementById('cancel-insert-participant').addEventListener('click', () => {
            insertModal.style.display = 'none';
        });

        document.getElementById('image-upload-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadImage();
        });        // Admin functionality
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

        // Group stage events
        document.getElementById('generate-groups-btn').addEventListener('click', () => {
            this.generateGroups();
        });

        document.getElementById('next-round-btn').addEventListener('click', () => {
            this.advanceToNextRound();
        });

        // Rules events - check if elements exist before binding
        const editRulesBtn = document.getElementById('edit-rules-btn');
        if (editRulesBtn) {
            editRulesBtn.addEventListener('click', () => {
                this.showRulesEditor();
            });
        }

        const cancelRulesBtn = document.getElementById('cancel-rules-edit-btn');
        if (cancelRulesBtn) {
            cancelRulesBtn.addEventListener('click', () => {
                this.hideRulesEditor();
            });
        }

        const addRuleSectionBtn = document.getElementById('add-rule-section-btn');
        if (addRuleSectionBtn) {
            addRuleSectionBtn.addEventListener('click', () => {
                this.addRuleSection();
            });
        }

        const rulesForm = document.getElementById('rules-form');
        if (rulesForm) {
            rulesForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveRules();
            });
        }
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
        } else if (section === 'groups') {
            this.loadGroups();
        } else if (section === 'brackets') {
            this.loadBracket();
        } else if (section === 'rules') {
            this.loadRules();
        } else if (section === 'results') {
            this.loadResults();
        } else if (section === 'admin') {
            this.loadAdminPanel();
        }
    }
    
    async loadParticipants() {
        try {
            this.participants = await this.tournamentManager.getParticipants();
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
            const newParticipant = await this.tournamentManager.addParticipant(name, this.adminPassword);
            this.participants = await this.tournamentManager.getParticipants();
            this.renderParticipants();
            this.hideAddParticipantForm();
            document.getElementById('participant-name').value = '';
        } catch (error) {
            console.error('Error adding participant:', error);
            alert(error.message || 'Error adding participant');
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
        
        try {
            const updatedParticipant = await this.tournamentManager.uploadParticipantImage(this.selectedParticipantId, file);
            
            // Update local data
            this.participants = await this.tournamentManager.getParticipants();
            
            // Refresh all views that show participant images
            this.renderParticipants();
            if (this.currentSection === 'brackets') {
                this.renderBracket();
            }
            if (this.currentSection === 'admin') {
                this.renderAdminParticipants();
            }
            
            document.getElementById('image-modal').style.display = 'none';
            fileInput.value = '';
        } catch (error) {
            console.error('Error uploading image:', error);
            alert(error.message || 'Error uploading image');
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
            this.bracket = await this.tournamentManager.generateBracket(this.adminPassword);
            this.renderBracket();
        } catch (error) {
            console.error('Error generating bracket:', error);
            alert(error.message || 'Error generating bracket');
        }
    }
    
    async loadBracket() {
        try {
            this.bracket = await this.tournamentManager.getBrackets();
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
        
        // Update bracket with latest participant data before rendering
        this.updateBracketParticipantData();
        
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

    updateBracketParticipantData() {
        // Update participant references in bracket with latest data
        if (!this.bracket.rounds) return;
        
        for (let round of this.bracket.rounds) {
            for (let match of round.matches) {
                if (match.player1) {
                    const updatedPlayer1 = this.participants.find(p => p.id === match.player1.id);
                    if (updatedPlayer1) {
                        match.player1 = updatedPlayer1;
                    }
                }
                if (match.player2) {
                    const updatedPlayer2 = this.participants.find(p => p.id === match.player2.id);
                    if (updatedPlayer2) {
                        match.player2 = updatedPlayer2;
                    }
                }
                if (match.winner) {
                    const updatedWinner = this.participants.find(p => p.id === match.winner.id);
                    if (updatedWinner) {
                        match.winner = updatedWinner;
                    }
                }
            }
        }
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
        // Use the round name from the bracket if available
        if (this.bracket.rounds && this.bracket.rounds[roundIndex] && this.bracket.rounds[roundIndex].name) {
            return this.bracket.rounds[roundIndex].name;
        }
        
        const roundNumber = roundIndex + 1;
        const roundsFromEnd = totalRounds - roundIndex;
        
        if (roundsFromEnd === 1) return 'Final';
        if (roundsFromEnd === 2) return 'Semifinal';  
        if (roundsFromEnd === 3) return 'Quarterfinal';
        if (roundsFromEnd === 4) return 'Round of 16';
        if (roundsFromEnd === 5) return 'Round of 32';
        
        return `Round ${roundNumber}`;
    }
    
    renderMatch(match, roundIndex, matchIndex) {
        const isCompleted = match.completed;
        const isBye = !match.player2 && match.player1 && match.completed; // Only true bye if actually completed
        const isTBD = !match.player1 && !match.player2;
        const hasOnePlayer = (match.player1 && !match.player2 && !match.completed) || (!match.player1 && match.player2 && !match.completed);
        
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
        
        const canEdit = !match.hasRecordedResult && this.isAdminLoggedIn;
        
        return `
            <div class="match-card ${isCompleted ? 'completed' : ''} ${canEdit ? 'editable' : ''}" onclick="app.openMatchDetail(${match.id})">
                ${canEdit ? '<div class="edit-indicator" style="position: absolute; top: 0.25rem; right: 0.25rem; font-size: 0.7rem; color: #666;">✏️</div>' : ''}
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
                ${this.renderMatchDateTime(match)}
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

    renderMatchDateTime(match) {
        if (!match.scheduledDate && !match.scheduledTime) {
            return '';
        }

        let dateTimeText = '';
        if (match.scheduledDate) {
            const date = new Date(match.scheduledDate);
            dateTimeText = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
        }
        if (match.scheduledTime) {
            if (dateTimeText) dateTimeText += ' ';
            dateTimeText += match.scheduledTime;
        }

        return `
            <div class="match-datetime" style="text-align: center; font-size: 0.75rem; color: #666; margin-top: 0.25rem;">
                📅 ${dateTimeText}
            </div>
        `;
    }
    
    async recordMatchResult(matchId, winnerId) {
        if (!this.isAdminLoggedIn) {
            alert('Admin access required to record match results');
            return;
        }
        
        try {
            const result = await this.tournamentManager.recordMatchResult(matchId, winnerId, this.adminPassword);
            this.bracket = result.bracket;
            
            // Refresh all data
            this.participants = await this.tournamentManager.getParticipants();
            this.renderBracket();
            this.loadResults();
        } catch (error) {
            console.error('Error recording match result:', error);
            alert(error.message || 'Error recording match result');
        }
    }
    
    async loadResults() {
        try {
            this.results = await this.tournamentManager.getResults();
            this.renderResults();
        } catch (error) {
            console.error('Error loading results:', error);
        }
    }

    async loadGroups() {
        try {
            this.groups = await this.tournamentManager.getGroups();
            this.renderGroups();
        } catch (error) {
            console.error('Error loading groups:', error);
        }
    }

    async generateGroups() {
        if (this.participants.length < 8) {
            alert('Need at least 8 participants for group stage!');
            return;
        }
        
        if (!this.isAdminLoggedIn) {
            alert('Admin access required to generate groups');
            return;
        }
        
        try {
            this.groups = await this.tournamentManager.generateGroups(this.adminPassword);
            this.renderGroups();
            alert('Groups generated successfully!');
        } catch (error) {
            console.error('Error generating groups:', error);
            alert(error.message || 'Error generating groups');
        }
    }

    async advanceToNextRound() {
        if (!this.isAdminLoggedIn) {
            alert('Admin access required to advance rounds');
            return;
        }
        
        try {
            const result = await this.tournamentManager.advanceToNextRound(this.adminPassword);
            
            // Check if manual tiebreaker resolution is needed
            if (result.needsManualTiebreak) {
                this.groups = result.groupsData;
                this.showManualTiebreakerModal(result.groupsNeedingTiebreak);
                return;
            }
            
            this.groups = result.groupsData;
            this.renderGroups();
            alert(result.message);
        } catch (error) {
            console.error('Error advancing round:', error);
            alert(error.message || 'Error advancing to next round');
        }
    }

    renderGroups() {
        const container = document.getElementById('groups-container');
        const nextRoundBtn = document.getElementById('next-round-btn');
        
        if (this.groups.stage === 'not-started') {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Group Stage Not Started</h3>
                    <p>Generate groups to begin the Swiss format group stage!</p>
                </div>
            `;
            nextRoundBtn.style.display = 'none';
            return;
        }

        // Show/hide control buttons
        const insertParticipantBtn = document.getElementById('insert-participant-btn');
        
        if (this.groups.stage === 'in-progress' && this.isAdminLoggedIn) {
            nextRoundBtn.style.display = 'inline-block';
            insertParticipantBtn.style.display = 'inline-block';
            
            const currentRoundMatches = this.groups.matches.filter(m => m.round === this.groups.currentRound);
            const completedMatches = currentRoundMatches.filter(m => m.completed);
            nextRoundBtn.textContent = completedMatches.length === currentRoundMatches.length ? 
                (this.groups.currentRound >= this.groups.totalRounds ? 'Complete Group Stage' : 'Generate Next Round (Admin)') :
                `Next Round (${completedMatches.length}/${currentRoundMatches.length} complete)`;
        } else {
            nextRoundBtn.style.display = 'none';
            insertParticipantBtn.style.display = 'none';
        }

        const standings = this.tournamentManager.getGroupStandings(this.groups);
        
        container.innerHTML = `
            <div class="groups-header">
                <h3>Round ${this.groups.currentRound} of ${this.groups.totalRounds} ${this.groups.stage === 'completed' ? '(COMPLETED)' : ''}</h3>
            </div>
            <div class="groups-standings-section">
                <h3>Group Standings</h3>
                <div class="groups-standings-grid">
                    ${standings.map(group => this.renderGroupStandingsOnly(group)).join('')}
                </div>
            </div>
            <div class="groups-matches-section">
                <h3>Round ${this.groups.currentRound} Matches</h3>
                <div class="groups-matches-grid">
                    ${standings.map(group => this.renderGroupMatchesOnly(group)).join('')}
                </div>
            </div>
        `;
        
        // Add event listeners for clickable player names
        setTimeout(() => {
            const clickableNames = document.querySelectorAll('.clickable-player');
            clickableNames.forEach(element => {
                element.addEventListener('click', async (event) => {
                    event.preventDefault();
                    const playerId = element.getAttribute('data-player-id');
                    const groupId = element.getAttribute('data-group-id');
                    await this.showPlayerDetails(playerId, groupId);
                });
            });

        }, 50);
    }

    renderGroup(group) {
        return `
            <div class="group-card">
                <h3>${group.name}</h3>
                <div class="group-standings">
                    <table>
                        <thead>
                            <tr>
                                <th>Pos</th>
                                <th>Player</th>
                                <th>W-L</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${group.standings.map(player => `
                                <tr>
                                    <td>${player.position}</td>
                                    <td class="player-name clickable-player" data-player-id="${player.id}" data-group-id="${group.id}" style="cursor: pointer;">
                                        ${player.image ? 
                                            `<img src="${player.image}" alt="${player.name}" class="mini-player-image">` :
                                            `<div class="mini-player-placeholder">👤</div>`
                                        }
                                        ${this.truncateName(player.name, 10)}
                                    </td>
                                    <td>${player.groupWins}-${player.groupLosses}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${group.standings.length > 1 ? `
                        <div class="qualification-note">
                            <small>🏆 Top 1 qualify for knockouts</small>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderGroupWithMatches(group) {
        // Get all rounds from current down to 1 (reversed order)
        const allRounds = [];
        for (let round = this.groups.currentRound; round >= 1; round--) {
            allRounds.push(round);
        }
        
        return `
            <div class="group-card-with-matches">
                <div class="group-standings-section">
                    <h3>${group.name}</h3>
                    <div class="group-standings">
                        <table>
                            <thead>
                                <tr>
                                    <th>Pos</th>
                                    <th>Player</th>
                                    <th>W-L</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${group.standings.map(player => `
                                    <tr>
                                        <td>${player.position}</td>
                                        <td class="player-name clickable-player" data-player-id="${player.id}" data-group-id="${group.id}" style="cursor: pointer;">
                                            ${player.image ? 
                                                `<img src="${player.image}" alt="${player.name}" class="large-player-image">` :
                                                `<div class="large-player-placeholder">👤</div>`
                                            }
                                            ${this.truncateName(player.name, 10)}
                                        </td>
                                        <td>${player.groupWins}-${player.groupLosses}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        ${group.standings.length > 1 ? `
                            <div class="qualification-note">
                                <small>🏆 Top 1 qualify for knockouts</small>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="group-matches-section">
                    ${allRounds.map(round => `
                        <div class="round-matches">
                            <h4>${round === this.groups.currentRound ? 'Current Round' : `Round ${round}`}</h4>
                            <div class="matches-column">
                                ${this.renderGroupMatchesForGroup(group.id, round)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderGroupMatchesForGroup(groupId, round) {
        const roundMatches = this.groups.matches.filter(m => 
            m.round === round && 
            (m.groupId === groupId || m.groupId === parseInt(groupId) || m.groupId?.toString() === groupId)
        );
        
        if (roundMatches.length === 0) {
            return '<p class="no-matches">No matches</p>';
        }

        return roundMatches.map(match => `
            <div class="group-match-card ${match.completed ? 'completed' : ''} ${match.isBye ? 'bye-match' : ''} ${match.isTiebreaker ? 'tiebreaker-match' : ''}" onclick="app.openGroupMatchDetail(${match.id})">
                <div class="match-header">
                    <span class="round-indicator">R${match.round}${match.isTiebreaker ? ' (Tiebreaker)' : ''}</span>
                    ${this.renderMatchDateTime(match)}
                </div>
                <div class="match-players">
                    ${match.isBye ? `
                        <div class="bye-display">
                            <div class="player">
                                ${match.player1?.image ? 
                                    `<img src="${match.player1.image}" alt="${match.player1.name}" class="large-match-player-image">` :
                                    `<div class="large-match-player-placeholder">👤</div>`
                                }
                                <span>${this.truncateName(match.player1?.name || 'TBD', 12)}</span>
                            </div>
                            <div class="bye-text">BYE</div>
                        </div>
                    ` : `
                        <div class="player ${match.winner?.id === match.player1?.id ? 'winner' : ''}">
                            ${match.player1?.image ? 
                                `<img src="${match.player1.image}" alt="${match.player1.name}" class="large-match-player-image">` :
                                `<div class="large-match-player-placeholder">👤</div>`
                            }
                            <span>${this.truncateName(match.player1?.name || 'TBD', 12)}</span>
                        </div>
                        <div class="vs">VS</div>
                        <div class="player ${match.winner?.id === match.player2?.id ? 'winner' : ''}">
                            ${match.player2?.image ? 
                                `<img src="${match.player2.image}" alt="${match.player2.name}" class="large-match-player-image">` :
                                `<div class="large-match-player-placeholder">👤</div>`
                            }
                            <span>${this.truncateName(match.player2?.name || 'TBD', 12)}</span>
                        </div>
                    `}
                </div>
                ${match.completed && !match.isBye ? `
                    <div class="match-result">
                        Winner: ${match.winner?.name || 'Unknown'}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    getTieBreakerInfo(group) {
        const standings = group.standings;
        const tiedPlayers = [];
        let hasTies = false;
        let explanation = "";

        // Check for ties in top positions (positions 1-2, as ties around position 1 affect qualification)
        for (let i = 0; i < Math.min(standings.length, 2); i++) {
            const currentPlayer = standings[i];
            
            // Check if tied with next player
            if (i < standings.length - 1) {
                const nextPlayer = standings[i + 1];
                if (currentPlayer.groupWins === nextPlayer.groupWins && 
                    currentPlayer.groupLosses === nextPlayer.groupLosses) {
                    
                    if (!tiedPlayers.includes(currentPlayer.id)) {
                        tiedPlayers.push(currentPlayer.id);
                    }
                    tiedPlayers.push(nextPlayer.id);
                    hasTies = true;
                }
            }
        }

        if (hasTies) {
            explanation = "Head-to-head record, then win % vs common opponents, then alphabetical";
        }

        return { hasTies, tiedPlayers, explanation };
    }

    renderGroupStandingsOnly(group) {
        return `
            <div class="group-standings-card">
                <h4>${group.name}</h4>
                <div class="group-standings">
                    <table>
                        <thead>
                            <tr>
                                <th>Pos</th>
                                <th>Player</th>
                                <th>W-L</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${group.standings.map(player => {
                                // Get current participant data to ensure we have the latest image
                                const currentParticipant = this.participants.find(p => p.id === player.id);
                                const currentImage = currentParticipant ? currentParticipant.image : player.image;
                                
                                return `
                                <tr>
                                    <td>${player.position}</td>
                                    <td class="player-name clickable-player" data-player-id="${player.id}" data-group-id="${group.id}" style="cursor: pointer;">
                                        ${currentImage ? 
                                            `<img src="${currentImage}" alt="${player.name}" class="mini-player-image">` :
                                            `<div class="mini-player-placeholder">👤</div>`
                                        }
                                        ${this.truncateName(player.name, 10)}
                                    </td>
                                    <td>${player.groupWins}-${player.groupLosses}</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                    ${group.standings.length > 1 ? `
                        <div class="qualification-note">
                            <small>🏆 Top 1 qualify</small>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderGroupMatchesOnly(group) {
        // Get all rounds for this group, sorted from newest to oldest
        const allGroupMatches = this.groups.matches.filter(m => 
            (m.groupId === group.id || m.groupId === parseInt(group.id) || m.groupId?.toString() === group.id)
        );
        
        if (allGroupMatches.length === 0) {
            return `
                <div class="group-matches-card">
                    <h4>${group.name} Matches</h4>
                    <p class="no-matches">No matches yet</p>
                </div>
            `;
        }

        // Group matches by round
        const matchesByRound = {};
        allGroupMatches.forEach(match => {
            if (!matchesByRound[match.round]) {
                matchesByRound[match.round] = [];
            }
            matchesByRound[match.round].push(match);
        });

        // Sort rounds from newest to oldest
        const sortedRounds = Object.keys(matchesByRound)
            .map(r => parseInt(r))
            .sort((a, b) => b - a);

        return `
            <div class="group-matches-card">
                <h4>${group.name} Matches</h4>
                <div class="rounds-container">
                    ${sortedRounds.map(round => `
                        <div class="round-section ${round === this.groups.currentRound ? 'current-round' : 'completed-round'}">
                            <h5 class="round-title">
                                Round ${round}
                                ${round === this.groups.currentRound ? ' (Current)' : ''}
                            </h5>
                            <div class="matches-list">
                                ${matchesByRound[round].map(match => `
                        <div class="group-match-card ${match.completed ? 'completed' : ''} ${match.isBye ? 'bye-match' : ''} ${match.isTiebreaker ? 'tiebreaker-match' : ''}" onclick="app.openGroupMatchDetail(${match.id})">
                            <div class="match-header">
                                <span class="group-indicator">${group.name}</span>
                                <span class="round-indicator">R${match.round}${match.isTiebreaker ? ' (Tiebreaker)' : ''}</span>
                                ${this.renderMatchDateTime(match)}
                            </div>
                            <div class="match-players">
                                ${match.isBye ? `
                                    <div class="bye-display">
                                        <div class="player">
                                            ${this.getCurrentPlayerImage(match.player1) ? 
                                                `<img src="${this.getCurrentPlayerImage(match.player1)}" alt="${match.player1.name}" class="small-match-player-image">` :
                                                `<div class="small-match-player-placeholder">👤</div>`
                                            }
                                            <span>${this.truncateName(match.player1?.name || 'TBD', 12)}</span>
                                        </div>
                                        <div class="bye-text">BYE</div>
                                    </div>
                                ` : `
                                    <div class="player ${match.winner?.id === match.player1?.id ? 'winner' : ''}">
                                        ${this.getCurrentPlayerImage(match.player1) ? 
                                            `<img src="${this.getCurrentPlayerImage(match.player1)}" alt="${match.player1.name}" class="small-match-player-image">` :
                                            `<div class="small-match-player-placeholder">👤</div>`
                                        }
                                        <span>${this.truncateName(match.player1?.name || 'TBD', 12)}</span>
                                    </div>
                                    <div class="vs">VS</div>
                                    <div class="player ${match.winner?.id === match.player2?.id ? 'winner' : ''}">
                                        ${this.getCurrentPlayerImage(match.player2) ? 
                                            `<img src="${this.getCurrentPlayerImage(match.player2)}" alt="${match.player2.name}" class="small-match-player-image">` :
                                            `<div class="small-match-player-placeholder">👤</div>`
                                        }
                                        <span>${this.truncateName(match.player2?.name || 'TBD', 12)}</span>
                                    </div>
                                `}
                            </div>
                            ${match.completed && !match.isBye ? `
                                <div class="match-result">
                                    Winner: ${match.winner?.name || 'Unknown'}
                                </div>
                            ` : ''}
                        </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    showDetailedTieBreaker(groupId) {
        const group = this.groups.groups.find(g => g.id === groupId);
        if (!group) return;

        // Find all tied players
        const tiedGroups = {};
        group.standings.forEach((player, index) => {
            const key = `${player.groupWins}-${player.groupLosses}`;
            if (!tiedGroups[key]) tiedGroups[key] = [];
            tiedGroups[key].push({ ...player, originalPosition: index + 1 });
        });

        // Filter to only tied groups with more than 1 player
        const actualTies = Object.entries(tiedGroups).filter(([key, players]) => players.length > 1);

        if (actualTies.length === 0) {
            alert('No ties found in this group.');
            return;
        }

        let detailsHtml = `
            <div class="tie-breaker-details-modal" style="
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: white; padding: 2rem; border-radius: 10px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 2000;
                max-width: 600px; max-height: 80vh; overflow-y: auto;
            ">
                <h3 style="margin-top: 0; color: #1e3c72;">${group.name} - Tie-Breaker Details</h3>
        `;

        actualTies.forEach(([record, players]) => {
            detailsHtml += `
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 6px;">
                    <h4 style="margin: 0 0 1rem 0; color: #495057;">Tied at ${record} (W-L)</h4>
                    <div style="margin-bottom: 1rem;">
                        <strong>Players:</strong> ${players.map(p => `${p.name} (Pos ${p.originalPosition})`).join(', ')}
                    </div>
            `;

            // Show head-to-head matrix for tied players
            if (players.length === 2) {
                const p1 = players[0], p2 = players[1];
                const h2h = this.tournamentManager.getHeadToHeadRecord(p1.id, p2.id, groupId, this.groups.matches);
                detailsHtml += `
                    <div><strong>Head-to-Head:</strong> ${p1.name} vs ${p2.name} = ${h2h.record}</div>
                    ${h2h.winner ? `<div style="color: #28a745;">Winner by H2H: ${h2h.winner === p1.id ? p1.name : p2.name}</div>` : '<div style="color: #ffc107;">No H2H advantage</div>'}
                `;
            } else {
                // Multiple players tied - show matrix
                detailsHtml += `<div><strong>Head-to-Head Matrix:</strong></div>`;
                detailsHtml += `<table style="width: 100%; margin: 0.5rem 0; border-collapse: collapse;">`;
                detailsHtml += `<tr><th style="border: 1px solid #ddd; padding: 0.25rem;">vs</th>`;
                players.forEach(p => {
                    detailsHtml += `<th style="border: 1px solid #ddd; padding: 0.25rem; font-size: 0.8rem;">${this.truncateName(p.name, 6)}</th>`;
                });
                detailsHtml += `</tr>`;

                players.forEach(p1 => {
                    detailsHtml += `<tr><td style="border: 1px solid #ddd; padding: 0.25rem; font-weight: bold; font-size: 0.8rem;">${this.truncateName(p1.name, 6)}</td>`;
                    players.forEach(p2 => {
                        if (p1.id === p2.id) {
                            detailsHtml += `<td style="border: 1px solid #ddd; padding: 0.25rem; background: #f0f0f0;">-</td>`;
                        } else {
                            const h2h = this.tournamentManager.getHeadToHeadRecord(p1.id, p2.id, groupId, this.groups.matches);
                            const color = h2h.winner === p1.id ? '#d4edda' : h2h.winner === p2.id ? '#f8d7da' : '#fff3cd';
                            detailsHtml += `<td style="border: 1px solid #ddd; padding: 0.25rem; background: ${color}; font-size: 0.8rem;">${h2h.record}</td>`;
                        }
                    });
                    detailsHtml += `</tr>`;
                });
                detailsHtml += `</table>`;
            }

            detailsHtml += `</div>`;
        });

        detailsHtml += `
                <div style="text-align: right; margin-top: 1rem;">
                    <button class="btn btn-secondary" onclick="this.parentElement.parentElement.remove(); document.getElementById('tie-breaker-overlay').remove();">
                        Close
                    </button>
                </div>
            </div>
            <div id="tie-breaker-overlay" style="
                position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                background: rgba(0,0,0,0.5); z-index: 1999;
            " onclick="this.remove(); document.querySelector('.tie-breaker-details-modal').remove();"></div>
        `;

        document.body.insertAdjacentHTML('beforeend', detailsHtml);
    }

    async showPlayerDetails(playerId, groupId) {
        // Get fresh groups data to ensure we have the latest matches
        try {
            this.groups = await this.tournamentManager.getGroups();
        } catch (error) {
            console.error('Error getting fresh groups data:', error);
        }
        
        if (!this.groups || !this.groups.groups) {
            alert('Groups data not available. Please try again.');
            return;
        }

        // Get the processed standings to find the player with standings info
        const standings = this.tournamentManager.getGroupStandings(this.groups);
        
        // Find the group in the processed standings (which has the standings data)
        const group = standings.find(g => g.id === groupId || g.id === parseInt(groupId) || g.id.toString() === groupId);
        if (!group) {
            alert(`Group not found. Looking for: ${groupId}`);
            return;
        }

        // Find the player in the standings
        const player = group.standings.find(p => p.id === playerId || p.id === parseInt(playerId) || p.id.toString() === playerId);
        if (!player) {
            alert(`Player not found. Looking for: ${playerId}`);
            return;
        }

        // Get all matches for this player in this group
        const playerMatches = this.groups.matches.filter(match => {
            const groupMatch = (match.groupId === groupId || match.groupId === parseInt(groupId) || match.groupId?.toString() === groupId);
            const player1Match = (match.player1?.id === playerId || match.player1?.id === parseInt(playerId) || match.player1?.id?.toString() === playerId);
            const player2Match = (match.player2?.id === playerId || match.player2?.id === parseInt(playerId) || match.player2?.id?.toString() === playerId);
            return groupMatch && (player1Match || player2Match);
        }).sort((a, b) => a.round - b.round);

        // Get tied players
        const tiedPlayers = group.standings.filter(p => 
            p.groupWins === player.groupWins && 
            p.groupLosses === player.groupLosses &&
            p.id !== player.id
        );

        let detailsHtml = `
            <div class="player-details-modal" style="
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: white; padding: 2rem; border-radius: 10px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 2000;
                max-width: 700px; max-height: 85vh; overflow-y: auto;
            ">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                    ${player.image ? 
                        `<img src="${player.image}" alt="${player.name}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">` :
                        `<div style="width: 60px; height: 60px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">👤</div>`
                    }
                    <div>
                        <h3 style="margin: 0; color: #1e3c72;">${player.name}</h3>
                        <p style="margin: 0.25rem 0 0 0; color: #666;">
                            ${group.name} - Position ${player.position}
                        </p>
                    </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #495057;">Group Stage Stats</h4>
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 6px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                            <div><strong>Record:</strong> ${player.groupWins}-${player.groupLosses}</div>
                            <div><strong>Win Rate:</strong> ${player.groupWins + player.groupLosses > 0 ? Math.round((player.groupWins / (player.groupWins + player.groupLosses)) * 100) : 0}%</div>
                            <div><strong>Status:</strong> ${player.position === 1 ? '🏆 Qualified' : 'Eliminated'}</div>
                        </div>
                    </div>
                </div>
        `;

        // Show tie-breaker information if tied with other players
        if (tiedPlayers.length > 0) {
            detailsHtml += `
                <div style="margin-bottom: 1.5rem;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #495057;">Tie-Breaker Status</h4>
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 1rem; border-radius: 6px;">
                        <div style="margin-bottom: 0.5rem;"><strong>Tied with:</strong> ${tiedPlayers.map(p => p.name).join(', ')} (${player.groupWins}-${player.groupLosses})</div>
            `;

            tiedPlayers.forEach(tiedPlayer => {
                const h2h = this.tournamentManager.getHeadToHeadRecord(playerId, tiedPlayer.id, groupId, this.groups.matches);
                if (h2h.record !== "0-0") {
                    const status = h2h.winner === playerId ? '✅ Ahead' : h2h.winner === tiedPlayer.id ? '❌ Behind' : '🟡 Even';
                    detailsHtml += `<div><strong>vs ${tiedPlayer.name}:</strong> ${h2h.record} ${status}</div>`;
                } else {
                    detailsHtml += `<div><strong>vs ${tiedPlayer.name}:</strong> No games played</div>`;
                }
            });

            detailsHtml += `</div></div>`;
        }

        // Show match history
        detailsHtml += `
            <div style="margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 0.5rem 0; color: #495057;">Group Stage Match History</h4>
                <div style="max-height: 300px; overflow-y: auto;">
        `;

        if (playerMatches.length === 0) {
            detailsHtml += `<p style="color: #666; font-style: italic;">No matches yet</p>`;
        } else {
            playerMatches.forEach(match => {
                // Determine opponent with proper ID comparison
                let opponent = null;
                const player1Match = (match.player1?.id === playerId || match.player1?.id === parseInt(playerId) || match.player1?.id?.toString() === playerId);
                const player2Match = (match.player2?.id === playerId || match.player2?.id === parseInt(playerId) || match.player2?.id?.toString() === playerId);
                
                if (player1Match) {
                    opponent = match.player2;
                } else if (player2Match) {
                    opponent = match.player1;
                }
                
                // Determine if player won with proper ID comparison
                let isWinner = false;
                if (match.winner) {
                    isWinner = (match.winner.id === playerId || match.winner.id === parseInt(playerId) || match.winner.id?.toString() === playerId);
                }
                
                const isBye = match.isBye || !opponent;
                
                let matchStatus, statusColor, statusIcon;
                if (isBye) {
                    matchStatus = "BYE (Auto Win)";
                    statusColor = "#ffc107";
                    statusIcon = "🎁";
                } else if (!match.completed) {
                    matchStatus = match.scheduledDate || match.scheduledTime ? "Scheduled" : "Not Played";
                    statusColor = "#6c757d";
                    statusIcon = "⏳";
                } else if (isWinner) {
                    matchStatus = "Won";
                    statusColor = "#28a745";
                    statusIcon = "🏆";
                } else {
                    matchStatus = "Lost";
                    statusColor = "#dc3545";
                    statusIcon = "❌";
                }

                let scheduleInfo = "";
                if (match.scheduledDate || match.scheduledTime) {
                    let dateTimeText = "";
                    if (match.scheduledDate) {
                        const date = new Date(match.scheduledDate);
                        dateTimeText = date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                        });
                    }
                    if (match.scheduledTime) {
                        if (dateTimeText) dateTimeText += ' ';
                        dateTimeText += match.scheduledTime;
                    }
                    scheduleInfo = `<div style="font-size: 0.8rem; color: #666;">📅 ${dateTimeText}</div>`;
                }

                detailsHtml += `
                    <div style="
                        display: flex; justify-content: space-between; align-items: center; 
                        padding: 0.75rem; margin-bottom: 0.5rem; 
                        background: ${match.completed ? '#f8f9fa' : '#ffffff'}; 
                        border: 1px solid #dee2e6; border-radius: 6px;
                        border-left: 4px solid ${statusColor};
                    ">
                        <div>
                            <div style="font-weight: 600;">
                                Round ${match.round}: vs ${isBye ? "BYE" : (opponent?.name || "TBD")}
                            </div>
                            ${scheduleInfo}
                        </div>
                        <div style="text-align: right;">
                            <div style="color: ${statusColor}; font-weight: 600;">
                                ${statusIcon} ${matchStatus}
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        detailsHtml += `
                </div>
            </div>
            
            <div style="text-align: right; margin-top: 1rem; border-top: 1px solid #dee2e6; padding-top: 1rem;">
                <button class="btn btn-secondary" onclick="this.parentElement.parentElement.remove(); document.getElementById('player-details-overlay').remove();">
                    Close
                </button>
            </div>
        </div>
        <div id="player-details-overlay" style="
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
            background: rgba(0,0,0,0.5); z-index: 1999;
        " onclick="this.remove(); document.querySelector('.player-details-modal').remove();"></div>
        `;

        document.body.insertAdjacentHTML('beforeend', detailsHtml);
    }

    renderGroupMatches(round) {
        const roundMatches = this.groups.matches.filter(m => m.round === round);
        
        if (roundMatches.length === 0) {
            return '<p>No matches in this round</p>';
        }

        return roundMatches.map(match => `
            <div class="group-match-card ${match.completed ? 'completed' : ''} ${match.isBye ? 'bye-match' : ''}" onclick="app.openGroupMatchDetail(${match.id})">
                <div class="match-header">
                    <span class="group-name">${match.groupName}</span>
                    ${this.renderMatchDateTime(match)}
                </div>
                <div class="match-players">
                    ${match.isBye ? `
                        <div class="bye-display">
                            <div class="player winner">
                                ${match.player1?.image ? 
                                    `<img src="${match.player1.image}" alt="${match.player1.name}" class="mini-player-image">` :
                                    `<div class="mini-player-placeholder">👤</div>`
                                }
                                <span>${this.truncateName(match.player1?.name || 'TBD', 12)}</span>
                            </div>
                            <div class="bye-text">BYE</div>
                        </div>
                    ` : `
                        <div class="player ${match.winner?.id === match.player1?.id ? 'winner' : ''}">
                            ${match.player1?.image ? 
                                `<img src="${match.player1.image}" alt="${match.player1.name}" class="mini-player-image">` :
                                `<div class="mini-player-placeholder">👤</div>`
                            }
                            <span>${this.truncateName(match.player1?.name || 'TBD', 8)}</span>
                        </div>
                        <div class="vs">VS</div>
                        <div class="player ${match.winner?.id === match.player2?.id ? 'winner' : ''}">
                            ${match.player2?.image ? 
                                `<img src="${match.player2.image}" alt="${match.player2.name}" class="mini-player-image">` :
                                `<div class="mini-player-placeholder">👤</div>`
                            }
                            <span>${this.truncateName(match.player2?.name || 'TBD', 8)}</span>
                        </div>
                    `}
                </div>
                ${match.completed ? `
                    <div class="match-result">
                        🏆 ${this.truncateName(match.winner?.name || 'Unknown', 10)}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    openGroupMatchDetail(matchId) {
        const match = this.groups.matches.find(m => m.id === matchId);
        if (!match) {
            alert('Match not found');
            return;
        }
        
        this.renderGroupMatchDetail(match);
        document.getElementById('match-detail-modal').style.display = 'block';
    }

    renderGroupMatchDetail(match) {
        document.getElementById('match-detail-round').textContent = `${match.groupName} - Round ${match.round}`;
        document.getElementById('match-detail-title').textContent = 'Group Stage Match';
        
        // Render players
        const playersContainer = document.getElementById('match-detail-players');
        
        if (match.isBye) {
            playersContainer.innerHTML = `
                <div class="match-detail-player winner">
                    ${this.getCurrentPlayerImage(match.player1) ? 
                        `<img src="${this.getCurrentPlayerImage(match.player1)}" alt="${match.player1.name}" class="match-detail-player-image">` :
                        `<div class="match-detail-player-placeholder">👤</div>`
                    }
                    <div class="match-detail-player-name">${match.player1?.name}</div>
                    <div class="match-detail-player-stats">Group Record: ${match.player1?.groupWins || 0}-${match.player1?.groupLosses || 0}</div>
                </div>
                <div class="match-detail-vs" style="color: #ffc107; font-weight: bold;">BYE</div>
                <div class="match-detail-bye-explanation" style="text-align: center; color: #666; font-style: italic;">
                    Automatic win due to bye
                </div>
            `;
        } else {
            playersContainer.innerHTML = `
                <div class="match-detail-player ${match.winner?.id === match.player1?.id ? 'winner' : ''}">
                    ${this.getCurrentPlayerImage(match.player1) ? 
                        `<img src="${this.getCurrentPlayerImage(match.player1)}" alt="${match.player1.name}" class="match-detail-player-image">` :
                        `<div class="match-detail-player-placeholder">👤</div>`
                    }
                    <div class="match-detail-player-name">${match.player1?.name}</div>
                    <div class="match-detail-player-stats">Group Record: ${match.player1?.groupWins || 0}-${match.player1?.groupLosses || 0}</div>
                </div>
                <div class="match-detail-vs">VS</div>
                <div class="match-detail-player ${match.winner?.id === match.player2?.id ? 'winner' : ''}">
                    ${this.getCurrentPlayerImage(match.player2) ? 
                        `<img src="${this.getCurrentPlayerImage(match.player2)}" alt="${match.player2.name}" class="match-detail-player-image">` :
                        `<div class="match-detail-player-placeholder">👤</div>`
                    }
                    <div class="match-detail-player-name">${match.player2?.name}</div>
                    <div class="match-detail-player-stats">Group Record: ${match.player2?.groupWins || 0}-${match.player2?.groupLosses || 0}</div>
                </div>
            `;
        }
        
        // Render status
        const statusContainer = document.getElementById('match-detail-status');
        if (match.completed) {
            statusContainer.innerHTML = `
                <div class="completed">
                    <strong>🏆 Winner: ${match.winner?.name || 'Unknown'}</strong>
                </div>
            `;
        } else {
            let scheduleInfo = '';
            if (match.scheduledDate || match.scheduledTime) {
                let dateTimeText = '';
                if (match.scheduledDate) {
                    const date = new Date(match.scheduledDate);
                    dateTimeText = date.toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric' 
                    });
                }
                if (match.scheduledTime) {
                    if (dateTimeText) dateTimeText += ' at ';
                    dateTimeText += match.scheduledTime;
                }
                scheduleInfo = `<div style="margin-top: 0.5rem; color: #666;">📅 Scheduled: ${dateTimeText}</div>`;
            }
            
            statusContainer.innerHTML = `
                <div class="pending">
                    <strong>🔄 Group match ready to play</strong>
                    ${scheduleInfo}
                </div>
            `;
        }
        
        // Render actions
        const actionsContainer = document.getElementById('match-detail-actions');
        if (match.isBye) {
            actionsContainer.innerHTML = `
                <div style="text-align: center; color: #666;">
                    <p>This is a bye match - no action required</p>
                </div>
            `;
        } else if (this.isAdminLoggedIn && !match.hasRecordedResult) {
            actionsContainer.innerHTML = `
                <div class="match-scheduling" style="margin-bottom: 1rem;">
                    <h4 style="margin-bottom: 0.5rem;">Schedule Match</h4>
                    <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                        <input type="date" id="group-match-date-${match.id}" value="${match.scheduledDate || ''}" style="padding: 0.25rem; font-size: 0.8rem;">
                        <input type="time" id="group-match-time-${match.id}" value="${match.scheduledTime || ''}" style="padding: 0.25rem; font-size: 0.8rem;">
                        <button class="btn btn-primary" style="font-size: 0.8rem; padding: 0.25rem 0.5rem;" onclick="app.scheduleGroupMatchFromDetail(${match.id})">
                            Set Schedule
                        </button>
                    </div>
                </div>
                <div class="match-result-buttons">
                    <button class="btn btn-success" onclick="app.recordGroupMatchResultFromDetail(${match.id}, ${match.player1.id})">
                        ${match.player1.name} Wins
                    </button>
                    <button class="btn btn-success" onclick="app.recordGroupMatchResultFromDetail(${match.id}, ${match.player2.id})">
                        ${match.player2.name} Wins
                    </button>
                </div>
            `;
        } else if (this.isAdminLoggedIn && match.hasRecordedResult) {
            actionsContainer.innerHTML = `
                <div style="text-align: center;">
                    <button class="btn btn-warning" onclick="app.reverseGroupMatchResultFromDetail(${match.id})">
                        🔄 Reverse Result
                    </button>
                    <p style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">
                        This will undo the recorded result and allow the match to be played again.
                    </p>
                </div>
            `;
        } else if (!this.isAdminLoggedIn && !match.completed) {
            actionsContainer.innerHTML = `
                <div style="text-align: center; color: #666;">
                    <p>🔒 Admin access required to manage match</p>
                </div>
            `;
        } else {
            actionsContainer.innerHTML = '';
        }
    }

    async recordGroupMatchResultFromDetail(matchId, winnerId) {
        try {
            const result = await this.tournamentManager.recordGroupMatchResult(matchId, winnerId, this.adminPassword);
            this.groups = result.groupsData;
            this.participants = await this.tournamentManager.getParticipants();
            this.renderGroups();
            document.getElementById('match-detail-modal').style.display = 'none';
        } catch (error) {
            console.error('Error recording group match result:', error);
            alert(error.message || 'Error recording match result');
        }
    }

    async reverseGroupMatchResultFromDetail(matchId) {
        const match = this.groups.matches.find(m => m.id === matchId);
        const winnerName = match.winner?.name || 'Unknown';
        
        if (!confirm(`Are you sure you want to reverse the result of this match?\n\nThis will undo ${winnerName}'s win and reset the match to unplayed status.`)) {
            return;
        }

        try {
            const result = await this.tournamentManager.reverseGroupMatchResult(matchId, this.adminPassword);
            this.groups = result.groupsData;
            this.participants = await this.tournamentManager.getParticipants();
            this.renderGroups();
            
            // Update the modal to show the new match state
            const updatedMatch = this.groups.matches.find(m => m.id === matchId);
            this.renderGroupMatchDetail(updatedMatch);
            
        } catch (error) {
            console.error('Error reversing group match result:', error);
            alert(error.message || 'Error reversing match result');
        }
    }

    async scheduleGroupMatchFromDetail(matchId) {
        const date = document.getElementById(`group-match-date-${matchId}`).value;
        const time = document.getElementById(`group-match-time-${matchId}`).value;

        if (!date && !time) {
            alert('Please select a date and/or time for the match');
            return;
        }

        try {
            await this.tournamentManager.scheduleMatch(matchId, date, time, this.adminPassword);
            
            // Refresh groups display
            this.groups = await this.tournamentManager.getGroups();
            this.renderGroups();
            
            // Update the modal
            const match = this.groups.matches.find(m => m.id === matchId);
            if (match) {
                this.renderGroupMatchDetail(match);
            }
            
            alert('Group match scheduled successfully!');
        } catch (error) {
            console.error('Error scheduling group match:', error);
            alert(error.message || 'Error scheduling match');
        }
    }
    
    renderResults() {
        const container = document.getElementById('results-container');
        
        // If results container doesn't exist, skip rendering
        if (!container) {
            return;
        }
        
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
            if (this.tournamentManager.checkAdminPassword(password)) {
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
            alert('Error during login');
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
            const result = await this.tournamentManager.removeParticipant(participantId, this.adminPassword);
            alert(result.message);
            this.participants = await this.tournamentManager.getParticipants();
            this.renderAdminParticipants();
        } catch (error) {
            console.error('Error removing participant:', error);
            alert(error.message || 'Error removing participant');
        }
    }
    
    async resetTournament() {
        if (!confirm('Are you sure you want to reset all tournament results? This will clear the bracket, groups, and all match results, but keep participants.')) {
            return;
        }
        
        try {
            const result = await this.tournamentManager.resetTournament(this.adminPassword);
            alert(result.message);
            this.participants = await this.tournamentManager.getParticipants();
            this.bracket = await this.tournamentManager.getBrackets();
            this.results = await this.tournamentManager.getResults();
            this.groups = { stage: 'not-started', groups: [], matches: [] };
            this.renderParticipants();
            this.renderBracket();
            this.renderGroups();
            this.renderAdminParticipants();
        } catch (error) {
            console.error('Error resetting tournament:', error);
            alert(error.message || 'Error resetting tournament');
        }
    }
    
    async resetAll() {
        if (!confirm('Are you sure you want to reset EVERYTHING? This will remove all participants, results, and uploaded images. This action cannot be undone!')) {
            return;
        }
        
        try {
            const result = await this.tournamentManager.resetAll(this.adminPassword);
            alert(result.message);
            this.participants = await this.tournamentManager.getParticipants();
            this.bracket = await this.tournamentManager.getBrackets();
            this.results = await this.tournamentManager.getResults();
            this.renderParticipants();
            this.renderBracket();
            this.renderResults();
            this.renderAdminParticipants();
        } catch (error) {
            console.error('Error resetting all data:', error);
            alert(error.message || 'Error resetting all data');
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
        const isBye = !match.player2 && match.player1 && match.completed; // Only true bye if actually completed
        const isTBD = !match.player1 && !match.player2;
        const hasOnePlayer = (match.player1 && !match.player2 && !match.completed) || (!match.player1 && match.player2 && !match.completed);
        
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
        } else if (isTBD) {
            statusContainer.innerHTML = `
                <div class="pending">
                    <strong>⏳ Match not ready - awaiting players from previous rounds</strong>
                </div>
            `;
        } else if (hasOnePlayer) {
            const assignedPlayer = match.player1 || match.player2;
            statusContainer.innerHTML = `
                <div class="pending">
                    <strong>⚠️ ${assignedPlayer.name} assigned - waiting for opponent</strong>
                </div>
            `;
        } else {
            let scheduleInfo = '';
            if (match.scheduledDate || match.scheduledTime) {
                let dateTimeText = '';
                if (match.scheduledDate) {
                    const date = new Date(match.scheduledDate);
                    dateTimeText = date.toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric' 
                    });
                }
                if (match.scheduledTime) {
                    if (dateTimeText) dateTimeText += ' at ';
                    dateTimeText += match.scheduledTime;
                }
                scheduleInfo = `<div style="margin-top: 0.5rem; color: #666;">📅 Scheduled: ${dateTimeText}</div>`;
            }
            
            statusContainer.innerHTML = `
                <div class="pending">
                    <strong>🔄 Match ready to play</strong>
                    ${scheduleInfo}
                </div>
            `;
        }
        
        // Render actions
        const actionsContainer = document.getElementById('match-detail-actions');
        
        // Allow editing if admin and match doesn't have a recorded result
        const canEdit = this.isAdminLoggedIn && !match.hasRecordedResult;
        
        if (canEdit) {
            let actionsHTML = '';
            
            // Player assignment section
            actionsHTML += `
                <div class="match-player-assignment" style="margin-bottom: 1rem;">
                    <h4 style="margin-bottom: 0.5rem;">Edit Players</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <label style="display: block; font-size: 0.85rem; margin-bottom: 0.25rem;">Player 1:</label>
                            <select id="player1-select-${match.id}" style="width: 100%; padding: 0.25rem; font-size: 0.8rem;" onchange="app.assignPlayerFromDetail(${match.id}, 'player1', this.value)">
                                <option value="">-- Unassign --</option>
                                ${this.participants.map(p => `
                                    <option value="${p.id}" ${match.player1?.id === p.id ? 'selected' : ''}>${p.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.85rem; margin-bottom: 0.25rem;">Player 2:</label>
                            <select id="player2-select-${match.id}" style="width: 100%; padding: 0.25rem; font-size: 0.8rem;" onchange="app.assignPlayerFromDetail(${match.id}, 'player2', this.value)">
                                <option value="">-- Unassign --</option>
                                ${this.participants.map(p => `
                                    <option value="${p.id}" ${match.player2?.id === p.id ? 'selected' : ''}>${p.name}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                </div>
            `;
            
            // Scheduling section (only if both players assigned)
            if (match.player1 && match.player2) {
                actionsHTML += `
                    <div class="match-scheduling" style="margin-bottom: 1rem;">
                        <h4 style="margin-bottom: 0.5rem;">Schedule Match</h4>
                        <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                            <input type="date" id="match-date-${match.id}" value="${match.scheduledDate || ''}" style="padding: 0.25rem; font-size: 0.8rem;">
                            <input type="time" id="match-time-${match.id}" value="${match.scheduledTime || ''}" style="padding: 0.25rem; font-size: 0.8rem;">
                            <button class="btn btn-primary" style="font-size: 0.8rem; padding: 0.25rem 0.5rem;" onclick="app.scheduleMatchFromDetail(${match.id})">
                                Set Schedule
                            </button>
                        </div>
                    </div>
                `;
            }
            
            // Result recording section (only if both players assigned and not completed)
            if (match.player1 && match.player2 && !isCompleted) {
                actionsHTML += `
                    <div class="match-result-buttons">
                        <button class="btn btn-success" onclick="app.recordMatchResultFromDetail(${match.id}, ${match.player1.id})">
                            ${match.player1.name} Wins
                        </button>
                        <button class="btn btn-success" onclick="app.recordMatchResultFromDetail(${match.id}, ${match.player2.id})">
                            ${match.player2.name} Wins
                        </button>
                    </div>
                `;
            }
            
            actionsContainer.innerHTML = actionsHTML;
            
        } else if (this.isAdminLoggedIn && match.hasRecordedResult && isCompleted) {
            actionsContainer.innerHTML = `
                <div style="text-align: center;">
                    <button class="btn btn-warning" onclick="app.reverseMatchResultFromDetail(${match.id})">
                        🔄 Reverse Result
                    </button>
                    <p style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">
                        This will undo the recorded result and remove the winner from subsequent rounds.
                    </p>
                </div>
            `;
        } else if (!this.isAdminLoggedIn && !isCompleted && match.player1 && match.player2) {
            actionsContainer.innerHTML = `
                <div style="text-align: center; color: #666;">
                    <p>🔒 Admin access required to manage match</p>
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

    async reverseMatchResultFromDetail(matchId) {
        const match = this.findMatchById(matchId);
        const winnerName = match.winner?.name || 'Unknown';
        
        if (!confirm(`Are you sure you want to reverse the result of this match?\n\nThis will undo ${winnerName}'s win and remove them from all subsequent rounds. Any matches they played in later rounds will need to be reversed first.`)) {
            return;
        }

        try {
            const result = await this.tournamentManager.reverseMatchResult(matchId, this.adminPassword);
            
            // Refresh data
            this.bracket = result.bracket;
            this.participants = await this.tournamentManager.getParticipants();
            this.results = await this.tournamentManager.getResults();
            
            // Re-render everything
            this.renderBracket();
            
            // Update the modal to show the new match state
            const updatedMatch = this.findMatchById(matchId);
            this.renderMatchDetail(updatedMatch);
            
        } catch (error) {
            console.error('Error reversing match result:', error);
            alert(error.message || 'Error reversing match result');
        }
    }

    async scheduleMatchFromDetail(matchId) {
        const date = document.getElementById(`match-date-${matchId}`).value;
        const time = document.getElementById(`match-time-${matchId}`).value;

        if (!date && !time) {
            alert('Please select a date and/or time for the match');
            return;
        }

        try {
            await this.tournamentManager.scheduleMatch(matchId, date, time, this.adminPassword);
            
            // Refresh bracket display
            this.bracket = await this.tournamentManager.getBrackets();
            this.renderBracket();
            
            // Update the modal with the new schedule
            const match = this.findMatchById(matchId);
            if (match) {
                this.renderMatchDetail(match);
            }
            
            alert('Match scheduled successfully!');
        } catch (error) {
            console.error('Error scheduling match:', error);
            alert(error.message || 'Error scheduling match');
        }
    }

    async assignPlayerFromDetail(matchId, playerSlot, participantId) {
        if (!this.isAdminLoggedIn) {
            alert('Admin access required');
            return;
        }

        try {
            const numericId = participantId ? parseInt(participantId) : null;
            await this.tournamentManager.assignPlayerToMatch(matchId, playerSlot, numericId, this.adminPassword);
            
            // Refresh bracket display
            this.bracket = await this.tournamentManager.getBrackets();
            this.renderBracket();
            
            // Update the modal with the new assignments
            const match = this.findMatchById(matchId);
            if (match) {
                this.renderMatchDetail(match);
            }
        } catch (error) {
            console.error('Error assigning player:', error);
            alert(error.message || 'Error assigning player');
            
            // Reset the dropdown to previous value on error
            const match = this.findMatchById(matchId);
            if (match) {
                const select = document.getElementById(`${playerSlot}-select-${matchId}`);
                if (select) {
                    select.value = match[playerSlot]?.id || '';
                }
            }
        }
    }

    equalizeGroupHeights() {
        const groupCards = document.querySelectorAll('.group-card-with-matches');
        if (groupCards.length === 0) {
            console.log('No group cards found for height equalization');
            return;
        }

        console.log(`Equalizing heights for ${groupCards.length} group cards`);

        // Reset heights first
        groupCards.forEach(card => {
            card.style.height = 'auto';
            card.style.minHeight = 'auto';
        });

        // Force layout recalculation
        setTimeout(() => {
            // Calculate max height
            let maxHeight = 0;
            const heights = [];
            
            groupCards.forEach((card, index) => {
                const height = card.offsetHeight;
                heights.push(height);
                if (height > maxHeight) {
                    maxHeight = height;
                }
            });

            console.log('Group card heights:', heights, 'Max height:', maxHeight);

            // Set all cards to max height
            groupCards.forEach(card => {
                card.style.height = maxHeight + 'px';
                card.style.minHeight = maxHeight + 'px';
            });
            
            console.log('Heights equalized to:', maxHeight + 'px');
        }, 10);
    }

    // Rules Management
    async loadRules() {
        try {
            const rules = await this.tournamentManager.getRules();
            if (rules.rulesUrl) {
                // Redirect to external rules URL
                window.open(rules.rulesUrl, '_blank');
                document.getElementById('rules-container').innerHTML = `
                    <div class="rules-redirect">
                        <h3>Rules Page</h3>
                        <p>Rules have been opened in a new tab.</p>
                        <a href="${rules.rulesUrl}" target="_blank" class="btn btn-primary">Open Rules Again</a>
                        <br><br>
                        <small>To change the rules URL, edit the "rulesUrl" field in rules.json</small>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('rules-container').innerHTML = `
                <div class="error">
                    <h3>Rules Configuration Error</h3>
                    <p>Please set "rulesUrl" in rules.json</p>
                </div>
            `;
        }
    }



    showRulesEditor() {
        document.getElementById('rules-editor').style.display = 'block';
        this.loadRulesForEditing();
    }

    hideRulesEditor() {
        document.getElementById('rules-editor').style.display = 'none';
        document.getElementById('rules-form').reset();
    }

    async loadRulesForEditing() {
        try {
            const rules = await this.tournamentManager.getRules();
            
            document.getElementById('rules-title').value = rules.title;
            
            const sectionsContainer = document.getElementById('rules-sections');
            sectionsContainer.innerHTML = '';
            
            rules.sections.forEach((section, index) => {
                this.addRuleSection(section, index);
            });
        } catch (error) {
            console.error('Error loading rules for editing:', error);
            alert('Failed to load rules for editing');
        }
    }

    addRuleSection(sectionData = null, index = null) {
        const sectionsContainer = document.getElementById('rules-sections');
        const sectionIndex = index !== null ? index : sectionsContainer.children.length;
        
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'rule-section-editor';
        
        sectionDiv.innerHTML = `
            <div class="form-group">
                <label>Section Title:</label>
                <input type="text" class="section-title" value="${sectionData?.title || ''}" placeholder="Section title" required>
            </div>
            <div class="form-group">
                <label>Rules:</label>
                <textarea class="section-content" rows="4" placeholder="Enter rules (one per line)" required>${sectionData?.content?.join('\n') || ''}</textarea>
            </div>
            <button type="button" class="btn btn-danger remove-section-btn">Remove Section</button>
            <hr>
        `;
        
        sectionsContainer.appendChild(sectionDiv);
        
        // Add remove functionality
        sectionDiv.querySelector('.remove-section-btn').addEventListener('click', () => {
            sectionDiv.remove();
        });
    }

    async saveRules() {
        try {
            const title = document.getElementById('rules-title').value.trim();
            const password = document.getElementById('rules-admin-password').value;
            
            if (!title) {
                alert('Please enter a rules title');
                return;
            }
            
            const sections = [];
            const sectionEditors = document.querySelectorAll('.rule-section-editor');
            
            sectionEditors.forEach(editor => {
                const sectionTitle = editor.querySelector('.section-title').value.trim();
                const sectionContent = editor.querySelector('.section-content').value.trim();
                
                if (sectionTitle && sectionContent) {
                    sections.push({
                        title: sectionTitle,
                        content: sectionContent.split('\n').map(line => line.trim()).filter(line => line)
                    });
                }
            });
            
            if (sections.length === 0) {
                alert('Please add at least one rule section');
                return;
            }
            
            const result = await this.tournamentManager.updateRules(title, sections, password);
            
            if (result.success) {
                alert('Rules updated successfully!');
                this.hideRulesEditor();
                this.loadRules(); // Reload to show updated rules
            } else {
                alert('Failed to update rules');
            }
        } catch (error) {
            console.error('Error saving rules:', error);
            alert('Error saving rules');
        }
    }

    showManualTiebreakerModal(groupsNeedingTiebreak) {
        const modal = document.getElementById('manual-tiebreaker-modal');
        const container = document.getElementById('tiebreaker-groups-container');
        
        let html = '';
        groupsNeedingTiebreak.forEach(group => {
            const standings = this.tournamentManager.getGroupStandings({ groups: [group], matches: this.groups.matches })[0];
            const tiedPlayers = standings.standings.filter(player => {
                const topPlayer = standings.standings[0];
                return player.groupWins === topPlayer.groupWins && player.groupLosses === topPlayer.groupLosses;
            });

            html += `
                <div class="tiebreaker-group" data-group-id="${group.id}">
                    <h4>${group.name} - Select Winner</h4>
                    <div class="tiebreaker-explanation">
                        <p><strong>Tied Players:</strong> ${tiedPlayers.map(p => p.name).join(', ')}</p>
                        <p>All players have ${tiedPlayers[0].groupWins} wins and ${tiedPlayers[0].groupLosses} losses.</p>
                        <p>Please select which player should advance from this group:</p>
                    </div>
                    <div class="tiebreaker-players">
                        ${tiedPlayers.map(player => `
                            <label class="tiebreaker-option">
                                <input type="radio" name="group-${group.id}-winner" value="${player.id}" required>
                                <span class="player-info">
                                    ${player.image ? 
                                        `<img src="${player.image}" alt="${player.name}" class="player-avatar">` : 
                                        `<div class="player-avatar-placeholder">📷</div>`
                                    }
                                    <span class="player-name">${player.name}</span>
                                    <span class="player-record">(${player.groupWins}W-${player.groupLosses}L)</span>
                                </span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        modal.style.display = 'block';
    }

    async completeManualTiebreakers() {
        const modal = document.getElementById('manual-tiebreaker-modal');
        const tiebreakerGroups = document.querySelectorAll('.tiebreaker-group');
        
        try {
            // Check that all groups have a winner selected
            for (let groupDiv of tiebreakerGroups) {
                const groupId = parseInt(groupDiv.dataset.groupId);
                const selectedWinner = groupDiv.querySelector(`input[name="group-${groupId}-winner"]:checked`);
                
                if (!selectedWinner) {
                    alert(`Please select a winner for all groups before continuing.`);
                    return;
                }
            }
            
            // Submit all manual winner selections
            for (let groupDiv of tiebreakerGroups) {
                const groupId = parseInt(groupDiv.dataset.groupId);
                const selectedWinner = groupDiv.querySelector(`input[name="group-${groupId}-winner"]:checked`);
                const winnerId = parseInt(selectedWinner.value);
                
                await this.tournamentManager.selectManualGroupWinner(groupId, winnerId, this.adminPassword);
            }
            
            // Try to advance to next round again
            const result = await this.tournamentManager.advanceToNextRound(this.adminPassword);
            this.groups = result.groupsData;
            this.renderGroups();
            
            modal.style.display = 'none';
            alert(result.message);
            
        } catch (error) {
            console.error('Error completing manual tiebreakers:', error);
            alert(error.message || 'Error completing tiebreakers');
        }
    }

    // Helper function to get current participant image (for updated images)
    getCurrentPlayerImage(player) {
        if (!player) return null;
        const currentParticipant = this.participants.find(p => p.id === player.id);
        return currentParticipant ? currentParticipant.image : player.image;
    }

    async showInsertParticipantModal() {
        const modal = document.getElementById('insert-participant-modal');
        const participantSelect = document.getElementById('participant-select');
        const groupSelect = document.getElementById('group-select');
        
        try {
            // Get participants not in any group
            const participantsInGroups = this.groups.groups.flatMap(g => g.players.map(p => p.id));
            const availableParticipants = this.participants.filter(p => !participantsInGroups.includes(p.id));
            
            // Get groups with available bye matches
            const availableGroups = await this.tournamentManager.getAvailableGroupsForInsertion();
            
            if (availableParticipants.length === 0) {
                alert('No participants available for insertion. All participants are already in groups.');
                return;
            }
            
            if (availableGroups.length === 0) {
                alert('No groups have available bye matches for participant insertion.');
                return;
            }
            
            // Populate participants dropdown
            participantSelect.innerHTML = '<option value="">Choose a participant...</option>';
            availableParticipants.forEach(participant => {
                participantSelect.innerHTML += `<option value="${participant.id}">${participant.name}</option>`;
            });
            
            // Populate groups dropdown
            groupSelect.innerHTML = '<option value="">Choose a group...</option>';
            availableGroups.forEach(group => {
                groupSelect.innerHTML += `<option value="${group.id}">${group.name} (${group.availableByeMatches} bye matches, next in Round ${group.nextByeRound})</option>`;
            });
            
            // Reset form
            document.getElementById('insertion-preview').style.display = 'none';
            document.getElementById('confirm-insert-participant').disabled = true;
            
            modal.style.display = 'block';
        } catch (error) {
            console.error('Error showing insert participant modal:', error);
            alert(error.message || 'Error loading insertion options');
        }
    }

    async updateInsertionPreview() {
        const participantId = parseInt(document.getElementById('participant-select').value);
        const groupId = parseInt(document.getElementById('group-select').value);
        const previewContainer = document.getElementById('insertion-preview');
        const confirmBtn = document.getElementById('confirm-insert-participant');
        
        if (!participantId || !groupId) {
            previewContainer.style.display = 'none';
            confirmBtn.disabled = true;
            return;
        }
        
        try {
            // Find participant and group
            const participant = this.participants.find(p => p.id === participantId);
            const availableGroups = await this.tournamentManager.getAvailableGroupsForInsertion();
            const group = availableGroups.find(g => g.id === groupId);
            
            if (!participant || !group) {
                previewContainer.style.display = 'none';
                confirmBtn.disabled = true;
                return;
            }
            
            // Find the next bye match in this group
            const byeMatches = this.groups.matches.filter(m => 
                m.groupId === groupId && 
                m.isBye && 
                m.round >= this.groups.currentRound &&
                !m.hasRecordedResult
            ).sort((a, b) => a.round - b.round);
            
            const nextByeMatch = byeMatches[0];
            
            previewContainer.innerHTML = `
                <h4>Preview</h4>
                <div class="preview-info">
                    <p><strong>Participant:</strong> ${participant.name}</p>
                    <p><strong>Group:</strong> ${group.name}</p>
                    <p><strong>Will play against:</strong> ${nextByeMatch.player1.name}</p>
                    <p><strong>In Round:</strong> ${nextByeMatch.round}</p>
                    <p class="preview-note">This will convert a bye match into a regular match.</p>
                </div>
            `;
            
            previewContainer.style.display = 'block';
            confirmBtn.disabled = false;
            
        } catch (error) {
            console.error('Error updating insertion preview:', error);
            previewContainer.innerHTML = '<p class="error">Error loading preview</p>';
            previewContainer.style.display = 'block';
            confirmBtn.disabled = true;
        }
    }

    async insertParticipant() {
        const participantId = parseInt(document.getElementById('participant-select').value);
        const groupId = parseInt(document.getElementById('group-select').value);
        
        if (!participantId || !groupId) {
            alert('Please select both a participant and a group');
            return;
        }
        
        const password = prompt('Enter admin password to insert participant:');
        if (!password) return;
        
        try {
            const result = await this.tournamentManager.insertParticipantIntoGroup(participantId, groupId, password);
            alert(result.message);
            
            // Close modal
            document.getElementById('insert-participant-modal').style.display = 'none';
            
            // Refresh groups display
            this.renderGroups();
            
        } catch (error) {
            console.error('Error inserting participant:', error);
            alert(error.message || 'Error inserting participant into group');
        }
    }


}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PoolTournamentApp();
});