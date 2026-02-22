// Konstanta dan variabel global
const CHESS_PIECES = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

const INITIAL_BOARD = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

let boardState = JSON.parse(JSON.stringify(INITIAL_BOARD));
let currentPlayer = 'white';
let selectedSquare = null;
let validMoves = [];
let moveHistory = [];
let capturedPieces = { white: [], black: [] };
let moveCount = 0;
let boardFlipped = false;
let showHints = true;

// Inisialisasi game
document.addEventListener('DOMContentLoaded', () => {
    initializeBoard();
    setupEventListeners();
    updateGameStatus();
});

// Fungsi untuk inisialisasi papan
function initializeBoard() {
    const board = document.getElementById('chess-board');
    board.innerHTML = '';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            const squareId = `${String.fromCharCode(97 + col)}${8 - row}`;
            
            square.id = squareId;
            square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
            square.dataset.row = row;
            square.dataset.col = col;
            
            // Tambahkan piece jika ada
            const piece = boardState[row][col];
            if (piece) {
                const pieceElement = document.createElement('div');
                pieceElement.className = `piece ${piece === piece.toUpperCase() ? 'white' : 'black'}`;
                pieceElement.textContent = CHESS_PIECES[piece];
                pieceElement.dataset.piece = piece;
                square.appendChild(pieceElement);
            }
            
            board.appendChild(square);
        }
    }
    
    updateCoordinates();
}

// Fungsi untuk update koordinat
function updateCoordinates() {
    const files = document.querySelector('.files');
    const ranks = document.querySelector('.ranks');
    
    if (boardFlipped) {
        files.innerHTML = '<span>h</span><span>g</span><span>f</span><span>e</span><span>d</span><span>c</span><span>b</span><span>a</span>';
        ranks.innerHTML = '<span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span>';
    } else {
        files.innerHTML = '<span>a</span><span>b</span><span>c</span><span>d</span><span>e</span><span>f</span><span>g</span><span>h</span>';
        ranks.innerHTML = '<span>8</span><span>7</span><span>6</span><span>5</span><span>4</span><span>3</span><span>2</span><span>1</span>';
    }
}

// Fungsi untuk setup event listeners
function setupEventListeners() {
    // Klik pada square
    document.getElementById('chess-board').addEventListener('click', handleSquareClick);
    
    // Tombol kontrol
    document.getElementById('new-game').addEventListener('click', startNewGame);
    document.getElementById('undo-move').addEventListener('click', undoMove);
    document.getElementById('flip-board').addEventListener('click', flipBoard);
    document.getElementById('hint-toggle').addEventListener('click', toggleHints);
    
    // Drag and drop untuk pieces
    setupDragAndDrop();
}

// Fungsi untuk handle klik pada square
function handleSquareClick(event) {
    const square = event.target.closest('.square');
    if (!square) return;
    
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    const piece = boardState[row][col];
    
    // Jika ada piece yang dipilih sebelumnya
    if (selectedSquare) {
        const [fromRow, fromCol] = selectedSquare;
        
        // Cek apakah klik pada valid move
        const isValidMove = validMoves.some(move => 
            move.toRow === row && move.toCol === col
        );
        
        if (isValidMove) {
            // Lakukan pergerakan
            makeMove(fromRow, fromCol, row, col);
            clearSelection();
            return;
        }
    }
    
    // Jika klik pada piece milik pemain saat ini
    if (piece && 
        ((currentPlayer === 'white' && piece === piece.toUpperCase()) ||
         (currentPlayer === 'black' && piece === piece.toLowerCase()))) {
        
        selectSquare(row, col, piece);
    } else {
        clearSelection();
    }
}

// Fungsi untuk memilih square
function selectSquare(row, col, piece) {
    clearSelection();
    
    selectedSquare = [row, col];
    const squareId = getSquareId(row, col);
    const squareElement = document.getElementById(squareId);
    squareElement.classList.add('selected');
    
    // Tampilkan valid moves
    validMoves = calculateValidMoves(row, col, piece);
    showValidMoves(validMoves);
}

// Fungsi untuk menghitung valid moves
function calculateValidMoves(row, col, piece) {
    const moves = [];
    const pieceType = piece.toLowerCase();
    const isWhite = piece === piece.toUpperCase();
    
    // Fungsi helper untuk cek apakah square kosong
    const isEmpty = (r, c) => !boardState[r] || !boardState[r][c] || boardState[r][c] === '';
    
    // Fungsi helper untuk cek apakah square berisi piece lawan
    const isOpponent = (r, c) => {
        if (!boardState[r] || !boardState[r][c] || boardState[r][c] === '') return false;
        return (isWhite && boardState[r][c] === boardState[r][c].toLowerCase()) ||
               (!isWhite && boardState[r][c] === boardState[r][c].toUpperCase());
    };
    
    // Pergerakan untuk setiap jenis piece
    switch (pieceType) {
        case 'p': // Pawn
            const direction = isWhite ? -1 : 1;
            const startRow = isWhite ? 6 : 1;
            
            // Move satu langkah ke depan
            if (isEmpty(row + direction, col)) {
                moves.push({ toRow: row + direction, toCol: col, isCapture: false });
                
                // Move dua langkah dari posisi awal
                if (row === startRow && isEmpty(row + 2 * direction, col)) {
                    moves.push({ toRow: row + 2 * direction, toCol: col, isCapture: false });
                }
            }
            
            // Capture diagonal
            if (isOpponent(row + direction, col - 1)) {
                moves.push({ toRow: row + direction, toCol: col - 1, isCapture: true });
            }
            if (isOpponent(row + direction, col + 1)) {
                moves.push({ toRow: row + direction, toCol: col + 1, isCapture: true });
            }
            break;
            
       case 'r': // Rook
            // Horizontal dan vertikal
            const rookDirections = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dr, dc] of rookDirections) {
                let r = row + dr;
                let c = col + dc;
                while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    if (isEmpty(r, c)) {
                        moves.push({ toRow: r, toCol: c, isCapture: false });
                    } else if (isOpponent(r, c)) {
                        moves.push({ toRow: r, toCol: c, isCapture: true });
                        break;
                    } else {
                        break; // Piece sendiri
                    }
                    r += dr;
                    c += dc;
                }
            }
            break;
            
        case 'n': // Knight
            const knightMoves = [
                [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                [1, -2], [1, 2], [2, -1], [2, 1]
            ];
            for (const [dr, dc] of knightMoves) {
                const r = row + dr;
                const c = col + dc;
                if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    if (isEmpty(r, c)) {
                        moves.push({ toRow: r, toCol: c, isCapture: false });
                    } else if (isOpponent(r, c)) {
                        moves.push({ toRow: r, toCol: c, isCapture: true });
                    }
                }
            }
            break;
            
        case 'b': // Bishop
            const bishopDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            for (const [dr, dc] of bishopDirections) {
                let r = row + dr;
                let c = col + dc;
                while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    if (isEmpty(r, c)) {
                        moves.push({ toRow: r, toCol: c, isCapture: false });
                    } else if (isOpponent(r, c)) {
                        moves.push({ toRow: r, toCol: c, isCapture: true });
                        break;
                    } else {
                        break;
                    }
                    r += dr;
                    c += dc;
                }
            }
            break;
            
        case 'q': // Queen (Rook + Bishop)
            const queenDirections = [
                [-1, 0], [1, 0], [0, -1], [0, 1],
                [-1, -1], [-1, 1], [1, -1], [1, 1]
            ];
            for (const [dr, dc] of queenDirections) {
                let r = row + dr;
                let c = col + dc;
                while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    if (isEmpty(r, c)) {
                        moves.push({ toRow: r, toCol: c, isCapture: false });
                    } else if (isOpponent(r, c)) {
                        moves.push({ toRow: r, toCol: c, isCapture: true });
                        break;
                    } else {
                        break;
                    }
                    r += dr;
                    c += dc;
                }
            }
            break;
            
        case 'k': // King
            const kingMoves = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1],           [0, 1],
                [1, -1], [1, 0], [1, 1]
            ];
            for (const [dr, dc] of kingMoves) {
                const r = row + dr;
                const c = col + dc;
                if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    if (isEmpty(r, c)) {
                        moves.push({ toRow: r, toCol: c, isCapture: false });
                    } else if (isOpponent(r, c)) {
                        moves.push({ toRow: r, toCol: c, isCapture: true });
                    }
                }
            }
            break;
    }
    
    return moves;
}

// Fungsi untuk menampilkan valid moves
function showValidMoves(moves) {
    if (!showHints) return;
    
    moves.forEach(move => {
        const squareId = getSquareId(move.toRow, move.toCol);
        const squareElement = document.getElementById(squareId);
        
        if (move.isCapture) {
            squareElement.classList.add('valid-capture');
        } else {
            squareElement.classList.add('valid-move');
        }
    });
}

// Fungsi untuk melakukan pergerakan
function makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = boardState[fromRow][fromCol];
    const capturedPiece = boardState[toRow][toCol];
    
    // Simpan move untuk undo
    moveHistory.push({
        fromRow, fromCol, toRow, toCol,
        piece, capturedPiece,
        player: currentPlayer
    });
    
    // Update board state
    boardState[toRow][toCol] = piece;
    boardState[fromRow][fromCol] = '';
    
    // Tambahkan piece yang ditangkap
    if (capturedPiece) {
        const isWhiteCaptured = capturedPiece === capturedPiece.toLowerCase();
        if (isWhiteCaptured) {
            capturedPieces.black.push(capturedPiece);
        } else {
            capturedPieces.white.push(capturedPiece);
        }
    }
    
    // Update tampilan
    updateBoard();
    updateCapturedPieces();
    updateMoveHistory();
    
    // Ganti giliran
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    moveCount++;
    
    // Update status game
    updateGameStatus();
    
    // Cek skakmat atau stalemate
    checkGameEnd();
}

// Fungsi untuk update papan
function updateBoard() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        const piece = boardState[row][col];
        
        // Hapus semua pieces
        const existingPiece = square.querySelector('.piece');
        if (existingPiece) {
            existingPiece.remove();
        }
        
        // Tambahkan piece baru jika ada
        if (piece) {
            const pieceElement = document.createElement('div');
            pieceElement.className = `piece ${piece === piece.toUpperCase() ? 'white' : 'black'}`;
            pieceElement.textContent = CHESS_PIECES[piece];
            pieceElement.dataset.piece = piece;
            square.appendChild(pieceElement);
        }
    });
}

// Fungsi untuk update captured pieces
function updateCapturedPieces() {
    const capturedWhite = document.getElementById('captured-white');
    const capturedBlack = document.getElementById('captured-black');
    
    capturedWhite.innerHTML = '';
    capturedBlack.innerHTML = '';
    
    capturedPieces.white.forEach(piece => {
        const pieceElement = document.createElement('span');
        pieceElement.className = 'captured-piece';
        pieceElement.textContent = CHESS_PIECES[piece];
        pieceElement.style.fontSize = '20px';
        pieceElement.style.margin = '2px';
        capturedWhite.appendChild(pieceElement);
    });
    
    capturedPieces.black.forEach(piece => {
        const pieceElement = document.createElement('span');
        pieceElement.className = 'captured-piece';
        pieceElement.textContent = CHESS_PIECES[piece];
        pieceElement.style.fontSize = '20px';
        pieceElement.style.margin = '2px';
        capturedBlack.appendChild(pieceElement);
    });
}

// Fungsi untuk update move history
function updateMoveHistory() {
    const movesList = document.getElementById('moves-list');
    movesList.innerHTML = '';
    
    for (let i = 0; i < moveHistory.length; i += 2) {
        const moveRow = document.createElement('div');
        moveRow.className = 'move-row';
        
        const moveNumber = document.createElement('span');
        moveNumber.className = 'move-number';
        moveNumber.textContent = `${Math.floor(i/2) + 1}.`;
        
        const moveWhite = document.createElement('span');
        moveWhite.className = 'move-white';
        moveWhite.textContent = getMoveNotation(moveHistory[i]);
        
        const moveBlack = document.createElement('span');
        moveBlack.className = 'move-black';
        
        if (moveHistory[i + 1]) {
            moveBlack.textContent = getMoveNotation(moveHistory[i + 1]);
        }
        
        moveRow.appendChild(moveNumber);
        moveRow.appendChild(moveWhite);
        moveRow.appendChild(moveBlack);
        movesList.appendChild(moveRow);
    }
    
    // Scroll ke bawah
    movesList.scrollTop = movesList.scrollHeight;
}

// Fungsi untuk mendapatkan notasi catur
function getMoveNotation(move) {
    const fromSquare = getSquareId(move.fromRow, move.fromCol);
    const toSquare = getSquareId(move.toRow, move.toCol);
    const piece = move.piece.toUpperCase();
    
    let notation = '';
    if (piece !== 'P') {
        notation += piece;
    }
    
    if (move.capturedPiece) {
        if (piece === 'P') {
            notation += fromSquare[0]; // File pawn
        }
        notation += 'x';
    }
    
    notation += toSquare;
    return notation;
}

// Fungsi untuk mendapatkan ID square
function getSquareId(row, col) {
    const file = String.fromCharCode(97 + col);
    const rank = 8 - row;
    return `${file}${rank}`;
}

// Fungsi untuk clear selection
function clearSelection() {
    // Hapus semua selection dan valid moves
    document.querySelectorAll('.square').forEach(square => {
        square.classList.remove('selected', 'valid-move', 'valid-capture');
    });
    
    selectedSquare = null;
    validMoves = [];
}

// Fungsi untuk update status game
function updateGameStatus() {
    const gameStatus = document.getElementById('game-status');
    const moveCountElement = document.getElementById('move-count');
    const whitePlayer = document.querySelector('.white-player');
    const blackPlayer = document.querySelector('.black-player');
    
    moveCountElement.textContent = moveCount;
    
    // Update giliran pemain
    if (currentPlayer === 'white') {
        gameStatus.textContent = 'Giliran Putih';
        whitePlayer.classList.add('active');
        blackPlayer.classList.remove('active');
        whitePlayer.querySelector('.player-turn').textContent = 'Giliran Anda';
        blackPlayer.querySelector('.player-turn').textContent = 'Menunggu';
    } else {
        gameStatus.textContent = 'Giliran Hitam';
        blackPlayer.classList.add('active');
        whitePlayer.classList.remove('active');
        blackPlayer.querySelector('.player-turn').textContent = 'Giliran Anda';
        whitePlayer.querySelector('.player-turn').textContent = 'Menunggu';
    }
}

// Fungsi untuk cek akhir game
function checkGameEnd() {
    // Cek skakmat sederhana (untuk demo)
    const kings = [];
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = boardState[row][col];
            if (piece && piece.toLowerCase() === 'k') {
                kings.push({ piece, row, col });
            }
        }
    }
    
    // Jika salah satu raja tidak ada (ditangkap)
    if (kings.length < 2) {
        const winner = kings[0].piece === 'K' ? 'Putih' : 'Hitam';
        showNotification(`Skakmat! ${winner} menang!`, 'success');
        disableGame();
    }
}

// Fungsi untuk disable game
function disableGame() {
    document.querySelectorAll('.square').forEach(square => {
        square.style.pointerEvents = 'none';
    });
}

// Fungsi untuk show notification
function showNotification(message, type) {
    // Hapus notifikasi sebelumnya
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Hilangkan setelah 3 detik
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Fungsi untuk setup drag and drop
function setupDragAndDrop() {
    const board = document.getElementById('chess-board');
    
    board.addEventListener('mousedown', (e) => {
        const piece = e.target.closest('.piece');
        if (!piece) return;
        
        const square = piece.parentElement;
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        const pieceType = piece.dataset.piece;
        
        // Cek apakah piece milik pemain saat ini
        if ((currentPlayer === 'white' && pieceType === pieceType.toUpperCase()) ||
            (currentPlayer === 'black' && pieceType === pieceType.toLowerCase())) {
            
            piece.classList.add('dragging');
            
            const onMouseMove = (moveEvent) => {
                piece.style.position = 'fixed';
                piece.style.left = `${moveEvent.clientX - 25}px`;
                piece.style.top = `${moveEvent.clientY - 25}px`;
                piece.style.zIndex = '1000';
            };
            
              const onMouseUp = (upEvent) => {
                piece.classList.remove('dragging');
                piece.style.position = '';
                piece.style.left = '';
                piece.style.top = '';
                piece.style.zIndex = '';
                
                // Cari square yang di-drop
                const dropSquare = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
                const targetSquare = dropSquare.closest('.square');
                
                if (targetSquare && targetSquare !== square) {
                    const toRow = parseInt(targetSquare.dataset.row);
                    const toCol = parseInt(targetSquare.dataset.col);
                    
                    // Cek apakah move valid
                    const isValidMove = validMoves.some(move => 
                        move.toRow === toRow && move.toCol === toCol
                    );
                    
                    if (isValidMove) {
                        makeMove(row, col, toRow, toCol);
                    }
                }
                
                // Kembalikan piece ke posisi semula
                piece.style.transform = '';
                
                // Hapus event listeners
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            
            // Pilih square terlebih dahulu
            selectSquare(row, col, pieceType);
            
            // Tambah event listeners
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }
    });
}

// Fungsi untuk game baru
function startNewGame() {
    if (moveCount > 0) {
        if (!confirm('Mulai game baru? Riwayat game saat ini akan hilang.')) {
            return;
        }
    }
    
    // Reset semua state
    boardState = JSON.parse(JSON.stringify(INITIAL_BOARD));
    currentPlayer = 'white';
    selectedSquare = null;
    validMoves = [];
    moveHistory = [];
    capturedPieces = { white: [], black: [] };
    moveCount = 0;
    
    // Update tampilan
    clearSelection();
    updateBoard();
    updateCapturedPieces();
    updateMoveHistory();
    updateGameStatus();
    
    // Enable game
    document.querySelectorAll('.square').forEach(square => {
        square.style.pointerEvents = 'auto';
    });
    
    showNotification('Game baru dimulai! Putih memulai.', 'info');
}

// Fungsi untuk undo move
function undoMove() {
    if (moveHistory.length === 0) {
        showNotification('Tidak ada langkah untuk di-undo', 'info');
        return;
    }
    
    const lastMove = moveHistory.pop();
    
    // Kembalikan board state
    boardState[lastMove.fromRow][lastMove.fromCol] = lastMove.piece;
    boardState[lastMove.toRow][lastMove.toCol] = lastMove.capturedPiece || '';
    
    // Hapus dari captured pieces jika ada
    if (lastMove.capturedPiece) {
        const isWhiteCaptured = lastMove.capturedPiece === lastMove.capturedPiece.toLowerCase();
        if (isWhiteCaptured) {
            capturedPieces.black.pop();
        } else {
            capturedPieces.white.pop();
        }
    }
    
    // Kembalikan giliran
    currentPlayer = lastMove.player;
    moveCount = Math.max(0, moveCount - 1);
    
    // Update tampilan
    clearSelection();
    updateBoard();
    updateCapturedPieces();
    updateMoveHistory();
    updateGameStatus();
    
    showNotification('Langkah terakhir di-undo', 'info');
}

// Fungsi untuk flip board
function flipBoard() {
    boardFlipped = !boardFlipped;
    
    // Flip semua squares
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        
        // Hitung posisi baru
        const newRow = 7 - row;
        const newCol = 7 - col;
        
        square.dataset.row = newRow;
        square.dataset.col = newCol;
        square.id = getSquareId(newRow, newCol);
        
        // Update warna square
        square.classList.remove('light', 'dark');
        square.classList.add((newRow + newCol) % 2 === 0 ? 'light' : 'dark');
    });
    
    // Update koordinat
    updateCoordinates();
    
    // Update board state (tetap sama, hanya tampilan yang dibalik)
    const newBoardState = [];
    for (let i = 0; i < 8; i++) {
        newBoardState[i] = [];
        for (let j = 0; j < 8; j++) {
            newBoardState[i][j] = boardState[7 - i][7 - j];
        }
    }
    boardState = newBoardState;
    
    // Update tampilan pieces
    updateBoard();
    
    showNotification(`Papan diputar ${boardFlipped ? '180°' : 'kembali'}`, 'info');
}

// Fungsi untuk toggle hints
function toggleHints() {
    showHints = !showHints;
    const hintStatus = document.getElementById('hint-status');
    hintStatus.textContent = showHints ? 'ON' : 'OFF';
    
    if (!showHints) {
        // Hapus semua valid moves yang ditampilkan
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('valid-move', 'valid-capture');
        });
    } else if (selectedSquare) {
        // Tampilkan kembali valid moves untuk piece yang dipilih
        const [row, col] = selectedSquare;
        const piece = boardState[row][col];
        validMoves = calculateValidMoves(row, col, piece);
        showValidMoves(validMoves);
    }
    
    showNotification(`Petunjuk pergerakan ${showHints ? 'diaktifkan' : 'dinonaktifkan'}`, 'info');
}

// Tambahkan CSS untuk notification
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }
    
    .notification.success {
        background: linear-gradient(135deg, #4CAF50, #2E7D32);
        border-left: 5px solid #2E7D32;
    }
    
    .notification.info {
        background: linear-gradient(135deg, #2196F3, #0D47A1);
        border-left: 5px solid #0D47A1;
    }
    
    .notification.warning {
        background: linear-gradient(135deg, #FF9800, #F57C00);
        border-left: 5px solid #F57C00;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .captured-piece {
        display: inline-block;
        margin: 2px;
        font-size: 20px;
        opacity: 0.7;
    }
    
    .captured-piece:hover {
        opacity: 1;
        transform: scale(1.1);
    }
`;
document.head.appendChild(style);

// Tambahkan HTML untuk move history (lanjutan dari index.html)
document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.querySelector('.game-container');
    
    // Tambahkan move history section
    const moveHistorySection = document.createElement('div');
    moveHistorySection.className = 'move-history';
    moveHistorySection.innerHTML = `
        <h3><i class="fas fa-history"></i> Riwayat Langkah</h3>
        <div id="moves-list"></div>
        <div class="history-controls" style="margin-top: 15px; display: flex; gap: 10px;">
            <button id="clear-history" class="btn btn-secondary" style="flex: 1;">
                <i class="fas fa-trash"></i> Hapus Riwayat
            </button>
            <button id="export-pgn" class="btn btn-secondary" style="flex: 1;">
                <i class="fas fa-download"></i> Export PGN
            </button>
        </div>
    `;
    
    gameContainer.appendChild(moveHistorySection);
    
    // Tambahkan event listeners untuk kontrol riwayat
    document.getElementById('clear-history')?.addEventListener('click', () => {
        if (moveHistory.length > 0 && confirm('Hapus semua riwayat langkah?')) {
            moveHistory = [];
            updateMoveHistory();
            showNotification('Riwayat langkah dihapus', 'info');
        }
    });
    
    document.getElementById('export-pgn')?.addEventListener('click', exportPGN);
});

// Fungsi untuk export PGN (Portable Game Notation)
function exportPGN() {
    if (moveHistory.length === 0) {
        showNotification('Tidak ada langkah untuk diexport', 'warning');
        return;
    }
    
    let pgn = '[Event "Game Catur Online"]\n';
    pgn += '[Site "JavaScript Chess Game"]\n';
    pgn += `[Date "${new Date().toISOString().split('T')[0]}"]\n`;
    pgn += '[White "Pemain Putih"]\n';
    pgn += '[Black "Pemain Hitam"]\n';
    pgn += `[Result "${getGameResult()}"]\n\n`;
    
    // Tambahkan moves
    let movesText = '';
    for (let i = 0; i < moveHistory.length; i += 2) {
        const moveNumber = Math.floor(i/2) + 1;
        const whiteMove = getMoveNotation(moveHistory[i]);
        
        if (moveHistory[i + 1]) {
            const blackMove = getMoveNotation(moveHistory[i + 1]);
            movesText += `${moveNumber}. ${whiteMove} ${blackMove} `;
            
            // Tambahkan line break setiap 5 moves
            if (moveNumber % 5 === 0) movesText += '\n';
        } else {
            movesText += `${moveNumber}. ${whiteMove} `;
        }
    }
    
    pgn += movesText.trim() + ' ' + getGameResult();
    
    // Buat file download
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-game-${new Date().getTime()}.pgn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('PGN berhasil diexport', 'success');
}

// Fungsi untuk mendapatkan hasil game
function getGameResult() {
    // Cek apakah ada raja yang hilang
    let whiteKing = false;
    let blackKing = false;
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = boardState[row][col];
            if (piece === 'K') whiteKing = true;
            if (piece === 'k') blackKing = true;
        }
    }
    
    if (!whiteKing) return '0-1'; // Hitam menang
    if (!blackKing) return '1-0'; // Putih menang
    
    return '*'; // Game masih berlangsung
}

// Fungsi untuk cek apakah raja dalam skak
function isKingInCheck(player) {
    // Cari posisi raja
    let kingRow = -1;
    let kingCol = -1;
    const kingPiece = player === 'white' ? 'K' : 'k';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (boardState[row][col] === kingPiece) {
                kingRow = row;
                kingCol = col;
                break;
            }
        }
        if (kingRow !== -1) break;
    }
    
    // Cek apakah ada piece lawan yang bisa menyerang raja
    const opponent = player === 'white' ? 'black' : 'white';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = boardState[row][col];
            if (piece && 
                ((opponent === 'black' && piece === piece.toLowerCase()) ||
                 (opponent === 'white' && piece === piece.toUpperCase()))) {
                
                const moves = calculateValidMoves(row, col, piece);
                if (moves.some(move => move.toRow === kingRow && move.toCol === kingCol)) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

// Fungsi untuk cek apakah pemain memiliki langkah legal
function hasLegalMoves(player) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = boardState[row][col];
            if (piece && 
                ((player === 'white' && piece === piece.toUpperCase()) ||
                 (player === 'black' && piece === piece.toLowerCase()))) {
                
                const moves = calculateValidMoves(row, col, piece);
                // Cek setiap move apakah membuat raja tetap aman
                for (const move of moves) {
                    // Simulasikan move
                    const originalPiece = boardState[move.toRow][move.toCol];
                    boardState[move.toRow][move.toCol] = piece;
                    boardState[row][col] = '';
                    
                    const stillInCheck = isKingInCheck(player);
                    
                    // Kembalikan board state
                    boardState[row][col] = piece;
                    boardState[move.toRow][move.toCol] = originalPiece;
                    
                    if (!stillInCheck) {
                        return true; // Ada langkah legal
                    }
                }
            }
        }
    }
    return false; // Tidak ada langkah legal
}

// Update fungsi checkGameEnd untuk cek skakmat dan stalemate
function checkGameEnd() {
    const inCheck = isKingInCheck(currentPlayer);
    const hasMoves = hasLegalMoves(currentPlayer);
    
    if (inCheck && !hasMoves) {
        // Skakmat
        const winner = currentPlayer === 'white' ? 'Hitam' : 'Putih';
        showNotification(`Skakmat! ${winner} menang!`, 'success');
        disableGame();
        return true;
    } else if (!inCheck && !hasMoves) {
        // Stalemate
        showNotification('Stalemate! Permainan seri.', 'info');
        disableGame();
        return true;
    } else if (inCheck) {
        // Skak
        showNotification(`${currentPlayer === 'white' ? 'Putih' : 'Hitam'} dalam skak!`, 'warning');
    }
    
    return false;
}

// Update fungsi makeMove untuk cek validitas move (mencegah raja tetap dalam skak)
function makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = boardState[fromRow][fromCol];
    const capturedPiece = boardState[toRow][toCol];
    
    // Simulasikan move untuk cek apakah raja tetap aman
    boardState[toRow][toCol] = piece;
    boardState[fromRow][fromCol] = '';
    
    if (isKingInCheck(currentPlayer)) {
        // Move tidak valid, kembalikan state
        boardState[fromRow][fromCol] = piece;
        boardState[toRow][toCol] = capturedPiece;
        showNotification('Langkah ini membuat raja Anda dalam skak!', 'warning');
        return;
    }
    
    // Kembalikan state untuk move yang valid
    boardState[fromRow][fromCol] = piece;
    boardState[toRow][toCol] = capturedPiece;
    
    // Simpan move untuk undo
    moveHistory.push({
        fromRow, fromCol, toRow, toCol,
        piece, capturedPiece,
        player: currentPlayer
    });
    
    // Eksekusi move
    boardState[toRow][toCol] = piece;
    boardState[fromRow][fromCol] = '';
    
    // Tambahkan piece yang ditangkap
    if (capturedPiece) {
        const isWhiteCaptured = capturedPiece === capturedPiece.toLowerCase();
        if (isWhiteCaptured) {
            capturedPieces.black.push(capturedPiece);
        } else {
            capturedPieces.white.push(capturedPiece);
        }
    }
    
    // Update tampilan
    updateBoard();
    updateCapturedPieces();
    updateMoveHistory();
    
    // Ganti giliran
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    moveCount++;
    
    // Update status game
    updateGameStatus();
    
    // Cek akhir game
    checkGameEnd();
}

// Fungsi untuk promosi pawn (sederhana)
function promotePawn(row, col) {
    // Dalam implementasi nyata, ini akan menampilkan dialog untuk memilih piece
    // Untuk demo, otomatis promosi ke queen
    const piece = boardState[row][col];
    const isWhite = piece === 'P';
    
    if ((isWhite && row === 0) || (!isWhite && row === 7)) {
        boardState[row][col] = isWhite ? 'Q' : 'q';
        showNotification('Pawn dipromosikan menjadi Queen!', 'info');
        return true;
    }
    return false;
}

// Update fungsi makeMove untuk handle pawn promotion
function makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = boardState[fromRow][fromCol];
    const capturedPiece = boardState[toRow][toCol];
    
    // Simulasikan move untuk cek apakah raja tetap aman
    boardState[toRow][toCol] = piece;
    boardState[fromRow][fromCol] = '';
    
    if (isKingInCheck(currentPlayer)) {
        // Move tidak valid, kembalikan state
        boardState[fromRow][fromCol] = piece;
        boardState[toRow][toCol] = capturedPiece;
        showNotification('Langkah ini membuat raja Anda dalam skak!', 'warning');
        return;
    }
    
    // Kembalikan state untuk move yang valid
    boardState[fromRow][fromCol] = piece;
    boardState[toRow][toCol] = capturedPiece;
    
    // Simpan move untuk undo
    moveHistory.push({
        fromRow, fromCol, toRow, toCol,
        piece, capturedPiece,
        player: currentPlayer
    });
    
    // Eksekusi move
    boardState[toRow][toCol] = piece;
    boardState[fromRow][fromCol] = '';
    
    // Cek pawn promotion
    promotePawn(toRow, toCol);
    
    // Tambahkan piece yang ditangkap
    if (capturedPiece) {
        const isWhiteCaptured = capturedPiece === capturedPiece.toLowerCase();
        if (isWhiteCaptured) {
            capturedPieces.black.push(capturedPiece);
        } else {
            capturedPieces.white.push(capturedPiece);
        }
    }
    
    // Update tampilan
    updateBoard();
    updateCapturedPieces();
    updateMoveHistory();
    
    // Ganti giliran
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    moveCount++;
    
    // Update status game
    updateGameStatus();
    
    // Cek akhir game
    checkGameEnd();
}

// Fungsi untuk menampilkan modal promosi
function showPromotionModal(row, col, isWhite) {
    const modal = document.createElement('div');
    modal.className = 'promotion-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Promosikan Pawn menjadi:</h3>
            <div class="promotion-options">
                <div class="promotion-option" data-piece="${isWhite ? 'Q' : 'q'}">
                    <span class="promotion-piece">${CHESS_PIECES[isWhite ? 'Q' : 'q']}</span>
                    <span class="promotion-text">Queen</span>
                </div>
                <div class="promotion-option" data-piece="${isWhite ? 'R' : 'r'}">
                    <span class="promotion-piece">${CHESS_PIECES[isWhite ? 'R' : 'r']}</span>
                    <span class="promotion-text">Rook</span>
                </div>
                <div class="promotion-option" data-piece="${isWhite ? 'B' : 'b'}">
                    <span class="promotion-piece">${CHESS_PIECES[isWhite ? 'B' : 'b']}</span>
                    <span class="promotion-text">Bishop</span>
                </div>
                <div class="promotion-option" data-piece="${isWhite ? 'N' : 'n'}">
                    <span class="promotion-piece">${CHESS_PIECES[isWhite ? 'N' : 'n']}</span>
                    <span class="promotion-text">Knight</span>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Tambahkan CSS untuk modal
    const modalStyle = document.createElement('style');
    modalStyle.textContent = `
        .promotion-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .modal-content {
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            padding: 30px;
            border-radius: 15px;
            border: 2px solid #ff9800;
            max-width: 400px;
            width: 90%;
            text-align: center;
        }
        
        .modal-content h3 {
            color: #ff9800;
            margin-bottom: 20px;
            font-size: 1.5rem;
        }
        
        .promotion-options {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        
        .promotion-option {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }
        
        .promotion-option:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(255, 152, 0, 0.3);
        }
        
        .promotion-piece {
            font-size: 40px;
            color: ${isWhite ? '#f0f0f0' : '#333'};
        }
        
        .promotion-text {
            color: #fff;
            font-weight: 600;
        }
    `;
    document.head.appendChild(modalStyle);
    
    // Tambahkan event listeners untuk pilihan promosi
    modal.querySelectorAll('.promotion-option').forEach(option => {
        option.addEventListener('click', () => {
            const newPiece = option.dataset.piece;
            boardState[row][col] = newPiece;
            modal.remove();
            modalStyle.remove();
            updateBoard();
            showNotification('Pawn dipromosikan!', 'success');
        });
    });
}

// Update fungsi promotePawn untuk menggunakan modal
function promotePawn(row, col) {
    const piece = boardState[row][col];
    const isWhite = piece === 'P';
    
    if ((isWhite && row === 0) || (!isWhite && row === 7)) {
        showPromotionModal(row, col, isWhite);
        return true;
    }
    return false;
}

// Fungsi untuk menambahkan fitur timer (opsional)
class ChessTimer {
    constructor(whiteTime = 600, blackTime = 600) { // 10 menit default
        this.whiteTime = whiteTime;
        this.blackTime = blackTime;
        this.currentPlayer = 'white';
        this.timerInterval = null;
        this.isRunning = false;
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.timerInterval = setInterval(() => {
            if (this.currentPlayer === 'white') {
                this.whiteTime = Math.max(0, this.whiteTime - 1);
            } else {
                this.blackTime = Math.max(0, this.blackTime - 1);
            }
            
            this.updateDisplay();
            
            // Cek jika waktu habis
            if (this.whiteTime === 0 || this.blackTime === 0) {
                this.stop();
                const winner = this.whiteTime === 0 ? 'Hitam' : 'Putih';
                showNotification(`Waktu habis! ${winner} menang!`, 'success');
                disableGame();
            }
        }, 1000);
    }
    
    stop() {
        this.isRunning = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
    }
    
    updateDisplay() {
        const whiteTimer = document.getElementById('white-timer');
        const blackTimer = document.getElementById('black-timer');
        
        if (whiteTimer) {
            whiteTimer.textContent = this.formatTime(this.whiteTime);
            whiteTimer.style.color = this.currentPlayer === 'white' ? '#4CAF50' : '#fff';
        }
        
        if (blackTimer) {
            blackTimer.textContent = this.formatTime(this.blackTime);
            blackTimer.style.color = this.currentPlayer === 'black' ? '#4CAF50' : '#fff';
        }
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    reset(whiteTime = 600, blackTime = 600) {
        this.stop();
        this.whiteTime = whiteTime;
        this.blackTime = blackTime;
        this.currentPlayer = 'white';
        this.updateDisplay();
    }
}

// Inisialisasi timer jika diperlukan
let chessTimer = null;

// Fungsi untuk mengaktifkan timer
function enableTimer() {
    if (!chessTimer) {
        chessTimer = new ChessTimer();
        
        // Tambahkan timer display ke UI
        const whitePlayer = document.querySelector('.white-player');
        const blackPlayer = document.querySelector('.black-player');
        
        if (whitePlayer && !whitePlayer.querySelector('.timer')) {
            const whiteTimerDiv = document.createElement('div');
            whiteTimerDiv.className = 'timer';
            whiteTimerDiv.innerHTML = `<span id="white-timer">10:00</span>`;
            whitePlayer.appendChild(whiteTimerDiv);
            
            const blackTimerDiv = document.createElement('div');
            blackTimerDiv.className = 'timer';
            blackTimerDiv.innerHTML = `<span id="black-timer">10:00</span>`;
            blackPlayer.appendChild(blackTimerDiv);
            
            // Tambahkan CSS untuk timer
            const timerStyle = document.createElement('style');
            timerStyle.textContent = `
                .timer {
                    font-family: 'Courier New', monospace;
                    font-size: 1.2rem;
                    font-weight: bold;
                    margin-top: 10px;
                    padding: 5px 10px;
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 5px;
                    display: inline-block;
                }
            `;
            document.head.appendChild(timerStyle);
        }
        
        chessTimer.updateDisplay();
        chessTimer.start();
    }
}

// Update fungsi makeMove untuk mengintegrasikan timer
function makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = boardState[fromRow][fromCol];
    const capturedPiece = boardState[toRow][toCol];
    
    // Simulasikan move untuk cek apakah raja tetap aman
    boardState[toRow][toCol] = piece;
    boardState[fromRow][fromCol] = '';
    
    if (isKingInCheck(currentPlayer)) {
        // Move tidak valid, kembalikan state
        boardState[fromRow][fromCol] = piece;
        boardState[toRow][toCol] = capturedPiece;
        showNotification('Langkah ini membuat raja Anda dalam skak!', 'warning');
        return;
    }
    
    // Kembalikan state untuk move yang valid
    boardState[fromRow][fromCol] = piece;
    boardState[toRow][toCol] = capturedPiece;
    
    // Simpan move untuk undo
    moveHistory.push({
        fromRow, fromCol, toRow, toCol,
        piece, capturedPiece,
        player: currentPlayer
    });
    
    // Eksekusi move
    boardState[toRow][toCol] = piece;
    boardState[fromRow][fromCol] = '';
    
    // Cek pawn promotion
    promotePawn(toRow, toCol);
    
    // Tambahkan piece yang ditangkap
    if (capturedPiece) {
        const isWhiteCaptured = capturedPiece === capturedPiece.toLowerCase();
        if (isWhiteCaptured) {
            capturedPieces.black.push(capturedPiece);
        } else {
            capturedPieces.white.push(capturedPiece);
        }
    }
    
    // Update tampilan
    updateBoard();
    updateCapturedPieces();
    updateMoveHistory();
    
    // Switch timer jika aktif
    if (chessTimer) {
        chessTimer.switchPlayer();
    }
    
    // Ganti giliran
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    moveCount++;
    
    // Update status game
    updateGameStatus();
    
    // Cek akhir game
    checkGameEnd();
}

// Fungsi untuk menambahkan tombol timer control
function addTimerControls() {
    const controls = document.querySelector('.controls');
    const timerBtn = document.createElement('button');
    timerBtn.id = 'toggle-timer';
    timerBtn.className = 'btn btn-secondary';
    timerBtn.innerHTML = '<i class="fas fa-clock"></i> Timer: <span id="timer-status">OFF</span>';
    
    controls.appendChild(timerBtn);
    
    timerBtn.addEventListener('click', () => {
        if (!chessTimer) {
            enableTimer();
            document.getElementById('timer-status').textContent = 'ON';
            showNotification('Timer diaktifkan (10 menit per pemain)', 'info');
        } else {
            chessTimer.stop();
            chessTimer = null;
            document.getElementById('timer-status').textContent = 'OFF';
            showNotification('Timer dinonaktifkan', 'info');
        }
    });
}

// Inisialisasi tambahan saat DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeBoard();
    setupEventListeners();
    updateGameStatus();
    addTimerControls(); // Tambahkan kontrol timer
    
    // Tambahkan keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Space untuk undo
        if (e.code === 'Space' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            undoMove();
        }
        
        // N untuk new game
        if (e.code === 'KeyN' && e.ctrlKey) {
            e.preventDefault();
            startNewGame();
        }
        
        // F untuk flip board
        if (e.code === 'KeyF' && e.ctrlKey) {
            e.preventDefault();
            flipBoard();
        }
        
        // H untuk toggle hints
        if (e.code === 'KeyH' && e.ctrlKey) {
            e.preventDefault();
            toggleHints();
        }
    });
    
    // Tampilkan instruksi keyboard
    setTimeout(() => {
        showNotification('Tips: Gunakan Ctrl+N (Game Baru), Ctrl+F (Putar Papan), Ctrl+H (Petunjuk), Space (Undo)', 'info');
    }, 2000);
});

// Fungsi untuk menampilkan modal instruksi
// function showInstructions() {
//     const modal = document.createElement('div');
//     modal.className = 'instructions-modal';
//     modal.innerHTML = `
//         <div class="modal-content">
//             <h2><i class="fas fa-info-circle"></i> Instruksi Game Catur</h2>
//             <div class="instructions">
//                 <h3>Cara Bermain:</h3>
//                 <ul>
//                     <li>Klik piece untuk memilih, lalu klik square tujuan</li>
//                     <li>Atau drag and drop piece ke square tujuan</li>
//                     <li>Putih selalu memulai permainan</li>
//                     <li>Giliran bergantian antara Putih dan Hitam</li>
//                 </ul>
                
//                 <h3>Kontrol Keyboard:</h3>
//                 <ul>
//                     <li><strong>Ctrl +