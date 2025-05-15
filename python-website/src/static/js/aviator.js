class AviatorGame {
    constructor() {
        this.canvas = document.getElementById('aviatorCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.multiplier = 1.00;
        this.isFlying = false;
        this.gameStarted = false;
        this.lastTimestamp = 0;
        this.planePosition = { x: 50, y: this.canvas.height - 50 };
        this.curve = [];
        
        // Betting related
        this.currentBet = 0;
        this.autoCashoutAt = 2.00;
        this.betPlaced = false;
        this.setupAPI();

        this.setupEventListeners();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    setupEventListeners() {
        document.getElementById('placeBetBtn').addEventListener('click', () => this.startGame());
        document.getElementById('cashoutBtn').addEventListener('click', () => this.cashout());
        document.getElementById('autoCashoutAt').addEventListener('change', (e) => {
            this.autoCashoutAt = parseFloat(e.target.value);
        });
    }

    setupAPI() {
        this.apiEndpoints = {
            placeBet: '/api/place-bet',
            recordWin: '/api/record-win',
            recordLoss: '/api/record-loss'
        };
    }

    async startGame() {
        const betAmount = parseFloat(document.getElementById('betAmount').value);
        if (betAmount < 1) return;

        try {
            const response = await fetch(this.apiEndpoints.placeBet, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: betAmount,
                    game: 'aviator'
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
            this.gameStarted = true;
            this.isFlying = true;
            this.multiplier = 1.00;
            this.curve = [];
            this.planePosition = { x: 50, y: this.canvas.height - 50 };
            
            document.getElementById('placeBetBtn').disabled = true;
            document.getElementById('cashoutBtn').disabled = false;
            
            this.lastTimestamp = performance.now();
            requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        } catch (error) {
            alert('Error placing bet');
            console.error('Error:', error);
        }
    }

    gameLoop(timestamp) {
        if (!this.isFlying) return;

        const deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        // Update multiplier (non-linear growth)
        this.multiplier += (deltaTime * 0.001) * (1 + this.multiplier * 0.1);
        document.getElementById('current-multiplier').textContent = this.multiplier.toFixed(2) + '×';

        // Update plane position
        const progress = (this.multiplier - 1) / 10;
        this.planePosition.x = 50 + (this.canvas.width - 100) * Math.min(progress, 1);
        this.planePosition.y = this.canvas.height - 50 - Math.sin(progress * Math.PI) * (this.canvas.height * 0.7);
        
        this.curve.push({ x: this.planePosition.x, y: this.planePosition.y });
        
        // Draw game state
        this.draw();

        // Check for auto cashout
        if (this.multiplier >= this.autoCashoutAt) {
            this.cashout();
            return;
        }

        // Random crash check (example probability)
        if (Math.random() < 0.001 * (this.multiplier * 0.1)) {
            this.crash();
            return;
        }

        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw curve
        if (this.curve.length > 1) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.curve[0].x, this.curve[0].y);
            for (let i = 1; i < this.curve.length; i++) {
                this.ctx.lineTo(this.curve[i].x, this.curve[i].y);
            }
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        // Draw airplane
        this.drawPlane(this.planePosition.x, this.planePosition.y);
    }

    drawPlane(x, y) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // Calculate rotation based on curve
        let rotation = 0;
        if (this.curve.length > 1) {
            const lastPoint = this.curve[this.curve.length - 1];
            const prevPoint = this.curve[this.curve.length - 2];
            rotation = Math.atan2(lastPoint.y - prevPoint.y, lastPoint.x - prevPoint.x);
        }
        this.ctx.rotate(rotation);

        // Draw airplane body
        this.ctx.beginPath();
        this.ctx.moveTo(-20, 0);
        this.ctx.lineTo(20, 0);
        this.ctx.lineTo(10, -10);
        this.ctx.lineTo(-10, -10);
        this.ctx.closePath();
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fill();

        // Draw wings
        this.ctx.beginPath();
        this.ctx.moveTo(-15, -5);
        this.ctx.lineTo(-25, -15);
        this.ctx.lineTo(-5, -15);
        this.ctx.closePath();
        this.ctx.moveTo(15, -5);
        this.ctx.lineTo(25, -15);
        this.ctx.lineTo(5, -15);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }

    async cashout() {
        if (!this.isFlying || !this.betPlaced) return;
        
        this.isFlying = false;
        const winAmount = this.currentBet * this.multiplier;
        
        try {
            const response = await fetch(this.apiEndpoints.recordWin, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: winAmount,
                    game: 'aviator'
                })
            });

            const data = await response.json();
            if (!response.ok) {
                alert(data.error || 'Failed to record win');
                return;
            }

            // Update UI with new balance
            document.querySelector('.user-info span').textContent = `Balance: $${data.balance.toFixed(2)}`;
            
            // Add to recent results
            this.addResult(this.multiplier, true);
            
            // Reset game state
            this.resetGame();
            
            // Show win notification
            alert(`Won: $${winAmount.toFixed(2)}`);
        } catch (error) {
            alert('Error recording win');
            console.error('Error:', error);
        }
    }

    async crash() {
        if (!this.betPlaced) return;
        
        this.isFlying = false;
        
        try {
            const response = await fetch(this.apiEndpoints.recordLoss, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: this.currentBet,
                    game: 'aviator'
                })
            });

            const data = await response.json();
            if (!response.ok) {
                alert(data.error || 'Failed to record loss');
                return;
            }

            // Update UI with new balance
            document.querySelector('.user-info span').textContent = `Balance: $${data.balance.toFixed(2)}`;
            
            // Add to recent results
            this.addResult(this.multiplier, false);
            
            // Reset game state
            this.resetGame();
        } catch (error) {
            alert('Error recording loss');
            console.error('Error:', error);
        }
    }

    resetGame() {
        document.getElementById('placeBetBtn').disabled = false;
        document.getElementById('cashoutBtn').disabled = true;
        this.gameStarted = false;
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
    new AviatorGame();
});