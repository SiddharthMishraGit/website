class MinesGame {
    constructor() {
        this.gridSize = 25; // 5x5 grid
        this.mineCount = 5; // default mine count
        this.currentBet = 0;
        this.isPlaying = false;
        this.revealedCount = 0;
        this.grid = [];
        this.minePositions = [];
        this.betPlaced = false;
        this.setupAPI();
        this.initializeUI();
        this.setupEventListeners();
    }

    setupAPI() {
        this.apiEndpoints = {
            placeBet: '/api/place-bet',
            recordWin: '/api/record-win',
            recordLoss: '/api/record-loss'
        };
    }

    initializeUI() {
        this.minesGrid = document.getElementById('minesGrid');
        this.betAmountInput = document.getElementById('betAmount');
        this.placeBetBtn = document.getElementById('placeBetBtn');
        this.cashoutBtn = document.getElementById('cashoutBtn');
        this.multiplierDisplay = document.getElementById('current-multiplier');
        this.potentialWinDisplay = document.getElementById('potential-win');
        
        // Create grid cells
        for (let i = 0; i < this.gridSize; i++) {
            const cell = document.createElement('button');
            cell.className = 'grid-cell';
            cell.dataset.index = i;
            this.minesGrid.appendChild(cell);
        }

        // Set active mine count
        document.querySelector('[data-mines="5"]').classList.add('active');
    }

    setupEventListeners() {
        // Mine count selection
        document.querySelectorAll('.mine-count-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.isPlaying) {
                    document.querySelectorAll('.mine-count-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.mineCount = parseInt(btn.dataset.mines);
                }
            });
        });

        // Bet button
        this.placeBetBtn.addEventListener('click', () => this.startGame());
        
        // Cashout button
        this.cashoutBtn.addEventListener('click', () => this.cashout());
        
        // Grid cell clicks
        this.minesGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('grid-cell') && !e.target.classList.contains('revealed') && this.isPlaying) {
                this.revealCell(parseInt(e.target.dataset.index));
            }
        });
    }

    async startGame() {
        const betAmount = parseFloat(this.betAmountInput.value);
        if (betAmount < 1) return;

        try {
            const response = await fetch(this.apiEndpoints.placeBet, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: betAmount,
                    game: 'mines'
                })
            });

            const data = await response.json();
            if (!response.ok) {
                alert(data.error || 'Failed to place bet');
                return;
            }

            // Update UI with new balance
            document.querySelector('.user-info span').textContent = `Balance: $${data.balance.toFixed(2)}`;
            
            this.currentBet = betAmount;
            this.betPlaced = true;
            this.isPlaying = true;
            this.revealedCount = 0;
            this.grid = new Array(this.gridSize).fill('empty');
            this.placeBetBtn.disabled = true;
            this.cashoutBtn.disabled = false;

            // Place mines randomly
            this.minePositions = [];
            while (this.minePositions.length < this.mineCount) {
                const position = Math.floor(Math.random() * this.gridSize);
                if (!this.minePositions.includes(position)) {
                    this.minePositions.push(position);
                    this.grid[position] = 'mine';
                }
            }

            // Reset UI
            document.querySelectorAll('.grid-cell').forEach(cell => {
                cell.className = 'grid-cell';
            });
            
            this.updateMultiplier();
        } catch (error) {
            alert('Error placing bet');
            console.error('Error:', error);
        }
    }

    revealCell(index) {
        const cell = this.minesGrid.children[index];
        cell.classList.add('revealing');
        
        setTimeout(() => {
            if (this.grid[index] === 'mine') {
                this.revealMine(index);
                this.gameOver();
            } else {
                this.revealGem(index);
                this.revealedCount++;
                this.updateMultiplier();
                
                // Check if all safe cells are revealed
                if (this.revealedCount === this.gridSize - this.mineCount) {
                    this.cashout();
                }
            }
        }, 100);
    }

    revealMine(index) {
        const cell = this.minesGrid.children[index];
        cell.classList.add('revealed', 'mine');
    }

    revealGem(index) {
        const cell = this.minesGrid.children[index];
        cell.classList.add('revealed', 'gem');
    }

    updateMultiplier() {
        const multiplier = this.calculateMultiplier();
        this.multiplierDisplay.textContent = multiplier.toFixed(2) + '×';
        this.potentialWinDisplay.textContent = (this.currentBet * multiplier).toFixed(2);
    }

    calculateMultiplier() {
        if (this.revealedCount === 0) return 1;
        
        // Calculate multiplier based on revealed cells and mine count
        const safeSquares = this.gridSize - this.mineCount;
        let multiplier = 1;
        
        for (let i = 0; i < this.revealedCount; i++) {
            multiplier *= (safeSquares - i) / (this.gridSize - i);
        }
        
        return 0.99 / multiplier; // House edge of 1%
    }

    async cashout() {
        if (!this.isPlaying || !this.betPlaced) return;
        
        const finalMultiplier = this.calculateMultiplier();
        const winAmount = this.currentBet * finalMultiplier;
        
        try {
            const response = await fetch(this.apiEndpoints.recordWin, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: winAmount,
                    game: 'mines'
                })
            });

            const data = await response.json();
            if (!response.ok) {
                alert(data.error || 'Failed to record win');
                return;
            }

            // Update UI with new balance
            document.querySelector('.user-info span').textContent = `Balance: $${data.balance.toFixed(2)}`;
            
            this.addResult(finalMultiplier, true);
            this.resetGame();
            
            // Show win notification
            alert(`Won: $${winAmount.toFixed(2)}`);
        } catch (error) {
            alert('Error recording win');
            console.error('Error:', error);
        }
    }

    async gameOver() {
        if (!this.betPlaced) return;
        
        this.isPlaying = false;
        
        try {
            const response = await fetch(this.apiEndpoints.recordLoss, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: this.currentBet,
                    game: 'mines'
                })
            });

            const data = await response.json();
            if (!response.ok) {
                alert(data.error || 'Failed to record loss');
                return;
            }

            // Update UI with new balance
            document.querySelector('.user-info span').textContent = `Balance: $${data.balance.toFixed(2)}`;
            
            // Reveal all mines
            this.minePositions.forEach(pos => {
                this.revealMine(pos);
            });
            
            this.addResult(this.calculateMultiplier(), false);
            this.resetGame();
        } catch (error) {
            alert('Error recording loss');
            console.error('Error:', error);
        }
    }

    resetGame() {
        this.isPlaying = false;
        this.placeBetBtn.disabled = false;
        this.cashoutBtn.disabled = true;
        this.multiplierDisplay.textContent = '1.00×';
        this.potentialWinDisplay.textContent = '0.00';
        this.betPlaced = false;
    }

    addResult(multiplier, won) {
        const resultsList = document.getElementById('previous-results');
        const resultItem = document.createElement('div');
        resultItem.className = `result-item ${won ? 'result-win' : 'result-crash'}`;
        resultItem.textContent = multiplier.toFixed(2) + '×';
        
        resultsList.insertBefore(resultItem, resultsList.firstChild);
        
        // Keep only last 10 results
        while (resultsList.children.length > 10) {
            resultsList.removeChild(resultsList.lastChild);
        }
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new MinesGame();
});