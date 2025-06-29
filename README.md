# Chess Endgame Kata Trainer

A web-based chess training application focused on drilling fundamental endgame positions against perfect computer play.

## Features

- **Three Core Endgame Positions:**
  - Lucena Position (Rook + Pawn vs Rook - winning technique)
  - Philidor Position (Rook + Pawn vs Rook - drawing technique)
  - King + Pawn vs King (opposition and breakthrough)

- **Perfect Computer Opposition:** Stockfish engine at depth 20+ for theoretically perfect play
- **Interactive Web Interface:** Drag-and-drop chess board with immediate feedback
- **Repetitive Practice:** Reset positions instantly for kata-style training
- **Position Evaluation:** Get engine analysis of current position

## Installation

1. **Clone or download this repository**

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Stockfish:**
   
   **macOS (using Homebrew):**
   ```bash
   brew install stockfish
   ```
   
   **Ubuntu/Debian:**
   ```bash
   sudo apt-get install stockfish
   ```
   
   **Windows:**
   - Download from [Stockfish website](https://stockfishchess.org/download/)
   - Add to PATH or update `engine.py` with correct path

## Usage

1. **Start the application:**
   ```bash
   python app.py
   ```

2. **Open your browser and go to:**
   ```
   http://localhost:5000
   ```

3. **How to play:**
   - Select an endgame position from the dropdown
   - Click "Start Position" to begin
   - Make moves by dragging pieces
   - The computer will respond with perfect play
   - Use "Reset Position" to practice again
   - Use "Evaluate" to see engine analysis

## Troubleshooting

- **Stockfish not found:** Update the `stockfish_path` in `engine.py` to point to your Stockfish binary
- **Import errors:** Make sure all dependencies are installed with `pip install -r requirements.txt`
- **Port already in use:** Change the port in `app.py` (last line) to a different number

## File Structure

```
chess-endgames/
├── app.py                 # Flask application with API endpoints
├── positions.py           # FEN strings and position metadata
├── engine.py             # Stockfish interface and chess logic
├── requirements.txt      # Python dependencies
├── static/
│   ├── js/
│   │   └── game.js       # Frontend game logic and API calls
│   └── css/
│       └── style.css     # Styling and responsive design
├── templates/
│   └── index.html        # Main game interface
└── README.md            # This file
```

## Learning Resources

- **Lucena Position:** Learn the bridge-building technique to win R+P vs R
- **Philidor Position:** Master the passive defense to hold a draw in R+P vs R  
- **King + Pawn vs King:** Understand opposition and breakthrough patterns

Practice these positions repeatedly until the patterns become automatic!