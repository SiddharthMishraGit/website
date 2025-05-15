from flask import render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from models import User, db
from .forms import LoginForm, SignupForm

def init_routes(app):
    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if current_user.is_authenticated:
            return redirect(url_for('index'))
            
        form = LoginForm()
        if form.validate_on_submit():
            user = User.query.filter_by(username=form.username.data).first()
            if user and user.check_password(form.password.data):
                login_user(user)
                next_page = request.args.get('next')
                return redirect(next_page if next_page else url_for('index'))
            flash('Invalid username or password')
        return render_template('auth/login.html', form=form)

    @app.route('/signup', methods=['GET', 'POST'])
    def signup():
        if current_user.is_authenticated:
            return redirect(url_for('index'))
            
        form = SignupForm()
        if form.validate_on_submit():
            if User.query.filter_by(username=form.username.data).first():
                flash('Username already exists')
                return render_template('auth/signup.html', form=form)
                
            user = User(username=form.username.data)
            user.set_password(form.password.data)
            db.session.add(user)
            db.session.commit()
            login_user(user)
            return redirect(url_for('index'))
        return render_template('auth/signup.html', form=form)

    @app.route('/logout')
    @login_required
    def logout():
        logout_user()
        return redirect(url_for('index'))

    @app.route('/games/aviator')
    @login_required
    def aviator():
        return render_template('games/aviator.html')
        
    @app.route('/games/mines')
    @login_required
    def mines():
        return render_template('games/mines.html')

    @app.route('/api/place-bet', methods=['POST'])
    @login_required
    def place_bet():
        data = request.get_json()
        try:
            amount = float(data.get('amount'))
            game = data.get('game')
            if game not in ['aviator', 'mines']:
                return jsonify({'error': 'Invalid game type'}), 400
            
            current_user.place_bet(amount, game)
            return jsonify({
                'success': True,
                'balance': current_user.balance
            })
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    @app.route('/api/record-win', methods=['POST'])
    @login_required
    def record_win():
        data = request.get_json()
        try:
            amount = float(data.get('amount'))
            game = data.get('game')
            if game not in ['aviator', 'mines']:
                return jsonify({'error': 'Invalid game type'}), 400
            
            current_user.add_win(amount, game)
            return jsonify({
                'success': True,
                'balance': current_user.balance
            })
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    @app.route('/api/record-loss', methods=['POST'])
    @login_required
    def record_loss():
        data = request.get_json()
        try:
            amount = float(data.get('amount'))
            game = data.get('game')
            if game not in ['aviator', 'mines']:
                return jsonify({'error': 'Invalid game type'}), 400
            
            current_user.register_loss(amount, game)
            return jsonify({
                'success': True,
                'balance': current_user.balance
            })
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    return app