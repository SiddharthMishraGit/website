from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'bet', 'win', 'loss'
    game = db.Column(db.String(20), nullable=False)  # 'aviator', 'mines'
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    balance = db.Column(db.Float, default=1000.0)  # Default $1000 starting balance
    transactions = db.relationship('Transaction', backref='user', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def place_bet(self, amount, game):
        if amount <= 0:
            raise ValueError("Bet amount must be positive")
        if amount > self.balance:
            raise ValueError("Insufficient funds")
        
        self.balance -= amount
        transaction = Transaction(user_id=self.id, amount=-amount, type='bet', game=game)
        db.session.add(transaction)
        db.session.commit()
        return True

    def add_win(self, amount, game):
        if amount <= 0:
            raise ValueError("Win amount must be positive")
            
        self.balance += amount
        transaction = Transaction(user_id=self.id, amount=amount, type='win', game=game)
        db.session.add(transaction)
        db.session.commit()
        return True

    def register_loss(self, amount, game):
        if amount <= 0:
            raise ValueError("Loss amount must be positive")
            
        transaction = Transaction(user_id=self.id, amount=-amount, type='loss', game=game)
        db.session.add(transaction)
        db.session.commit()
        return True
        
    def __repr__(self):
        return f'<User {self.username}>'