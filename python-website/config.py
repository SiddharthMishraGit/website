import os

# Flask configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')
DEBUG = True

# Database configuration (for future use)
SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///betting.db')
SQLALCHEMY_TRACK_MODIFICATIONS = False