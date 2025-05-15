# python-website

This is a simple web application built using Python and Flask. The project serves as a template for creating a dynamic website with a structured directory layout.

## Project Structure

```
python-website
├── src
│   ├── app.py
│   ├── templates
│   │   ├── base.html
│   │   └── index.html
│   ├── static
│   │   ├── css
│   │   │   └── style.css
│   │   └── js
│   │       └── main.js
│   ├── models
│   │   └── __init__.py
│   ├── routes
│   │   └── __init__.py
│   └── utils
│       └── __init__.py
├── requirements.txt
├── config.py
└── README.md
```

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd python-website
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**:
   ```bash
   python src/app.py
   ```

## Usage

- Navigate to `http://localhost:5000` in your web browser to view the homepage.
- The application includes routes for various pages, which can be extended as needed.

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.