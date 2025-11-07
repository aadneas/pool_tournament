// Firebase-powered Tournament Manager
class TournamentManager {
    constructor() {
        this.ADMIN_PASSWORD = 'admin123';
        this.database = window.database;
        this.initializeDatabase();
        
        // Set up real-time listeners
        this.setupListeners();
    }

    async initializeDatabase() {
        // Check if data exists, if not create initial structure
        try {
            const snapshot = await this.database.ref('tournament').once('value');
            if (!snapshot.exists()) {
                await this.database.ref('tournament').set({
                    participants: [],
                    brackets: { rounds: [] },
                    results: []
                });
                console.log('Tournament database initialized');
            }
        } catch (error) {
            console.error('Error initializing database:', error);
        }
    }

    setupListeners() {
        // Listen for real-time updates and trigger UI refresh
        this.database.ref('tournament').on('value', (snapshot) => {
            if (window.app && snapshot.exists()) {
                const data = snapshot.val();
                
                // Update participants and refresh related views
                if (JSON.stringify(window.app.participants) !== JSON.stringify(data.participants)) {
                    window.app.participants = data.participants || [];
                    if (window.app.currentSection === 'participants') {
                        window.app.renderParticipants();
                    }
                    if (window.app.currentSection === 'admin') {
                        window.app.renderAdminParticipants();
                    }
                    // Always refresh brackets when participants change (for image updates)
                    if (window.app.currentSection === 'brackets') {
                        window.app.updateBracketParticipantData();
                        window.app.renderBracket();
                    }
                }
                
                // Update brackets
                if (JSON.stringify(window.app.bracket) !== JSON.stringify(data.brackets)) {
                    window.app.bracket = data.brackets || { rounds: [] };
                    if (window.app.currentSection === 'brackets') {
                        window.app.renderBracket();
                    }
                }
                
                // Update results
                if (JSON.stringify(window.app.results) !== JSON.stringify(data.results)) {
                    window.app.results = data.results || [];
                    if (window.app.currentSection === 'results') {
                        window.app.renderResults();
                    }
                }
            }
        });
    }

    // Database helper methods
    async getParticipants() {
        try {
            const snapshot = await this.database.ref('tournament/participants').once('value');
            return snapshot.val() || [];
        } catch (error) {
            console.error('Error getting participants:', error);
            return [];
        }
    }

    async setParticipants(participants) {
        try {
            await this.database.ref('tournament/participants').set(participants);
        } catch (error) {
            console.error('Error setting participants:', error);
            throw error;
        }
    }

    async getBrackets() {
        try {
            const snapshot = await this.database.ref('tournament/brackets').once('value');
            return snapshot.val() || { rounds: [] };
        } catch (error) {
            console.error('Error getting brackets:', error);
            return { rounds: [] };
        }
    }

    async setBrackets(brackets) {
        try {
            await this.database.ref('tournament/brackets').set(brackets);
        } catch (error) {
            console.error('Error setting brackets:', error);
            throw error;
        }
    }

    async getResults() {
        try {
            const snapshot = await this.database.ref('tournament/results').once('value');
            return snapshot.val() || [];
        } catch (error) {
            console.error('Error getting results:', error);
            return [];
        }
    }

    async setResults(results) {
        try {
            await this.database.ref('tournament/results').set(results);
        } catch (error) {
            console.error('Error setting results:', error);
            throw error;
        }
    }

    // Admin authentication
    checkAdminPassword(password) {
        return password === this.ADMIN_PASSWORD;
    }

    // API simulation methods
    async addParticipant(name, password) {
        if (!this.checkAdminPassword(password)) {
            throw new Error('Invalid admin password');
        }

        const participants = await this.getParticipants();
        const newParticipant = {
            id: Date.now(),
            name: name,
            image: null,
            wins: 0,
            losses: 0
        };

        participants.push(newParticipant);
        await this.setParticipants(participants);
        return newParticipant;
    }

    async uploadParticipantImage(participantId, file) {
        return new Promise(async (resolve, reject) => {
            try {
                const participants = await this.getParticipants();
                const participant = participants.find(p => p.id === participantId);
                
                if (!participant) {
                    reject(new Error('Participant not found'));
                    return;
                }

                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        participant.image = e.target.result; // Store as base64
                        await this.setParticipants(participants);
                        resolve(participant);
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsDataURL(file);
            } catch (error) {
                reject(error);
            }
        });
    }

    async generateBracket(password) {
        if (!this.checkAdminPassword(password)) {
            throw new Error('Invalid admin password');
        }

        const participants = await this.getParticipants();
        
        if (participants.length < 2) {
            throw new Error('Need at least 2 participants');
        }
        
        // Shuffle participants for random seeding
        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        
        // Calculate how many rounds we need
        const totalRounds = Math.ceil(Math.log2(shuffled.length));
        const bracket = { rounds: [] };
        
        // Create first round matches
        const firstRoundMatches = [];
        for (let i = 0; i < shuffled.length; i += 2) {
            if (i + 1 < shuffled.length) {
                firstRoundMatches.push({
                    id: Date.now() + i,
                    player1: shuffled[i],
                    player2: shuffled[i + 1],
                    winner: null,
                    completed: false,
                    scheduledDate: null,
                    scheduledTime: null,
                    hasRecordedResult: false,
                    isBye: false
                });
            } else {
                // Bye for odd number of participants
                firstRoundMatches.push({
                    id: Date.now() + i,
                    player1: shuffled[i],
                    player2: null,
                    winner: shuffled[i],
                    completed: true,
                    scheduledDate: null,
                    scheduledTime: null,
                    hasRecordedResult: false, // This is an auto-bye, not a recorded result
                    isBye: true
                });
            }
        }
        
        bracket.rounds.push({ round: 1, matches: firstRoundMatches });
        
        // Create placeholder rounds for the rest of the tournament
        let currentMatches = firstRoundMatches;
        for (let round = 2; round <= totalRounds; round++) {
            const winnersCount = currentMatches.length;
            const nextRoundMatches = [];
            
            for (let i = 0; i < winnersCount; i += 2) {
                if (i + 1 < winnersCount) {
                    nextRoundMatches.push({
                        id: Date.now() + round * 1000 + i,
                        player1: null,
                        player2: null,
                        winner: null,
                        completed: false,
                        scheduledDate: null,
                        scheduledTime: null,
                        hasRecordedResult: false,
                        isBye: false
                    });
                } else if (winnersCount % 2 === 1) {
                    nextRoundMatches.push({
                        id: Date.now() + round * 1000 + i,
                        player1: null,
                        player2: null,
                        winner: null,
                        completed: false,
                        scheduledDate: null,
                        scheduledTime: null,
                        hasRecordedResult: false,
                        isBye: false
                    });
                }
            }
            
            if (nextRoundMatches.length > 0) {
                bracket.rounds.push({ round: round, matches: nextRoundMatches });
                currentMatches = nextRoundMatches;
            }
        }
        
        await this.setBrackets(bracket);
        return bracket;
    }

    async recordMatchResult(matchId, winnerId, password) {
        if (!this.checkAdminPassword(password)) {
            throw new Error('Invalid admin password');
        }

        const bracket = await this.getBrackets();
        const participants = await this.getParticipants();
        const results = await this.getResults();
        
        // Find and update the match
        let matchFound = false;
        let completedMatch = null;
        for (let round of bracket.rounds) {
            const match = round.matches.find(m => m.id === matchId);
            if (match) {
                match.winner = match.player1?.id === winnerId ? match.player1 : match.player2;
                match.completed = true;
                match.hasRecordedResult = true; // Mark as having a real recorded result
                matchFound = true;
                completedMatch = match;
                
                // Update participant stats
                const winner = participants.find(p => p.id === winnerId);
                const loser = participants.find(p => p.id === (match.player1?.id === winnerId ? match.player2?.id : match.player1?.id));
                
                if (winner) winner.wins++;
                if (loser) loser.losses++;
                
                // Record result
                results.push({
                    id: Date.now(),
                    matchId: matchId,
                    winner: winner,
                    loser: loser,
                    timestamp: new Date().toISOString()
                });
                
                break;
            }
        }
        
        if (!matchFound) {
            throw new Error('Match not found');
        }
        
        // Check if we need to advance winner to next round
        const currentRoundIndex = bracket.rounds.findIndex(r => r.matches.some(m => m.id === matchId));
        const currentRound = bracket.rounds[currentRoundIndex];
        const nextRound = bracket.rounds[currentRoundIndex + 1];
        
        if (nextRound && completedMatch) {
            const matchIndexInRound = currentRound.matches.findIndex(m => m.id === matchId);
            const nextRoundMatchIndex = Math.floor(matchIndexInRound / 2);
            const nextRoundMatch = nextRound.matches[nextRoundMatchIndex];
            
            if (nextRoundMatch) {
                if (matchIndexInRound % 2 === 0) {
                    nextRoundMatch.player1 = completedMatch.winner;
                } else {
                    nextRoundMatch.player2 = completedMatch.winner;
                }
            }
        }
        
        await this.setBrackets(bracket);
        await this.setParticipants(participants);
        await this.setResults(results);
        
        return { success: true, bracket };
    }

    async resetAll(password) {
        if (!this.checkAdminPassword(password)) {
            throw new Error('Invalid admin password');
        }

        await this.database.ref('tournament').set({
            participants: [],
            brackets: { rounds: [] },
            results: []
        });
        
        return { success: true, message: 'All tournament data reset successfully' };
    }

    async resetTournament(password) {
        if (!this.checkAdminPassword(password)) {
            throw new Error('Invalid admin password');
        }

        const participants = await this.getParticipants();
        participants.forEach(p => {
            p.wins = 0;
            p.losses = 0;
        });
        
        await this.setParticipants(participants);
        await this.setBrackets({ rounds: [] });
        await this.setResults([]);
        
        return { success: true, message: 'Tournament results reset successfully' };
    }

    async removeParticipant(participantId, password) {
        if (!this.checkAdminPassword(password)) {
            throw new Error('Invalid admin password');
        }

        const participants = await this.getParticipants();
        const participantIndex = participants.findIndex(p => p.id === participantId);
        
        if (participantIndex === -1) {
            throw new Error('Participant not found');
        }
        
        const participant = participants[participantIndex];
        participants.splice(participantIndex, 1);
        await this.setParticipants(participants);
        
        return { success: true, message: `Participant ${participant.name} removed successfully` };
    }

    async scheduleMatch(matchId, date, time, password) {
        if (!this.checkAdminPassword(password)) {
            throw new Error('Invalid admin password');
        }

        const bracket = await this.getBrackets();
        let matchFound = false;

        for (let round of bracket.rounds) {
            const match = round.matches.find(m => m.id === matchId);
            if (match) {
                match.scheduledDate = date;
                match.scheduledTime = time;
                matchFound = true;
                break;
            }
        }

        if (!matchFound) {
            throw new Error('Match not found');
        }

        await this.setBrackets(bracket);
        return { success: true, message: 'Match scheduled successfully' };
    }

    async assignPlayerToMatch(matchId, playerSlot, participantId, password) {
        if (!this.checkAdminPassword(password)) {
            throw new Error('Invalid admin password');
        }

        const bracket = await this.getBrackets();
        const participants = await this.getParticipants();
        let matchFound = false;

        // Find the participant to assign (null if unassigning)
        const participant = participantId ? participants.find(p => p.id === participantId) : null;

        for (let round of bracket.rounds) {
            const match = round.matches.find(m => m.id === matchId);
            if (match) {
                if (match.hasRecordedResult) {
                    throw new Error('Cannot modify matches with recorded results');
                }

                if (playerSlot === 'player1') {
                    match.player1 = participant;
                } else if (playerSlot === 'player2') {
                    match.player2 = participant;
                } else {
                    throw new Error('Invalid player slot. Use "player1" or "player2"');
                }

                // Always reset completion status when manually editing players
                // Only matches with recorded results should stay completed
                if (!match.hasRecordedResult) {
                    match.winner = null;
                    match.completed = false;
                }

                matchFound = true;
                break;
            }
        }

        if (!matchFound) {
            throw new Error('Match not found');
        }

        await this.setBrackets(bracket);
        return { success: true, message: 'Player assignment updated successfully' };
    }
}

// Create global instance
window.tournamentManager = new TournamentManager();