// Client-side only version for GitHub Pages
// This replaces the server functionality with localStorage

class TournamentManager {
    constructor() {
        this.ADMIN_PASSWORD = 'admin123';
        this.initializeStorage();
    }

    initializeStorage() {
        if (!localStorage.getItem('participants')) {
            localStorage.setItem('participants', JSON.stringify([]));
        }
        if (!localStorage.getItem('brackets')) {
            localStorage.setItem('brackets', JSON.stringify({ rounds: [] }));
        }
        if (!localStorage.getItem('results')) {
            localStorage.setItem('results', JSON.stringify([]));
        }
    }

    // Storage helpers
    getParticipants() {
        return JSON.parse(localStorage.getItem('participants') || '[]');
    }

    setParticipants(participants) {
        localStorage.setItem('participants', JSON.stringify(participants));
    }

    getBrackets() {
        return JSON.parse(localStorage.getItem('brackets') || '{"rounds":[]}');
    }

    setBrackets(brackets) {
        localStorage.setItem('brackets', JSON.stringify(brackets));
    }

    getResults() {
        return JSON.parse(localStorage.getItem('results') || '[]');
    }

    setResults(results) {
        localStorage.setItem('results', JSON.stringify(results));
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

        const participants = this.getParticipants();
        const newParticipant = {
            id: Date.now(),
            name: name,
            image: null,
            wins: 0,
            losses: 0
        };

        participants.push(newParticipant);
        this.setParticipants(participants);
        return newParticipant;
    }

    async uploadParticipantImage(participantId, file) {
        return new Promise((resolve, reject) => {
            const participants = this.getParticipants();
            const participant = participants.find(p => p.id === participantId);
            
            if (!participant) {
                reject(new Error('Participant not found'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                participant.image = e.target.result; // Store as base64
                this.setParticipants(participants);
                resolve(participant);
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    async generateBracket(password) {
        if (!this.checkAdminPassword(password)) {
            throw new Error('Invalid admin password');
        }

        const participants = this.getParticipants();
        
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
                    completed: false
                });
            } else {
                // Bye for odd number of participants
                firstRoundMatches.push({
                    id: Date.now() + i,
                    player1: shuffled[i],
                    player2: null,
                    winner: shuffled[i],
                    completed: true
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
                        completed: false
                    });
                } else if (winnersCount % 2 === 1) {
                    nextRoundMatches.push({
                        id: Date.now() + round * 1000 + i,
                        player1: null,
                        player2: null,
                        winner: null,
                        completed: false
                    });
                }
            }
            
            if (nextRoundMatches.length > 0) {
                bracket.rounds.push({ round: round, matches: nextRoundMatches });
                currentMatches = nextRoundMatches;
            }
        }
        
        this.setBrackets(bracket);
        return bracket;
    }

    async recordMatchResult(matchId, winnerId, password) {
        if (!this.checkAdminPassword(password)) {
            throw new Error('Invalid admin password');
        }

        const bracket = this.getBrackets();
        const participants = this.getParticipants();
        const results = this.getResults();
        
        // Find and update the match
        let matchFound = false;
        let completedMatch = null;
        for (let round of bracket.rounds) {
            const match = round.matches.find(m => m.id === matchId);
            if (match) {
                match.winner = match.player1?.id === winnerId ? match.player1 : match.player2;
                match.completed = true;
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
        
        this.setBrackets(bracket);
        this.setParticipants(participants);
        this.setResults(results);
        
        return { success: true, bracket };
    }

    async resetAll(password) {
        if (!this.checkAdminPassword(password)) {
            throw new Error('Invalid admin password');
        }

        localStorage.setItem('participants', JSON.stringify([]));
        localStorage.setItem('brackets', JSON.stringify({ rounds: [] }));
        localStorage.setItem('results', JSON.stringify([]));
        
        return { success: true, message: 'All tournament data reset successfully' };
    }

    async resetTournament(password) {
        if (!this.checkAdminPassword(password)) {
            throw new Error('Invalid admin password');
        }

        const participants = this.getParticipants();
        participants.forEach(p => {
            p.wins = 0;
            p.losses = 0;
        });
        
        this.setParticipants(participants);
        this.setBrackets({ rounds: [] });
        this.setResults([]);
        
        return { success: true, message: 'Tournament results reset successfully' };
    }

    async removeParticipant(participantId, password) {
        if (!this.checkAdminPassword(password)) {
            throw new Error('Invalid admin password');
        }

        const participants = this.getParticipants();
        const participantIndex = participants.findIndex(p => p.id === participantId);
        
        if (participantIndex === -1) {
            throw new Error('Participant not found');
        }
        
        const participant = participants[participantIndex];
        participants.splice(participantIndex, 1);
        this.setParticipants(participants);
        
        return { success: true, message: `Participant ${participant.name} removed successfully` };
    }
}

// Create global instance
window.tournamentManager = new TournamentManager();