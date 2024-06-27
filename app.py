from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_restful import Api, Resource
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from flask_cors import CORS
from flask_migrate import Migrate
import os

# Configuration
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your_secret_key'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///tasks.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'your_jwt_secret_key'

# Initialize Flask app and extensions
app = Flask(__name__)
cors = CORS(app, origins=["*"])
app.config.from_object(Config)
db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
api = Api(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    reminder_interval = db.Column(db.Integer, nullable=True)

# Resources
class UserRegister(Resource):
    def post(self):
        data = request.get_json()
        if not data or 'username' not in data or 'password' not in data:
            return {'message': 'Username and password are required'}, 400
        if User.query.filter_by(username=data['username']).first():
            return {'message': 'User already exists'}, 400
        
        hashed_password = generate_password_hash(data['password'])
        new_user = User(username=data['username'], password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        return {'message': 'User created successfully'}, 201

class UserLogin(Resource):
    def post(self):
        data = request.get_json()
        user = User.query.filter_by(username=data['username']).first()
        if not user or not check_password_hash(user.password, data['password']):
            return {'message': 'Invalid credentials'}, 401
        access_token = create_access_token(identity=user.id)
        return {'access_token': access_token}, 200

class TaskList(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        tasks = Task.query.filter_by(user_id=user_id).all()
        return jsonify([{"id": task.id, "name": task.name, "completed": task.completed, "reminder_interval": task.reminder_interval} for task in tasks])

    @jwt_required()
    def post(self):
        data = request.get_json()
        user_id = get_jwt_identity()
        new_task = Task(name=data['name'], user_id=user_id)
        db.session.add(new_task)
        db.session.commit()
        return jsonify({"id": new_task.id, "name": new_task.name, "completed": new_task.completed, "reminder_interval": new_task.reminder_interval})

class TaskResource(Resource):
    @jwt_required()
    def put(self, task_id):
        data = request.get_json()
        task = Task.query.get(task_id)
        if not task or task.user_id != get_jwt_identity():
            return {'message': 'Task not found or not authorized'}, 404
        task.name = data.get('name', task.name)
        task.completed = data.get('completed', task.completed)
        task.reminder_interval = data.get('reminder_interval', task.reminder_interval)
        db.session.commit()
        return jsonify({"id": task.id, "name": task.name, "completed": task.completed, "reminder_interval": task.reminder_interval})

    @jwt_required()
    def delete(self, task_id):
        task = Task.query.get(task_id)
        if not task or task.user_id != get_jwt_identity():
            return {'message': 'Task not found or not authorized'}, 404
        
        db.session.delete(task)
        db.session.commit()
        return '', 204

class TaskReminder(Resource):
    @jwt_required()
    def put(self, task_id):
        data = request.get_json()
        task = Task.query.get(task_id)
        if not task or task.user_id != get_jwt_identity():
            return {'message': 'Task not found or not authorized'}, 404
        task.reminder_interval = data.get('reminder_interval', task.reminder_interval)
        db.session.commit()
        return jsonify({"id": task.id, "name": task.name, "completed": task.completed, "reminder_interval": task.reminder_interval})

# Routes
api.add_resource(UserRegister, '/register')
api.add_resource(UserLogin, '/login')
api.add_resource(TaskList, '/tasks')
api.add_resource(TaskResource, '/tasks/<int:task_id>')
api.add_resource(TaskReminder, '/tasks/<int:task_id>/reminder')

if __name__ == '__main__':
    app.run(debug=True)
