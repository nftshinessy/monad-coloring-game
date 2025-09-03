# Monad Coloring Game

MonadHub is a community recognition platform that allows users to vote for notable contributors in the Monad ecosystem once per day.

## 🎮 Features

- 🔐 Web3 wallet authentication
- 🎨 Interactive canvas coloring experience
- ⚡ Real-time timer and completion tracking
- 🏆 Global leaderboard with player rankings
- 📊 Personal statistics and achievements
- 🐦 Twitter sharing integration
- 📱 Responsive design for all devices

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Modern web browser with MetaMask extension

### Installation

1. Clone the repository:
```bash
git clone https://github.com/nftshinessy/monad-coloring-game.git
cd monad-coloring-game
```

2. Install backend dependencies:
```bash
cd backend
npm install
npm install web3 cors express-rate-limit
```

3. Initialize the database:
```bash
npm run init-db
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your specific configurations
```

5. Start the backend server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

6. Deploy frontend files to your web server or open directly in a browser:

- Place the frontend folder contents in your web server root directory

- Or open frontend/index.html directly in a browser (some features may require a local server)

## 🏗️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Canvas API

- **Backend**: Node.js, Express.js

- **Database**: SQLite

- **Blockchain**: Web3.js, MetaMask integration

- **Security**: CORS, Express Rate Limit

- **Deployment**: Nginx, PM2 process manager

## 📁 Project Structure

```text
monad-coloring-game/
├── backend/
│   ├── server.js          # Express server and API routes
│   ├── auth.js            # Web3 authentication handlers
│   ├── game-logic.js      # Game session management
│   ├── leaderboard.js     # Database operations for leaderboard
│   ├── init-db.js         # Database initialization script
│   ├── package.json       # Backend dependencies
│   └── .env               # Environment variables (ignored in git)
├── frontend/
│   ├── index.html         # Main HTML file
│   ├── style.css          # Application styles
│   ├── app.js             # Main game logic and canvas handling
│   ├── auth.js            # Frontend wallet connection logic
│   └── leaderboard.js     # Frontend leaderboard functionality
└── README.md              # Project documentation
```

##  🌐 API Endpoints

 **```POST /api/auth/wallet```** - Authenticate wallet connection

 **```GET /api/auth/nonce```** - Get nonce for signature verification

 **```POST /api/game/start```** - Start a new game session

 **```POST /api/game/finish```** - Finish game and save results

 **```GET /api/leaderboard```** - Retrieve leaderboard data

 **```GET /api/player/stats```** - Get player statistics


