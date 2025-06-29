"""Chess engine interface using Stockfish for perfect play."""

import chess
import chess.engine
from stockfish import Stockfish

class ChessEngine:
    """Interface for chess engine operations."""
    
    def __init__(self, stockfish_path="/opt/homebrew/bin/stockfish", depth=20):
        """Initialize the chess engine."""
        self.stockfish_path = stockfish_path
        self.depth = depth
        self.stockfish = None
        self._initialize_engine()
    
    def _initialize_engine(self):
        """Initialize Stockfish engine."""
        try:
            self.stockfish = Stockfish(path=self.stockfish_path)
            self.stockfish.set_depth(self.depth)
        except Exception as e:
            # Fallback to common Stockfish locations
            fallback_paths = [
                "/opt/homebrew/bin/stockfish",
                "/usr/bin/stockfish",
                "stockfish"
            ]
            
            for path in fallback_paths:
                try:
                    self.stockfish = Stockfish(path=path)
                    self.stockfish.set_depth(self.depth)
                    self.stockfish_path = path
                    break
                except:
                    continue
            
            if not self.stockfish:
                raise Exception(f"Could not initialize Stockfish. Please install Stockfish and ensure it's in PATH or provide correct path.")
    
    def get_best_move(self, fen):
        """Get the best move for the current position."""
        if not self.stockfish:
            raise Exception("Engine not initialized")
        
        self.stockfish.set_fen_position(fen)
        best_move = self.stockfish.get_best_move()
        return best_move
    
    def evaluate_position(self, fen):
        """Evaluate the position and return score."""
        if not self.stockfish:
            raise Exception("Engine not initialized")
        
        self.stockfish.set_fen_position(fen)
        evaluation = self.stockfish.get_evaluation()
        return evaluation
    
    def is_game_over(self, fen):
        """Check if the game is over (checkmate, stalemate, etc.)."""
        board = chess.Board(fen)
        return board.is_game_over()
    
    def get_game_result(self, fen):
        """Get the result of the game if it's over."""
        board = chess.Board(fen)
        
        if not board.is_game_over():
            return None
        
        result = board.result()
        if result == "1-0":
            return "White wins"
        elif result == "0-1":
            return "Black wins"
        elif result == "1/2-1/2":
            return "Draw"
        else:
            return "Game in progress"
    
    def is_move_legal(self, fen, move_uci):
        """Check if a move is legal in the given position."""
        try:
            board = chess.Board(fen)
            move = chess.Move.from_uci(move_uci)
            return move in board.legal_moves
        except:
            return False
    
    def make_move(self, fen, move_uci):
        """Make a move and return the new FEN."""
        try:
            board = chess.Board(fen)
            move = chess.Move.from_uci(move_uci)
            
            if move not in board.legal_moves:
                return None
            
            board.push(move)
            return board.fen()
        except:
            return None
    
    def get_legal_moves(self, fen):
        """Get all legal moves in UCI format."""
        try:
            board = chess.Board(fen)
            return [move.uci() for move in board.legal_moves]
        except:
            return []