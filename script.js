let gameState = {
    board: ['', '', '', '', '', '', '', '', ''],
    currentPlayer: 'X',
    gameMode: 'local',
    aiDifficulty: 'easy',
    players: {
        X: 'Player 1',
        O: 'Player 2'
    },
    scores: {
        X: 0,
        O: 0,
        draws: 0,
        total: 0
    },
    gameActive: true,
    chatMessages: [],
    winningLine: null
};

const lobby = document.getElementById('lobby');
const gameScreen = document.getElementById('gameScreen');
const scoreboard = document.getElementById('scoreboard');
const gameBoard = document.getElementById('gameBoard');
const winnerModal = document.getElementById('winnerModal');
const aiDifficulty = document.getElementById('aiDifficulty');
const winLine = document.getElementById('winLine');

function initGame() {
    createBoard();
    updatePlayerCards();
    updateStats();
    loadFromLocalStorage();
}

function createBoard() {
    gameBoard.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.setAttribute('data-index', i);
        cell.addEventListener('click', () => makeMove(i));
        gameBoard.appendChild(cell);
    }
}

function startGame() {
    const playerXName = document.getElementById('playerX').value || 'Player 1';
    const playerOName = document.getElementById('playerO').value || 'Player 2';
    
    gameState.players.X = playerXName;
    gameState.players.O = playerOName;
    
    resetGame();
    showGameScreen();
}

function makeMove(index) {
    if (!gameState.gameActive || gameState.board[index] !== '') return;
    
    gameState.board[index] = gameState.currentPlayer;
    updateBoard();
    
    const winner = checkWinner();
    if (winner) {
        endGame(winner.player, winner.line);
    } else if (gameState.board.every(cell => cell !== '')) {
        endGame('draw');
    } else {
        gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
        updatePlayerCards();
        
        if (gameState.gameMode === 'ai' && gameState.currentPlayer === 'O') {
            setTimeout(makeAIMove, 500);
        }
    }
}

function makeAIMove() {
    let move;
    
    switch (gameState.aiDifficulty) {
        case 'easy':
            move = getEasyAIMove();
            break;
        case 'normal':
            move = getNormalAIMove();
            break;
        case 'hard':
            move = getHardAIMove();
            break;
        default:
            move = getEasyAIMove();
    }
    
    if (move !== -1) {
        makeMove(move);
    }
}

function getEasyAIMove() {
    const emptyCells = gameState.board
        .map((cell, index) => cell === '' ? index : null)
        .filter(index => index !== null);
    
    return emptyCells.length > 0 ? emptyCells[Math.floor(Math.random() * emptyCells.length)] : -1;
}

function getNormalAIMove() {
    let move = findWinningMove('O');
    if (move !== -1) return move;
    
    move = findWinningMove('X');
    if (move !== -1) return move;
    
    if (gameState.board[4] === '') return 4;
    
    const corners = [0, 2, 6, 8];
    const emptyCorners = corners.filter(index => gameState.board[index] === '');
    if (emptyCorners.length > 0) {
        return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
    }
    
    return getEasyAIMove();
}

function getHardAIMove() {
    let move = findWinningMove('O');
    if (move !== -1) return move;
    
    move = findWinningMove('X');
    if (move !== -1) return move;
    
    let bestScore = -Infinity;
    let bestMove = -1;
    
    for (let i = 0; i < 9; i++) {
        if (gameState.board[i] === '') {
            gameState.board[i] = 'O';
            let score = minimax(gameState.board, 0, false);
            gameState.board[i] = '';
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    
    return bestMove !== -1 ? bestMove : getEasyAIMove();
}

function minimax(board, depth, isMaximizing) {
    const scores = {
        'O': 10 - depth,
        'X': depth - 10,
        'draw': 0
    };
    
    const result = checkGameResult(board);
    if (result !== null) {
        return scores[result];
    }
    
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                let score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                let score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function findWinningMove(player) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        const cells = [gameState.board[a], gameState.board[b], gameState.board[c]];
        
        if (cells.filter(cell => cell === player).length === 2 && 
            cells.includes('')) {
            return pattern[cells.indexOf('')];
        }
    }
    return -1;
}

function checkGameResult(board) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    
    return board.every(cell => cell !== '') ? 'draw' : null;
}

function checkWinner() {
    const winPatterns = [
        { pattern: [0, 1, 2], type: 'horizontal', position: 'top' },
        { pattern: [3, 4, 5], type: 'horizontal', position: 'middle' },
        { pattern: [6, 7, 8], type: 'horizontal', position: 'bottom' },
        { pattern: [0, 3, 6], type: 'vertical', position: 'left' },
        { pattern: [1, 4, 7], type: 'vertical', position: 'center' },
        { pattern: [2, 5, 8], type: 'vertical', position: 'right' },
        { pattern: [0, 4, 8], type: 'diagonal', position: 'diagonal-1' },
        { pattern: [2, 4, 6], type: 'diagonal', position: 'diagonal-2' }
    ];

    for (const winPattern of winPatterns) {
        const [a, b, c] = winPattern.pattern;
        if (gameState.board[a] !== '' && 
            gameState.board[a] === gameState.board[b] && 
            gameState.board[a] === gameState.board[c]) {
            return {
                player: gameState.board[a],
                line: winPattern
            };
        }
    }
    return null;
}

function drawWinningLine(line) {
    winLine.className = 'win-line';
    
    switch (line.type) {
        case 'horizontal':
            winLine.classList.add('horizontal', 'show');
            if (line.position === 'top') {
                winLine.style.top = '16.66%';
            } else if (line.position === 'middle') {
                winLine.style.top = '50%';
            } else {
                winLine.style.top = '83.33%';
            }
            break;
            
        case 'vertical':
            winLine.classList.add('vertical', 'show');
            if (line.position === 'left') {
                winLine.style.left = '16.66%';
            } else if (line.position === 'center') {
                winLine.style.left = '50%';
            } else {
                winLine.style.left = '83.33%';
            }
            break;
            
        case 'diagonal':
            winLine.classList.add(line.position, 'show');
            break;
    }
}

function endGame(winner, winningLine) {
    gameState.gameActive = false;
    gameState.scores.total++;
    
    if (winner === 'draw') {
        gameState.scores.draws++;
        showWinnerModal("It's a Draw!", "🤝", "Great game! You were equally matched.");
    } else {
        gameState.scores[winner]++;
        const winnerName = gameState.players[winner];
        showWinnerModal(`${winnerName} Wins!`, winner === 'X' ? '❌' : '⭕', `Congratulations ${winnerName}!`);
        
        if (winningLine) {
            setTimeout(() => {
                drawWinningLine(winningLine);
                highlightWinningCells(winningLine.pattern);
            }, 100);
        }
    }
    
    updateStats();
    saveToLocalStorage();
}

function highlightWinningCells(winningPattern) {
    winningPattern.forEach(index => {
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        if (cell) {
            cell.classList.add('winner');
        }
    });
}

function resetGame() {
    gameState.board = ['', '', '', '', '', '', '', '', ''];
    gameState.currentPlayer = 'X';
    gameState.gameActive = true;
    gameState.winningLine = null;
    
    updateBoard();
    updatePlayerCards();
    
    winLine.className = 'win-line';
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('winner');
    });
}

function playAgain() {
    resetGame();
    winnerModal.style.display = 'none';
}

function backToLobby() {
    winnerModal.style.display = 'none';
    showLobby();
}

function updateBoard() {
    document.querySelectorAll('.cell').forEach((cell, index) => {
        cell.textContent = gameState.board[index];
        cell.className = 'cell';
        if (gameState.board[index] === 'X') {
            cell.classList.add('x');
        } else if (gameState.board[index] === 'O') {
            cell.classList.add('o');
        }
    });
}

function updatePlayerCards() {
    const playerXCard = document.getElementById('playerXCard');
    const playerOCard = document.getElementById('playerOCard');
    const turnIndicator = document.getElementById('turnIndicator');
    
    document.getElementById('playerXName').textContent = gameState.players.X;
    document.getElementById('playerOName').textContent = gameState.players.O;
    
    playerXCard.classList.toggle('active', gameState.currentPlayer === 'X');
    playerOCard.classList.toggle('active', gameState.currentPlayer === 'O');
    
    const currentPlayerName = gameState.currentPlayer === 'X' ? gameState.players.X : gameState.players.O;
    turnIndicator.innerHTML = `<span class="pulse">${currentPlayerName}'s turn (${gameState.currentPlayer})</span>`;
}

function updateStats() {
    document.getElementById('gamesPlayed').textContent = gameState.scores.total;
    document.getElementById('xWins').textContent = gameState.scores.X;
    document.getElementById('oWins').textContent = gameState.scores.O;
    document.getElementById('draws').textContent = gameState.scores.draws;
    
    document.getElementById('scoreX').textContent = `${gameState.players.X}: ${gameState.scores.X}`;
    document.getElementById('scoreO').textContent = `${gameState.players.O}: ${gameState.scores.O}`;
}

function showWinnerModal(title, symbol, message) {
    document.getElementById('winnerTitle').textContent = title;
    document.getElementById('winnerSymbol').textContent = symbol;
    document.getElementById('winnerMessage').textContent = message;
    winnerModal.style.display = 'flex';
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message) {
        addChatMessage('You', message);
        input.value = '';
        
        if (gameState.gameMode === 'ai') {
            setTimeout(() => {
                const responses = {
                    easy: [
                        "Oops!",
                        "Nice move!",
                        "I'm learning!",
                        "Fun game!",
                        "Wow!",
                        "Good one!"
                    ],
                    normal: [
                        "Good move!",
                        "Interesting strategy...",
                        "This is getting intense!",
                        "Well played!",
                        "I'm focusing...",
                        "Nice play!"
                    ],
                    hard: [
                        "Excellent move!",
                        "You're quite skilled!",
                        "This is a real challenge!",
                        "Impressive strategy!",
                        "You're making me work!",
                        "Well calculated!"
                    ]
                };
                const aiResponses = responses[gameState.aiDifficulty] || responses.normal;
                const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
                addChatMessage(gameState.players.O, randomResponse);
            }, 1000);
        }
    }
}

function addChatMessage(sender, message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.style.marginBottom = '10px';
    messageElement.style.padding = '10px';
    messageElement.style.background = 'rgba(102, 126, 234, 0.1)';
    messageElement.style.borderRadius = '10px';
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showLobby() {
    lobby.style.display = 'block';
    gameScreen.style.display = 'none';
    scoreboard.style.display = 'none';
    winnerModal.style.display = 'none';
}

function showGameScreen() {
    lobby.style.display = 'none';
    gameScreen.style.display = 'block';
    scoreboard.style.display = 'none';
    winnerModal.style.display = 'none';
}

function showScoreboard() {
    lobby.style.display = 'none';
    gameScreen.style.display = 'none';
    scoreboard.style.display = 'block';
    winnerModal.style.display = 'none';
}

function setGameMode(mode) {
    gameState.gameMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    if (mode === 'ai') {
        document.getElementById('playerO').value = 'AI Opponent';
        document.getElementById('playerO').disabled = true;
        aiDifficulty.classList.add('show');
    } else {
        document.getElementById('playerO').value = 'Player 2';
        document.getElementById('playerO').disabled = false;
        aiDifficulty.classList.remove('show');
    }
}

function setAIDifficulty(difficulty) {
    gameState.aiDifficulty = difficulty;
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const themeToggle = document.querySelector('.theme-toggle span');
    themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
}

function saveToLocalStorage() {
    localStorage.setItem('ticTacToeScores', JSON.stringify(gameState.scores));
}

function loadFromLocalStorage() {
    const savedScores = localStorage.getItem('ticTacToeScores');
    if (savedScores) {
        gameState.scores = { ...gameState.scores, ...JSON.parse(savedScores) };
        updateStats();
    }
}

document.getElementById('chatInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

window.onload = initGame;