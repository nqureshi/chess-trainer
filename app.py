"""Flask application for Chess Endgame Kata Trainer."""

from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
import uuid
from engine import ChessEngine
from positions import get_position, get_all_positions, get_position_list

app = Flask(__name__)
app.secret_key = 'chess_endgame_trainer_secret_key'
CORS(app)

# Global engine instance
chess_engine = None

def get_engine():
    """Get or create chess engine instance."""
    global chess_engine
    if chess_engine is None:
        chess_engine = ChessEngine()
    return chess_engine

@app.route('/')
def index():
    """Main game interface."""
    return render_template('index.html')

@app.route('/api/positions')
def get_positions():
    """Get all available endgame positions."""
    try:
        positions = get_all_positions()
        return jsonify({
            'success': True,
            'positions': positions
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/start/<position_type>')
def start_position(position_type):
    """Start a new endgame position."""
    try:
        position_data = get_position(position_type)
        if not position_data:
            return jsonify({
                'success': False,
                'error': 'Invalid position type'
            }), 400
        
        # Create new game session
        game_id = str(uuid.uuid4())
        session[game_id] = {
            'position_type': position_type,
            'current_fen': position_data['fen'],
            'starting_fen': position_data['fen'],
            'moves': [],
            'user_plays': position_data['user_plays']
        }
        
        return jsonify({
            'success': True,
            'game_id': game_id,
            'position': position_data,
            'current_fen': position_data['fen']
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/move', methods=['POST'])
def make_move():
    """Make a move in the current game."""
    try:
        data = request.get_json()
        game_id = data.get('game_id')
        move_uci = data.get('move')
        
        if not game_id or game_id not in session:
            return jsonify({
                'success': False,
                'error': 'Invalid game session'
            }), 400
        
        game_state = session[game_id]
        engine = get_engine()
        
        # Check if move is legal
        if not engine.is_move_legal(game_state['current_fen'], move_uci):
            return jsonify({
                'success': False,
                'error': 'Illegal move'
            }), 400
        
        # Make user move
        new_fen = engine.make_move(game_state['current_fen'], move_uci)
        if not new_fen:
            return jsonify({
                'success': False,
                'error': 'Failed to make move'
            }), 400
        
        game_state['current_fen'] = new_fen
        game_state['moves'].append(move_uci)
        
        # Check if game is over after user move
        if engine.is_game_over(new_fen):
            result = engine.get_game_result(new_fen)
            session[game_id] = game_state
            return jsonify({
                'success': True,
                'user_move': move_uci,
                'current_fen': new_fen,
                'game_over': True,
                'result': result
            })
        
        # Get computer response
        computer_move = engine.get_best_move(new_fen)
        if computer_move:
            computer_fen = engine.make_move(new_fen, computer_move)
            if computer_fen:
                game_state['current_fen'] = computer_fen
                game_state['moves'].append(computer_move)
                
                # Check if game is over after computer move
                game_over = engine.is_game_over(computer_fen)
                result = None
                if game_over:
                    result = engine.get_game_result(computer_fen)
                
                session[game_id] = game_state
                return jsonify({
                    'success': True,
                    'user_move': move_uci,
                    'computer_move': computer_move,
                    'current_fen': computer_fen,
                    'game_over': game_over,
                    'result': result
                })
        
        # No computer move available
        session[game_id] = game_state
        return jsonify({
            'success': True,
            'user_move': move_uci,
            'current_fen': new_fen,
            'game_over': False
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/reset/<game_id>')
def reset_game(game_id):
    """Reset the current game to starting position."""
    try:
        if game_id not in session:
            return jsonify({
                'success': False,
                'error': 'Invalid game session'
            }), 400
        
        game_state = session[game_id]
        game_state['current_fen'] = game_state['starting_fen']
        game_state['moves'] = []
        session[game_id] = game_state
        
        return jsonify({
            'success': True,
            'current_fen': game_state['starting_fen']
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/evaluate/<game_id>')
def evaluate_position(game_id):
    """Evaluate the current position."""
    try:
        if game_id not in session:
            return jsonify({
                'success': False,
                'error': 'Invalid game session'
            }), 400
        
        game_state = session[game_id]
        engine = get_engine()
        evaluation = engine.evaluate_position(game_state['current_fen'])
        
        return jsonify({
            'success': True,
            'evaluation': evaluation,
            'current_fen': game_state['current_fen']
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/undo/<game_id>')
def undo_move(game_id):
    """Undo the last move (both user and computer moves)."""
    try:
        if game_id not in session:
            return jsonify({
                'success': False,
                'error': 'Invalid game session'
            }), 400
        
        game_state = session[game_id]
        
        # Need at least 2 moves to undo (user + computer)
        if len(game_state['moves']) < 2:
            return jsonify({
                'success': False,
                'error': 'No moves to undo'
            }), 400
        
        # Remove last 2 moves (computer move and user move)
        game_state['moves'] = game_state['moves'][:-2]
        
        # Rebuild position from scratch
        engine = get_engine()
        current_fen = game_state['starting_fen']
        
        # Replay all remaining moves
        for move in game_state['moves']:
            current_fen = engine.make_move(current_fen, move)
            if not current_fen:
                # If move reconstruction fails, reset to starting position
                current_fen = game_state['starting_fen']
                game_state['moves'] = []
                break
        
        game_state['current_fen'] = current_fen
        session[game_id] = game_state
        
        return jsonify({
            'success': True,
            'current_fen': current_fen,
            'moves_remaining': len(game_state['moves'])
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)