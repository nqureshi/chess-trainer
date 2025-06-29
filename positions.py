"""Chess endgame positions with FEN strings and metadata."""

ENDGAME_POSITIONS = {
    'lucena': {
        'name': 'Lucena Position',
        'description': 'Rook + Pawn vs Rook - winning technique with bridge building',
        'fen': '3K4/3P1k2/8/8/8/8/4R3/2r5 w - - 0 1',
        'goal': 'Win by promoting the pawn using the bridge technique',
        'user_plays': 'white'
    },
    'philidor': {
        'name': 'Philidor Position', 
        'description': 'Rook + Pawn vs Rook - drawing technique with passive defense',
        'fen': '8/8/8/8/4pk2/R7/7r/4K3 w - - 0 1',
        'goal': 'Draw by maintaining passive rook defense on the back rank',
        'user_plays': 'white'
    },
    'king_pawn_vs_king': {
        'name': 'King + Pawn vs King',
        'description': 'Opposition and breakthrough technique',
        'fen': '8/4k3/8/8/3KP3/8/8/8 w - - 0 1',
        'goal': 'Win by using opposition to advance the pawn to promotion',
        'user_plays': 'white'
    }
}

def get_position(position_type):
    """Get position data by type."""
    return ENDGAME_POSITIONS.get(position_type)

def get_all_positions():
    """Get all available positions."""
    return ENDGAME_POSITIONS

def get_position_list():
    """Get list of position types for selection."""
    return list(ENDGAME_POSITIONS.keys())