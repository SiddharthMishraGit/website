import os
from datetime import timedelta

# Flask configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')
DEBUG = True

# Database configuration
SQLALCHEMY_DATABASE_URI = 'sqlite:///betting.db'
SQLALCHEMY_TRACK_MODIFICATIONS = False

# Session configuration
PERMANENT_SESSION_LIFETIME = timedelta(days=7)
SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
SESSION_COOKIE_HTTPONLY = True
REMEMBER_COOKIE_DURATION = timedelta(days=7)