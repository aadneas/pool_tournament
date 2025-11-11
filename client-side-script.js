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
                    results: [],
                    groups: {
                        stage: 'not-started', // not-started, in-progress, completed
                        currentRound: 0,
                        groups: [],
                        matches: []
                    },
                    rules: {
                        title: "Pool Tournament Rules",
                        sections: [
                            {
                                title: "Tournament Format",
                                content: [
                                    "The tournament consists of two stages: Group Stage and Knockout Stage",
                                    "Group Stage uses Swiss format with multiple rounds",
                                    "Top 2 players from each group advance to knockout stage",
                                    "Knockout stage is single elimination"
                                ]
                            },
                            {
                                title: "Group Stage Rules",
                                content: [
                                    "Players are divided into groups of 5-6 players each",
                                    "Swiss pairing system ensures fair matchups",
                                    "Each round, players face opponents with similar records",
                                    "Tie-breakers: Head-to-head record, then opponent strength"
                                ]
                            },
                            {
                                title: "Match Rules",
                                content: [
                                    "All matches are single games (race to 1)",
                                    "Standard 8-ball pool rules apply",
                                    "Players must call their shots clearly",
                                    "No coaching allowed during matches",
                                    "Time limit: 30 minutes per match"
                                ]
                            },
                            {
                                title: "Player Conduct",
                                content: [
                                    "Respect all opponents and tournament officials",
                                    "No unsportsmanlike behavior tolerated",
                                    "Arrive on time for scheduled matches",
                                    "Follow all safety protocols in the venue"
                                ]
                            },
                            {
                                title: "Equipment",
                                content: [
                                    "Standard pool tables with regulation size",
                                    "Players may use their own cues",
                                    "Tournament provides all balls and racks",
                                    "No modifications to equipment allowed"
                                ]
                            }
                        ]
                    }
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
                
                // Update groups
                if (JSON.stringify(window.app.groups) !== JSON.stringify(data.groups)) {
                    window.app.groups = data.groups || { stage: 'not-started', groups: [], matches: [] };
                    if (window.app.currentSection === 'groups') {
                        window.app.renderGroups();
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

    async getGroups() {
        try {
            const snapshot = await this.database.ref('tournament/groups').once('value');
            return snapshot.val() || {
                stage: 'not-started',
                currentRound: 0,
                groups: [],
                matches: []
            };
        } catch (error) {
            console.error('Error getting groups:', error);
            return {
                stage: 'not-started',
                currentRound: 0,
                groups: [],
                matches: []
            };
        }
    }

    async setGroups(groupsData) {
        try {
            await this.database.ref('tournament/groups').set(groupsData);
        } catch (error) {
            console.error('Error setting groups:', error);
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

        const groupsData = await this.getGroups();
        let qualifiedPlayers = [];

        // Check if group stage is completed
        if (groupsData.stage === 'completed') {
            // Get top 2 from each group
            const standings = this.getGroupStandings(groupsData);
            qualifiedPlayers = standings.flatMap(group => 
                group.standings.slice(0, 2) // Top 2 from each group
            );

            if (qualifiedPlayers.length !== 8) {
                throw new Error(`Expected 8 qualified players, got ${qualifiedPlayers.length}. Complete group stage first.`);
            }

            // Get top 1 player from each of the 8 groups
            const groupA = standings.find(g => g.name === 'Group A').standings.slice(0, 1);
            const groupB = standings.find(g => g.name === 'Group B').standings.slice(0, 1);
            const groupC = standings.find(g => g.name === 'Group C').standings.slice(0, 1);
            const groupD = standings.find(g => g.name === 'Group D').standings.slice(0, 1);
            const groupE = standings.find(g => g.name === 'Group E').standings.slice(0, 1);
            const groupF = standings.find(g => g.name === 'Group F').standings.slice(0, 1);
            const groupG = standings.find(g => g.name === 'Group G').standings.slice(0, 1);
            const groupH = standings.find(g => g.name === 'Group H').standings.slice(0, 1);

            // 8 players from group winners go directly to quarterfinals
            qualifiedPlayers = [
                ...groupA, ...groupB, ...groupC, ...groupD,
                ...groupE, ...groupF, ...groupG, ...groupH
            ];
        } else {
            // Fallback to regular participants if no group stage
            const participants = await this.getParticipants();
            
            if (participants.length < 8) {
                throw new Error('Need at least 8 participants for knockout stage');
            }
            
            // Take top 8 by wins, or shuffle if no group stage
            qualifiedPlayers = participants
                .sort((a, b) => (b.wins || 0) - (a.wins || 0))
                .slice(0, 8);
        }
        
        // For knockout stage, we always have exactly 8 players (quarterfinals)
        const bracket = { rounds: [] };
        
        // Create quarterfinal matches (8 players -> 4 matches)
        const quarterfinalMatches = [];
        for (let i = 0; i < qualifiedPlayers.length; i += 2) {
            quarterfinalMatches.push({
                id: Date.now() + i,
                player1: qualifiedPlayers[i],
                player2: qualifiedPlayers[i + 1],
                winner: null,
                completed: false,
                scheduledDate: null,
                scheduledTime: null,
                hasRecordedResult: false,
                isBye: false,
                roundName: 'Quarterfinal'
            });
        }
        
        bracket.rounds.push({ round: 1, matches: quarterfinalMatches, name: 'Quarterfinals' });
        
        // Create semifinals (4 players -> 2 matches) and final (2 players -> 1 match)
        let currentMatches = quarterfinalMatches;
        const roundNames = ['Semifinals', 'Final'];
        
        for (let round = 2; round <= 3; round++) { // Only need 2 more rounds after quarterfinals
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
                        isBye: false,
                        roundName: roundNames[round - 2]
                    });
                }
            }
            
            if (nextRoundMatches.length > 0) {
                bracket.rounds.push({ round: round, matches: nextRoundMatches, name: roundNames[round - 2] });
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

    async reverseMatchResult(matchId, password) {
        if (!this.checkAdminPassword(password)) {
            throw new Error('Invalid admin password');
        }

        const bracket = await this.getBrackets();
        const participants = await this.getParticipants();
        const results = await this.getResults();
        
        // Find the match to reverse
        let matchFound = false;
        let reversedMatch = null;
        let currentRoundIndex = -1;
        
        for (let i = 0; i < bracket.rounds.length; i++) {
            const match = bracket.rounds[i].matches.find(m => m.id === matchId);
            if (match) {
                if (!match.hasRecordedResult || !match.completed) {
                    throw new Error('Match has no recorded result to reverse');
                }
                
                // Store match info before clearing
                const winnerId = match.winner?.id;
                const loserId = match.player1?.id === winnerId ? match.player2?.id : match.player1?.id;
                
                reversedMatch = { ...match, winnerId, loserId };
                currentRoundIndex = i;
                
                // Clear the match result
                match.winner = null;
                match.completed = false;
                match.hasRecordedResult = false;
                
                matchFound = true;
                break;
            }
        }
        
        if (!matchFound) {
            throw new Error('Match not found');
        }
        
        // Remove winner from subsequent rounds
        for (let i = currentRoundIndex + 1; i < bracket.rounds.length; i++) {
            const round = bracket.rounds[i];
            for (let match of round.matches) {
                if (match.player1?.id === reversedMatch.winnerId) {
                    match.player1 = null;
                    // If this match was already played, we need to reverse it too
                    if (match.hasRecordedResult) {
                        throw new Error('Cannot reverse this match because the winner has already played in subsequent rounds. Please reverse those matches first.');
                    }
                }
                if (match.player2?.id === reversedMatch.winnerId) {
                    match.player2 = null;
                    // If this match was already played, we need to reverse it too
                    if (match.hasRecordedResult) {
                        throw new Error('Cannot reverse this match because the winner has already played in subsequent rounds. Please reverse those matches first.');
                    }
                }
            }
        }
        
        // Reverse participant stats
        const winner = participants.find(p => p.id === reversedMatch.winnerId);
        const loser = participants.find(p => p.id === reversedMatch.loserId);
        
        if (winner && winner.wins > 0) {
            winner.wins--;
        }
        if (loser && loser.losses > 0) {
            loser.losses--;
        }
        
        // Remove the result record
        const resultIndex = results.findIndex(r => r.matchId === matchId);
        if (resultIndex !== -1) {
            results.splice(resultIndex, 1);
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
            p.groupWins = 0;
            p.groupLosses = 0;
        });
        
        await this.setParticipants(participants);
        await this.setBrackets({ rounds: [] });
        await this.setResults([]);
        await this.setGroups({ stage: 'not-started', groups: [], matches: [], currentRound: 1, totalRounds: 3 });
        
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

    // Swiss System Logic for Group Stage
    swissPairing(players, matches = [], currentRound = 1) {
        if (players.length < 2) return [];

        // For odd number of players, handle byes properly
        if (players.length % 2 === 1) {
            // Find player who has had the fewest matches or no bye yet
            const matchCounts = players.map(player => {
                const playerMatches = matches.filter(m => 
                    (m.player1?.id === player.id || m.player2?.id === player.id)
                );
                const hasByeRounds = matches.filter(m => 
                    (m.player1?.id === player.id && !m.player2) || 
                    (m.player2?.id === player.id && !m.player1)
                );
                return {
                    player,
                    matchCount: playerMatches.length,
                    byeCount: hasByeRounds.length,
                    wins: matches.filter(m => m.completed && m.winner?.id === player.id).length
                };
            });

            // Sort by fewest byes, then fewest matches, then fewest wins
            matchCounts.sort((a, b) => {
                if (a.byeCount !== b.byeCount) return a.byeCount - b.byeCount;
                if (a.matchCount !== b.matchCount) return a.matchCount - b.matchCount;
                return a.wins - b.wins;
            });

            // Give bye to player who needs it most
            const byePlayer = matchCounts[0].player;
            const remainingPlayers = players.filter(p => p.id !== byePlayer.id);
            
            // Create bye match
            const pairs = [[byePlayer, null]];
            
            // Pair remaining players
            const remainingPairs = this.swissPairing(remainingPlayers, matches, currentRound);
            return [...pairs, ...remainingPairs];
        }

        // Sort players by wins, then by total matches played (ascending for balance)
        const sortedPlayers = [...players].sort((a, b) => {
            const aWins = matches.filter(m => m.completed && m.winner?.id === a.id).length;
            const bWins = matches.filter(m => m.completed && m.winner?.id === b.id).length;
            const aMatches = matches.filter(m => 
                (m.player1?.id === a.id || m.player2?.id === a.id)
            ).length;
            const bMatches = matches.filter(m => 
                (m.player1?.id === b.id || m.player2?.id === b.id)
            ).length;
            
            // Primary: sort by wins (descending)
            if (bWins !== aWins) return bWins - aWins;
            // Secondary: sort by matches played (ascending - give fewer-played players priority)
            return aMatches - bMatches;
        });

        const pairs = [];
        const used = new Set();

        for (let i = 0; i < sortedPlayers.length; i++) {
            if (used.has(sortedPlayers[i].id)) continue;

            const player1 = sortedPlayers[i];
            used.add(player1.id);

            // Find best available opponent
            let bestOpponent = null;
            for (let j = i + 1; j < sortedPlayers.length; j++) {
                if (used.has(sortedPlayers[j].id)) continue;

                const player2 = sortedPlayers[j];
                
                // Check if they've already played
                const alreadyPlayed = matches.some(match => 
                    (match.player1?.id === player1.id && match.player2?.id === player2.id) ||
                    (match.player1?.id === player2.id && match.player2?.id === player1.id)
                );

                if (!alreadyPlayed) {
                    bestOpponent = player2;
                    break;
                }
            }

            // If no fresh opponent, pair with next available (avoid if possible but ensure everyone plays)
            if (!bestOpponent) {
                for (let j = i + 1; j < sortedPlayers.length; j++) {
                    if (!used.has(sortedPlayers[j].id)) {
                        bestOpponent = sortedPlayers[j];
                        break;
                    }
                }
            }

            if (bestOpponent) {
                pairs.push([player1, bestOpponent]);
                used.add(bestOpponent.id);
            }
        }

        return pairs;
    }

    async generateGroups(password) {
        if (!this.checkAdminPassword(password)) {
            throw new Error('Invalid admin password');
        }

        const participants = await this.getParticipants();
        
        if (participants.length < 8) {
            throw new Error('Need at least 8 participants for group stage (2 per group minimum)');
        }

        // Shuffle participants for random group distribution
        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        
        // Create 8 groups
        const groups = [
            { id: 1, name: 'Group A', players: [] },
            { id: 2, name: 'Group B', players: [] },
            { id: 3, name: 'Group C', players: [] },
            { id: 4, name: 'Group D', players: [] },
            { id: 5, name: 'Group E', players: [] },
            { id: 6, name: 'Group F', players: [] },
            { id: 7, name: 'Group G', players: [] },
            { id: 8, name: 'Group H', players: [] }
        ];

        // Distribute players evenly across groups
        shuffled.forEach((player, index) => {
            groups[index % 8].players.push({
                ...player,
                groupWins: 0,
                groupLosses: 0
            });
        });

        const groupsData = {
            stage: 'in-progress',
            currentRound: 1,
            totalRounds: 3,
            groups: groups,
            matches: []
        };

        // Generate first round matches for all groups
        await this.generateSwissRound(groupsData, password);

        return groupsData;
    }

    async generateSwissRound(groupsData, password) {
        if (!this.checkAdminPassword(password)) {
            throw new Error('Invalid admin password');
        }

        const currentRound = groupsData.currentRound;
        
        for (const group of groupsData.groups) {
            if (group.players.length < 2) continue;

            const groupMatches = groupsData.matches.filter(m => 
                m.groupId === group.id && m.round < currentRound
            );

            const pairs = this.swissPairing(group.players, groupMatches, currentRound);

            for (const [player1, player2] of pairs) {
                const match = {
                    id: Date.now() + Math.random() * 1000,
                    groupId: group.id,
                    groupName: group.name,
                    round: currentRound,
                    player1: player1,
                    player2: player2 || null, // Handle byes
                    winner: player2 ? null : player1, // Player with bye automatically wins
                    completed: player2 ? false : true, // Byes are automatically completed
                    scheduledDate: null,
                    scheduledTime: null,
                    hasRecordedResult: !player2, // Byes are automatically recorded
                    isBye: !player2 // Mark bye matches
                };
                
                groupsData.matches.push(match);
            }
        }

        await this.setGroups(groupsData);
        return groupsData;
    }

    async recordGroupMatchResult(matchId, winnerId, password) {
        if (!this.checkAdminPassword(password)) {
            throw new Error('Invalid admin password');
        }

        const groupsData = await this.getGroups();
        const participants = await this.getParticipants();
        
        // Find and update the match
        const match = groupsData.matches.find(m => m.id === matchId);
        if (!match) {
            throw new Error('Match not found');
        }

        if (match.hasRecordedResult) {
            throw new Error('Match result already recorded');
        }

        match.winner = match.player1?.id === winnerId ? match.player1 : match.player2;
        match.completed = true;
        match.hasRecordedResult = true;

        // Update group standings
        const group = groupsData.groups.find(g => g.id === match.groupId);
        if (group) {
            const winnerInGroup = group.players.find(p => p.id === winnerId);
            const loserId = match.player1?.id === winnerId ? match.player2?.id : match.player1?.id;
            const loserInGroup = group.players.find(p => p.id === loserId);

            if (winnerInGroup) {
                winnerInGroup.groupWins++;
            }
            if (loserInGroup) {
                loserInGroup.groupLosses++;
            }
        }

        // Update main participant stats
        const winner = participants.find(p => p.id === winnerId);
        const loser = participants.find(p => p.id === (match.player1?.id === winnerId ? match.player2?.id : match.player1?.id));
        
        if (winner) winner.wins++;
        if (loser) loser.losses++;

        await this.setGroups(groupsData);
        await this.setParticipants(participants);

        return { success: true, groupsData };
    }

    async reverseGroupMatchResult(matchId, password) {
        if (!this.checkAdminPassword(password)) {
            throw new Error('Invalid admin password');
        }

        const groupsData = await this.getGroups();
        const participants = await this.getParticipants();
        
        // Find the match
        const match = groupsData.matches.find(m => m.id === matchId);
        if (!match) {
            throw new Error('Match not found');
        }

        if (!match.hasRecordedResult || !match.completed) {
            throw new Error('Match has no recorded result to reverse');
        }

        // Get the winner and loser before clearing
        const winnerId = match.winner?.id;
        const loserId = match.player1?.id === winnerId ? match.player2?.id : match.player1?.id;

        // Reverse group standings
        const group = groupsData.groups.find(g => g.id === match.groupId);
        if (group) {
            const winnerInGroup = group.players.find(p => p.id === winnerId);
            const loserInGroup = group.players.find(p => p.id === loserId);

            if (winnerInGroup && winnerInGroup.groupWins > 0) {
                winnerInGroup.groupWins--;
            }
            if (loserInGroup && loserInGroup.groupLosses > 0) {
                loserInGroup.groupLosses--;
            }
        }

        // Reverse main participant stats
        const winner = participants.find(p => p.id === winnerId);
        const loser = participants.find(p => p.id === loserId);
        
        if (winner && winner.wins > 0) {
            winner.wins--;
        }
        if (loser && loser.losses > 0) {
            loser.losses--;
        }

        // Clear the match result
        match.winner = null;
        match.completed = false;
        match.hasRecordedResult = false;

        await this.setGroups(groupsData);
        await this.setParticipants(participants);
        
        return { success: true, groupsData };
    }

    async advanceToNextRound(password) {
        if (!this.checkAdminPassword(password)) {
            throw new Error('Invalid admin password');
        }

        const groupsData = await this.getGroups();
        
        // Check if all current round matches are completed
        const currentRoundMatches = groupsData.matches.filter(m => m.round === groupsData.currentRound);
        const incompleteMatches = currentRoundMatches.filter(m => !m.completed);
        
        if (incompleteMatches.length > 0) {
            throw new Error(`Cannot advance: ${incompleteMatches.length} matches still incomplete in round ${groupsData.currentRound}`);
        }

        if (groupsData.currentRound >= groupsData.totalRounds) {
            // Group stage is complete, calculate final standings
            groupsData.stage = 'completed';
            await this.setGroups(groupsData);
            return { success: true, message: 'Group stage completed!', groupsData };
        }

        // Advance to next round
        groupsData.currentRound++;
        
        await this.generateSwissRound(groupsData, password);

        return { success: true, message: `Round ${groupsData.currentRound} generated!`, groupsData };
    }

    getGroupStandings(groupsData) {
        return groupsData.groups.map(group => {
            const sortedPlayers = [...group.players]
                .sort((a, b) => this.comparePlayersWithTieBreaker(a, b, group.id, groupsData.matches))
                .map((player, index) => ({ ...player, position: index + 1 }));
            
            return {
                ...group,
                standings: sortedPlayers
            };
        });
    }

    comparePlayersWithTieBreaker(playerA, playerB, groupId, matches) {
        // Step 1: Compare by wins (primary criterion)
        if (playerB.groupWins !== playerA.groupWins) {
            return playerB.groupWins - playerA.groupWins;
        }

        // Step 2: If tied on wins, compare by losses (fewer is better)
        if (playerA.groupLosses !== playerB.groupLosses) {
            return playerA.groupLosses - playerB.groupLosses;
        }

        // Step 3: If still tied, use head-to-head record
        const headToHead = this.getHeadToHeadRecord(playerA.id, playerB.id, groupId, matches);
        if (headToHead.winner) {
            return headToHead.winner === playerA.id ? -1 : 1;
        }

        // Step 4: If no head-to-head or tied head-to-head, use win percentage against common opponents
        const winPercentageA = this.getWinPercentageAgainstCommonOpponents(playerA.id, playerB.id, groupId, matches);
        const winPercentageB = this.getWinPercentageAgainstCommonOpponents(playerB.id, playerA.id, groupId, matches);
        
        if (winPercentageB !== winPercentageA) {
            return winPercentageB - winPercentageA;
        }

        // Step 5: Final tie-breaker: alphabetical by name
        return playerA.name.localeCompare(playerB.name);
    }

    getHeadToHeadRecord(player1Id, player2Id, groupId, matches) {
        const headToHeadMatches = matches.filter(match => 
            match.groupId === groupId &&
            match.completed &&
            match.hasRecordedResult &&
            ((match.player1?.id === player1Id && match.player2?.id === player2Id) ||
             (match.player1?.id === player2Id && match.player2?.id === player1Id))
        );

        if (headToHeadMatches.length === 0) {
            return { winner: null, record: "0-0" };
        }

        let player1Wins = 0;
        let player2Wins = 0;

        headToHeadMatches.forEach(match => {
            if (match.winner?.id === player1Id) {
                player1Wins++;
            } else if (match.winner?.id === player2Id) {
                player2Wins++;
            }
        });

        return {
            winner: player1Wins > player2Wins ? player1Id : 
                   player2Wins > player1Wins ? player2Id : null,
            record: `${player1Wins}-${player2Wins}`,
            player1Wins,
            player2Wins
        };
    }

    getWinPercentageAgainstCommonOpponents(playerId, comparisonPlayerId, groupId, matches) {
        // Get all opponents that both players have faced
        const playerMatches = matches.filter(match => 
            match.groupId === groupId &&
            match.completed &&
            match.hasRecordedResult &&
            !match.isBye &&
            (match.player1?.id === playerId || match.player2?.id === playerId)
        );

        const comparisonMatches = matches.filter(match => 
            match.groupId === groupId &&
            match.completed &&
            match.hasRecordedResult &&
            !match.isBye &&
            (match.player1?.id === comparisonPlayerId || match.player2?.id === comparisonPlayerId)
        );

        // Find common opponents
        const playerOpponents = new Set();
        const comparisonOpponents = new Set();

        playerMatches.forEach(match => {
            const opponentId = match.player1?.id === playerId ? match.player2?.id : match.player1?.id;
            if (opponentId && opponentId !== comparisonPlayerId) {
                playerOpponents.add(opponentId);
            }
        });

        comparisonMatches.forEach(match => {
            const opponentId = match.player1?.id === comparisonPlayerId ? match.player2?.id : match.player1?.id;
            if (opponentId && opponentId !== playerId) {
                comparisonOpponents.add(opponentId);
            }
        });

        const commonOpponents = [...playerOpponents].filter(id => comparisonOpponents.has(id));

        if (commonOpponents.length === 0) {
            return 0; // No common opponents
        }

        // Calculate win percentage against common opponents
        let wins = 0;
        let total = 0;

        playerMatches.forEach(match => {
            const opponentId = match.player1?.id === playerId ? match.player2?.id : match.player1?.id;
            if (commonOpponents.includes(opponentId)) {
                total++;
                if (match.winner?.id === playerId) {
                    wins++;
                }
            }
        });

        return total > 0 ? wins / total : 0;
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

    // Rules Management
    async getRules() {
        try {
            // Load rules from JSON file instead of Firebase
            const response = await fetch('./rules.json');
            if (!response.ok) {
                throw new Error('Failed to load rules.json');
            }
            const rules = await response.json();
            return rules;
        } catch (error) {
            console.error('Error loading rules from JSON file:', error);
            // Return fallback rules if JSON file fails to load
            return {
                title: "Pool Tournament Rules",
                sections: [{
                    title: "Tournament Format",
                    content: ["Basic tournament rules will be displayed here.", "Edit the rules.json file to customize."]
                }]
            };
        }
    }

    async updateRules(title, sections, password) {
        if (!this.checkAdminPassword(password)) {
            throw new Error('Invalid admin password');
        }

        if (!title || !sections || !Array.isArray(sections)) {
            throw new Error('Invalid rules format');
        }

        try {
            const rules = { title, sections };
            await this.database.ref('tournament/rules').set(rules);
            return { success: true, rules };
        } catch (error) {
            console.error('Error updating rules:', error);
            throw new Error('Failed to update rules');
        }
    }
}

// Create global instance
window.tournamentManager = new TournamentManager();