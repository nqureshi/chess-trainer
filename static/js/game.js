// Chess Endgame Kata Trainer - Game Logic

class EndgameTrainer {
    constructor() {
        this.board = null;
        this.game = new Chess();
        this.currentGameId = null;
        this.positions = {};
        this.currentPosition = null;
        this.userPlaysWhite = true;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadPositions();
        this.initializeBoard();
    }
    
    setupEventListeners() {
        $('#position-select').on('change', () => {
            const selectedPosition = $('#position-select').val();
            $('#start-btn').prop('disabled', !selectedPosition);
        });
        
        $('#start-btn').on('click', () => {
            const selectedPosition = $('#position-select').val();
            if (selectedPosition) {
                this.startPosition(selectedPosition);
            }
        });
        
        $('#hint-btn').on('click', () => {
            if (this.currentGameId) {
                this.showHint();
            }
        });
        
        $('#undo-btn').on('click', () => {
            if (this.currentGameId) {
                this.undoMove();
            }
        });
        
        $('#reset-btn').on('click', () => {
            if (this.currentGameId) {
                this.resetGame();
            }
        });
        
    }
    
    async loadPositions() {
        try {
            const response = await fetch('/api/positions');
            const data = await response.json();
            
            if (data.success) {
                this.positions = data.positions;
                this.populatePositionSelect();
            } else {
                this.showMessage('Failed to load positions: ' + data.error, 'error');
            }
        } catch (error) {
            this.showMessage('Error loading positions: ' + error.message, 'error');
        }
    }
    
    populatePositionSelect() {
        const select = $('#position-select');
        select.empty().append('<option value="">Select a position...</option>');
        
        Object.keys(this.positions).forEach(key => {
            const position = this.positions[key];
            select.append(`<option value="${key}">${position.name}</option>`);
        });
    }
    
    initializeBoard() {
        const config = {
            draggable: true,
            position: 'start',
            pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
            onDragStart: (source, piece, position, orientation) => {
                return this.onDragStart(source, piece, position, orientation);
            },
            onDrop: (source, target) => {
                return this.onDrop(source, target);
            },
            onSnapEnd: () => {
                this.board.position(this.game.fen());
            }
        };
        
        this.board = Chessboard('chess-board', config);
        this.board.resize();
    }
    
    onDragStart(source, piece, position, orientation) {
        // Don't allow moves if game is over
        if (this.game.game_over()) return false;
        
        // Don't allow moves if no game started
        if (!this.currentGameId) return false;
        
        // Only allow player to move their pieces
        if ((this.userPlaysWhite && piece.search(/^b/) !== -1) ||
            (!this.userPlaysWhite && piece.search(/^w/) !== -1)) {
            return false;
        }
        
        return true;
    }
    
    onDrop(source, target) {
        // Check if move is legal
        const move = this.game.move({
            from: source,
            to: target,
            promotion: 'q' // Always promote to queen for simplicity
        });
        
        // Illegal move
        if (move === null) return 'snapback';
        
        // Make the move via API
        this.makeMove(move.san);
        
        return 'snapback'; // Let API handle board updates
    }
    
    async startPosition(positionType) {
        try {
            const response = await fetch(`/api/start/${positionType}`);
            const data = await response.json();
            
            if (data.success) {
                this.currentGameId = data.game_id;
                this.currentPosition = data.position;
                this.game.load(data.current_fen);
                this.board.position(data.current_fen);
                
                this.userPlaysWhite = data.position.user_plays === 'white';
                this.board.orientation(this.userPlaysWhite ? 'white' : 'black');
                
                this.updatePositionInfo();
                this.updateTurnIndicator();
                this.enableGameControls();
                this.showMessage('Position started! Make your move.', 'success');
                this.evaluatePosition(); // Auto-evaluate starting position
                this.clearHint(); // Clear any previous hints
                
                $('#game-result').empty();
            } else {
                this.showMessage('Failed to start position: ' + data.error, 'error');
            }
        } catch (error) {
            this.showMessage('Error starting position: ' + error.message, 'error');
        }
    }
    
    async makeMove(move) {
        try {
            // Convert move to UCI format
            const moves = this.game.history({ verbose: true });
            const lastMove = moves[moves.length - 1];
            const moveUci = lastMove.from + lastMove.to + (lastMove.promotion || '');
            
            const response = await fetch('/api/move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    game_id: this.currentGameId,
                    move: moveUci
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update game state
                this.game.load(data.current_fen);
                this.board.position(data.current_fen);
                
                this.showMessage(`You played: ${move}`, 'info');
                
                if (data.computer_move) {
                    // Convert UCI to SAN for display
                    const tempGame = new Chess(data.current_fen.split(' ').slice(0, -2).join(' ') + ' 0 1');
                    const computerMove = tempGame.move(data.computer_move);
                    this.showMessage(`Computer played: ${computerMove ? computerMove.san : data.computer_move}`, 'info');
                }
                
                if (data.game_over) {
                    this.handleGameOver(data.result);
                } else {
                    this.updateTurnIndicator();
                    this.evaluatePosition(); // Auto-evaluate after each move
                    this.clearHint(); // Clear hint after move
                }
            } else {
                // Undo the move
                this.game.undo();
                this.board.position(this.game.fen());
                this.showMessage('Invalid move: ' + data.error, 'error');
            }
        } catch (error) {
            // Undo the move
            this.game.undo();
            this.board.position(this.game.fen());
            this.showMessage('Error making move: ' + error.message, 'error');
        }
    }
    
    async resetGame() {
        try {
            const response = await fetch(`/api/reset/${this.currentGameId}`);
            const data = await response.json();
            
            if (data.success) {
                this.game.load(data.current_fen);
                this.board.position(data.current_fen);
                this.updateTurnIndicator();
                this.showMessage('Position reset!', 'success');
                this.evaluatePosition(); // Auto-evaluate after reset
                this.clearHint(); // Clear any previous hints
                $('#game-result').empty();
            } else {
                this.showMessage('Failed to reset: ' + data.error, 'error');
            }
        } catch (error) {
            this.showMessage('Error resetting game: ' + error.message, 'error');
        }
    }
    
    async undoMove() {
        try {
            const response = await fetch(`/api/undo/${this.currentGameId}`);
            const data = await response.json();
            
            if (data.success) {
                this.game.load(data.current_fen);
                this.board.position(data.current_fen);
                this.updateTurnIndicator();
                this.evaluatePosition(); // Auto-evaluate after undo
                this.showMessage('Move undone!', 'success');
                $('#game-result').empty();
            } else {
                this.showMessage('Cannot undo: ' + data.error, 'error');
            }
        } catch (error) {
            this.showMessage('Error undoing move: ' + error.message, 'error');
        }
    }
    
    async showHint() {
        try {
            const response = await fetch(`/api/hint/${this.currentGameId}`);
            const data = await response.json();
            
            if (data.success) {
                this.displayHint(data);
                this.showMessage('Hint revealed!', 'info');
            } else {
                this.showMessage('Cannot get hint: ' + data.error, 'error');
            }
        } catch (error) {
            this.showMessage('Error getting hint: ' + error.message, 'error');
        }
    }
    
    async evaluatePosition() {
        try {
            const response = await fetch(`/api/evaluate/${this.currentGameId}`);
            const data = await response.json();
            
            if (data.success) {
                this.displayEvaluation(data.evaluation);
            } else {
                this.showMessage('Failed to evaluate: ' + data.error, 'error');
            }
        } catch (error) {
            this.showMessage('Error evaluating position: ' + error.message, 'error');
        }
    }
    
    updatePositionInfo() {
        $('#position-name').text(this.currentPosition.name);
        $('#position-description').text(this.currentPosition.description);
        $('#position-goal').text('Goal: ' + this.currentPosition.goal);
    }
    
    updateTurnIndicator() {
        const isWhiteToMove = this.game.turn() === 'w';
        const indicator = $('#turn-indicator');
        
        if (isWhiteToMove) {
            indicator.text('White to move').removeClass('turn-black').addClass('turn-white');
        } else {
            indicator.text('Black to move').removeClass('turn-white').addClass('turn-black');
        }
    }
    
    enableGameControls() {
        $('#hint-btn, #undo-btn, #reset-btn').prop('disabled', false);
    }
    
    disableGameControls() {
        $('#hint-btn, #undo-btn, #reset-btn').prop('disabled', true);
    }
    
    handleGameOver(result) {
        const resultDiv = $('#game-result');
        resultDiv.text(result);
        
        if (result.includes('White wins')) {
            resultDiv.removeClass().addClass('result-win');
        } else if (result.includes('Black wins')) {
            resultDiv.removeClass().addClass('result-loss');
        } else {
            resultDiv.removeClass().addClass('result-draw');
        }
        
        this.showMessage('Game Over: ' + result, 'success');
    }
    
    displayEvaluation(evaluation) {
        const evalDiv = $('#evaluation-display');
        let evalText = '';
        
        if (evaluation.type === 'cp') {
            const score = evaluation.value / 100;
            evalText = `Evaluation: ${score > 0 ? '+' : ''}${score.toFixed(2)}`;
        } else if (evaluation.type === 'mate') {
            evalText = `Mate in ${Math.abs(evaluation.value)} ${evaluation.value > 0 ? '(White)' : '(Black)'}`;
        } else {
            evalText = 'Evaluation: ' + JSON.stringify(evaluation);
        }
        
        evalDiv.text(evalText);
    }
    
    displayHint(hintData) {
        const hintDiv = $('#hint-display');
        let hintText = `💡 Best move: ${hintData.best_move_san}`;
        
        // Add evaluation change info if available
        if (hintData.current_evaluation && hintData.evaluation_after_move) {
            const currentEval = this.formatEvaluation(hintData.current_evaluation);
            const afterEval = this.formatEvaluation(hintData.evaluation_after_move);
            hintText += ` (${currentEval} → ${afterEval})`;
        }
        
        hintDiv.html(`<strong>${hintText}</strong>`);
        
        // Clear hint after 10 seconds
        setTimeout(() => {
            hintDiv.empty();
        }, 10000);
    }
    
    formatEvaluation(evaluation) {
        if (evaluation.type === 'cp') {
            const score = evaluation.value / 100;
            return `${score > 0 ? '+' : ''}${score.toFixed(1)}`;
        } else if (evaluation.type === 'mate') {
            return `M${evaluation.value}`;
        }
        return 'Unknown';
    }
    
    clearHint() {
        $('#hint-display').empty();
    }
    
    showMessage(message, type = 'info') {
        const messagesDiv = $('#status-messages');
        const messageDiv = $(`<div class="status-message status-${type}">${message}</div>`);
        
        messagesDiv.empty().append(messageDiv);
        
        // Auto-hide info messages after 3 seconds
        if (type === 'info' || type === 'success') {
            setTimeout(() => {
                messageDiv.fadeOut(500, () => messageDiv.remove());
            }, 3000);
        }
    }
}

// Initialize the game when page loads
$(document).ready(() => {
    new EndgameTrainer();
});