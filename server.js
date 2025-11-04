const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'player-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Data files
const participantsFile = './data/participants.json';
const bracketsFile = './data/brackets.json';
const resultsFile = './data/results.json';

// Initialize data files if they don't exist
const initializeDataFiles = () => {
  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
  }
  
  if (!fs.existsSync(participantsFile)) {
    fs.writeFileSync(participantsFile, JSON.stringify([]));
  }
  
  if (!fs.existsSync(bracketsFile)) {
    fs.writeFileSync(bracketsFile, JSON.stringify({ rounds: [] }));
  }
  
  if (!fs.existsSync(resultsFile)) {
    fs.writeFileSync(resultsFile, JSON.stringify([]));
  }
};

// Helper functions
const readJsonFile = (filename) => {
  try {
    const data = fs.readFileSync(filename, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return filename === participantsFile ? [] : 
           filename === bracketsFile ? { rounds: [] } : [];
  }
};

const writeJsonFile = (filename, data) => {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
};

// API Routes

// Admin password (in a real app, this would be hashed and stored securely)
const ADMIN_PASSWORD = 'admin123';

// Admin authentication middleware
const checkAdminAuth = (req, res, next) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid admin password' });
  }
  next();
};

// Get all participants
app.get('/api/participants', (req, res) => {
  const participants = readJsonFile(participantsFile);
  res.json(participants);
});

// Add new participant
app.post('/api/participants', checkAdminAuth, (req, res) => {
  const { name } = req.body;
  const participants = readJsonFile(participantsFile);
  
  const newParticipant = {
    id: Date.now(),
    name: name,
    image: null,
    wins: 0,
    losses: 0
  };
  
  participants.push(newParticipant);
  writeJsonFile(participantsFile, participants);
  
  res.json(newParticipant);
});

// Upload participant image
app.post('/api/participants/:id/image', upload.single('image'), (req, res) => {
  const participantId = parseInt(req.params.id);
  const participants = readJsonFile(participantsFile);
  
  const participant = participants.find(p => p.id === participantId);
  if (!participant) {
    return res.status(404).json({ error: 'Participant not found' });
  }
  
  // Delete old image if exists
  if (participant.image) {
    const oldImagePath = path.join('public', participant.image);
    if (fs.existsSync(oldImagePath)) {
      fs.unlinkSync(oldImagePath);
    }
  }
  
  participant.image = '/images/' + req.file.filename;
  writeJsonFile(participantsFile, participants);
  
  res.json(participant);
});

// Generate tournament bracket
app.post('/api/brackets/generate', checkAdminAuth, (req, res) => {
  const participants = readJsonFile(participantsFile);
  
  if (participants.length < 2) {
    return res.status(400).json({ error: 'Need at least 2 participants' });
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
          player1: null, // TBD - winner of previous match
          player2: null, // TBD - winner of previous match
          winner: null,
          completed: false
        });
      } else if (winnersCount % 2 === 1) {
        // Bye for odd number of winners
        nextRoundMatches.push({
          id: Date.now() + round * 1000 + i,
          player1: null, // TBD - winner gets bye
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
  
  writeJsonFile(bracketsFile, bracket);
  res.json(bracket);
});

// Get current bracket
app.get('/api/brackets', (req, res) => {
  const bracket = readJsonFile(bracketsFile);
  res.json(bracket);
});

// Record match result
app.post('/api/matches/:id/result', checkAdminAuth, (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const { winnerId } = req.body;
    
    const bracket = readJsonFile(bracketsFile);
    const participants = readJsonFile(participantsFile);
    const results = readJsonFile(resultsFile);
    
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
      return res.status(404).json({ error: 'Match not found' });
    }
    
    // Check if we need to advance winner to next round
    const currentRoundIndex = bracket.rounds.findIndex(r => r.matches.some(m => m.id === matchId));
    const currentRound = bracket.rounds[currentRoundIndex];
    const nextRound = bracket.rounds[currentRoundIndex + 1];
    
    if (nextRound && completedMatch) {
      // Find which match in current round this was
      const matchIndexInRound = currentRound.matches.findIndex(m => m.id === matchId);
      
      // Calculate which next round match this winner should go to
      const nextRoundMatchIndex = Math.floor(matchIndexInRound / 2);
      const nextRoundMatch = nextRound.matches[nextRoundMatchIndex];
      
      if (nextRoundMatch) {
        // Determine if this winner goes to player1 or player2 slot
        if (matchIndexInRound % 2 === 0) {
          nextRoundMatch.player1 = completedMatch.winner;
        } else {
          nextRoundMatch.player2 = completedMatch.winner;
        }
      }
    }
    
    writeJsonFile(bracketsFile, bracket);
    writeJsonFile(participantsFile, participants);
    writeJsonFile(resultsFile, results);
    
    res.json({ success: true, bracket });
  } catch (error) {
    console.error('Error recording match result:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Get all results
app.get('/api/results', (req, res) => {
  const results = readJsonFile(resultsFile);
  res.json(results);
});

// Admin Routes

// Test admin password
app.post('/api/admin/auth', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, message: 'Admin authenticated' });
  } else {
    res.status(401).json({ error: 'Invalid admin password' });
  }
});

// Reset all tournament data
app.post('/api/admin/reset-all', checkAdminAuth, (req, res) => {
  try {
    // Reset all data files
    writeJsonFile(participantsFile, []);
    writeJsonFile(bracketsFile, { rounds: [] });
    writeJsonFile(resultsFile, []);
    
    // Clean up uploaded images
    const imagesDir = './public/images/';
    if (fs.existsSync(imagesDir)) {
      const files = fs.readdirSync(imagesDir);
      files.forEach(file => {
        if (file.startsWith('player-')) {
          fs.unlinkSync(path.join(imagesDir, file));
        }
      });
    }
    
    res.json({ success: true, message: 'All tournament data reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset tournament data' });
  }
});

// Reset only tournament results (keep participants)
app.post('/api/admin/reset-tournament', checkAdminAuth, (req, res) => {
  try {
    // Reset participants wins/losses
    const participants = readJsonFile(participantsFile);
    participants.forEach(p => {
      p.wins = 0;
      p.losses = 0;
    });
    
    writeJsonFile(participantsFile, participants);
    writeJsonFile(bracketsFile, { rounds: [] });
    writeJsonFile(resultsFile, []);
    
    res.json({ success: true, message: 'Tournament results reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset tournament results' });
  }
});

// Remove specific participant
app.delete('/api/admin/participants/:id', checkAdminAuth, (req, res) => {
  const participantId = parseInt(req.params.id);
  
  try {
    const participants = readJsonFile(participantsFile);
    const participantIndex = participants.findIndex(p => p.id === participantId);
    
    if (participantIndex === -1) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    const participant = participants[participantIndex];
    
    // Remove participant's image if exists
    if (participant.image) {
      const imagePath = path.join('public', participant.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Remove participant from array
    participants.splice(participantIndex, 1);
    writeJsonFile(participantsFile, participants);
    
    res.json({ success: true, message: `Participant ${participant.name} removed successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove participant' });
  }
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize and start server
initializeDataFiles();

app.listen(PORT, () => {
  console.log(`Pool Tournament App running at http://localhost:${PORT}`);
});