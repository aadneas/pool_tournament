# Pool Tournament Manager

A web application for managing pool tournaments with participants, brackets, and results tracking.

## Features

- **Participant Management**: Add participants and upload their photos
- **Tournament Brackets**: Generate and manage tournament brackets
- **Results Tracking**: Record match results and track wins/losses
- **Real-time Updates**: Automatically advance winners through bracket rounds

## Prerequisites

Before running this application, make sure you have Node.js installed on your system:

1. Download and install Node.js from [https://nodejs.org/](https://nodejs.org/)
2. Verify installation by running:
   ```
   node --version
   npm --version
   ```

## Installation

1. Navigate to the project directory:
   ```
   cd "c:\repos\Pool tournament\pool-tournament-app"
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Running the Application

### Option 1: Easy Startup (Windows)
1. **Double-click `start.bat`** (Command Prompt version)
   
   OR
   
2. **Right-click `start.ps1` → "Run with PowerShell"** (PowerShell version - recommended)

### Option 2: Manual Startup
1. **Open a terminal/command prompt** in the project directory
2. **Install dependencies** (first time only):
   ```
   npm install
   ```
3. **Start the server**:
   ```
   node server.js
   ```

### Option 3: If Node.js PATH issues
If you get "node is not recognized" errors:

1. **Restart your computer** after installing Node.js
2. **Or** open a fresh terminal/command prompt
3. **Or** find where Node.js was installed and run directly:
   ```
   "C:\Program Files\nodejs\node.exe" server.js
   ```

### Access the Application
Once the server starts, open your web browser and navigate to:
```
http://localhost:3000
```

You should see the message "Pool Tournament App running at http://localhost:3000" in the terminal when it's working correctly.

## How to Use

### Admin Access Required
Most functions now require admin access for security:
- **Adding Participants**: Admin login required
- **Generating Brackets**: Admin login required  
- **Recording Match Results**: Admin login required
- **Managing Tournament**: Admin login required

### Getting Admin Access
1. Go to the "🔒 Admin" section
2. Enter the admin password: `admin123`
3. Once logged in, you can perform admin functions throughout the site

### Adding Participants (Admin Required)
1. Login as admin first
2. Go to the "Participants" section
3. Click "🔒 Add Participant (Admin)" and enter their name
4. Click on the camera icon or placeholder image to upload a photo

### Setting Up a Tournament (Admin Required)
1. Login as admin first
2. Add all participants
3. Go to the "Brackets" section
4. Click "🔒 Generate Bracket (Admin)" to create the tournament structure

### Recording Results (Admin Required)
1. Make sure you're logged in as admin
2. In the "Brackets" section, click the winner's name for each match
3. The bracket will automatically advance winners to the next round
4. View all completed matches in the "Results" section

### Admin Functions
1. Go to the "🔒 Admin" section
2. Enter the admin password: `admin123`
3. Available admin functions:
   - **Remove Participants**: Delete individual participants and their photos
   - **Reset Tournament Results**: Clear brackets and results, keep participants
   - **Reset Everything**: Remove all data and uploaded images

**Note**: Admin login persists until you logout or refresh the page. All destructive actions require confirmation but no additional password entry once logged in.

## Features

- **Responsive Design**: Works on desktop and mobile devices
- **Photo Upload**: Easy drag-and-drop photo upload for participants
- **Automatic Bracket Generation**: Creates balanced tournament brackets
- **Real-time Updates**: Brackets update automatically as matches are completed
- **Statistics Tracking**: Tracks wins and losses for each participant

## File Structure

```
pool-tournament-app/
├── server.js           # Express server with API endpoints
├── package.json        # Node.js dependencies and scripts
├── public/            # Frontend files
│   ├── index.html     # Main HTML page
│   ├── styles.css     # CSS styling
│   ├── script.js      # JavaScript functionality
│   └── images/        # Uploaded participant photos
└── data/              # JSON data storage
    ├── participants.json
    ├── brackets.json
    └── results.json
```

## API Endpoints

- `GET /api/participants` - Get all participants
- `POST /api/participants` - Add new participant
- `POST /api/participants/:id/image` - Upload participant image
- `GET /api/brackets` - Get current bracket
- `POST /api/brackets/generate` - Generate new bracket
- `POST /api/matches/:id/result` - Record match result
- `GET /api/results` - Get all match results

## Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **File Upload**: Multer
- **Data Storage**: JSON files (for simplicity)

## Security Note

This application is designed for local use and doesn't include authentication. Anyone can upload or change participant photos as requested in the requirements.