# Bookio

**Bookio** is a fully functional web platform designed for reading and creating ebooks. This project was developed as a comprehensive Full Stack application, leveraging a robust Python backend connected to a relational database managed in the cloud.

🌍 **[View Live Project Here](https://bookio-bfpf.onrender.com)**

## 🚀 Key Features

* **Secure Authentication:** User registration and login system featuring encrypted password hashing.
* **Ebook Management:** Smooth interface for browsing, reading, and publishing digital books.
* **Email Notifications:** Built-in SMTP integration for automated email dispatch (confirmations, alerts, etc.).
* **Relational Database:** A solid database schema designed to manage users, books, and reading sessions seamlessly.

## 🛠️ Tech Stack

### Backend & Core Logic
* **Python:** Core programming language.
* **Flask:** Lightweight WSGI web application framework for routing and API management.
* **Werkzeug:** Advanced security utilities for safe password hashing and verification.
* **MySQL Connector:** Official driver for stable communication with the database.

### Database & Cloud Deployment
* **Aiven (Cloud MySQL):** 100% cloud-hosted and managed MySQL database instance.
* **DBeaver:** Database administration tool used for Entity-Relationship modeling and script executions.
* **Render:** Cloud application hosting platform for Continuous Deployment (CI/CD).
* **Gunicorn:** Python WSGI HTTP Server used for running the application efficiently in production.

### Frontend
* **HTML5 & CSS3:** Responsive UI layout, styling, and design.

## 📁 Repository Structure

* `/templates`: HTML files for all views (Login, Register, Dashboard, Library, etc.).
* `/static`: CSS stylesheets, media assets, and frontend scripts.
* `app.py`: Main backend entry point handling the Flask server configuration and database routing.
* `requirements.txt`: Flat list of required dependencies for environment reproduction in production.

## 🛠️ Local Installation & Setup

To clone and run this project in your local development environment, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/YourUsername/Bookio.git](https://github.com/YourUsername/Bookio.git)
   ```
2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   ```
## On Windows:
  ```bash
  .\venv\Scripts\activate
  ```
## On macOS/Linux:
  ```bash
  source venv/bin/activate
  ```
3. **Install the required dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Configure the Database:**
  - Set up a local or cloud-hosted MySQL database.
  - Import your .sql structure script.
  - Update the cloud credentials in the db_config dictionary inside app.py.

5. **Run the development server:**
  ```bash
  python app.py
  ```
Open your browser and navigate to http://127.0.0.1:5000
