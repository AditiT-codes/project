import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native-web';
import { registerUser, loginUser, getTasks, addTask, updateTask, deleteTask, setReminderInterval } from './api';

const App = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [reminderIntervals, setReminderIntervals] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [intervalIds, setIntervalIds] = useState({});

  // Fetches the tasks for the logged-in user
  const fetchTasks = useCallback(async () => {
    if (token) {
      const response = await getTasks(token);
      setTasks(response.data);
    }
  }, [token]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Handles user registration
  const handleRegister = async () => {
    try {
      await registerUser(username, password);
      alert('Registration successful!');
    } catch (error) {
      alert(error.response?.data?.message || 'An unexpected error occurred. Please try again later.');
    }
  };

  // Handles user login
  const handleLogin = async () => {
    if (!username || !password) {
      alert('Username and password are required');
      return;
    }

    try {
      const response = await loginUser(username, password);
      setToken(response.data.access_token);
      setIsLoggedIn(true);
    } catch (error) {
      alert(error.response?.status === 401 ? 'Invalid credentials' : 'An unexpected error occurred. Please try again later.');
    }
  };

  // Adds a new task
  const handleAddTask = async () => {
    if (newTask) {
      await addTask(token, { name: newTask });
      setNewTask('');
      fetchTasks();
    }
  };

  // Marks a task as complete/incomplete
  const handleCompleteTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    await updateTask(token, taskId, { completed: !task.completed });
    if (!task.completed && intervalIds[taskId]) {
      clearInterval(intervalIds[taskId]);
      const updatedIntervalIds = { ...intervalIds };
      delete updatedIntervalIds[taskId];
      setIntervalIds(updatedIntervalIds);
    }
    fetchTasks();
  };

  // Deletes a task
  const handleDeleteTask = async (taskId) => {
    await deleteTask(token, taskId);
    if (intervalIds[taskId]) {
      clearInterval(intervalIds[taskId]);
      const updatedIntervalIds = { ...intervalIds };
      delete updatedIntervalIds[taskId];
      setIntervalIds(updatedIntervalIds);
    }
    fetchTasks();
  };

  // Sets a reminder interval for a task
  const handleSetReminder = async (taskId) => {
    const interval = parseInt(reminderIntervals[taskId], 10);
    if (!isNaN(interval)) {
      await setReminderInterval(token, taskId, interval);
      fetchTasks();
    } else {
      alert("Please enter a valid reminder interval.");
    }
  };

  // Shows a notification for a task reminder
  const showNotification = useCallback((task) => {
    if (Notification.permission === 'granted' && !task.completed) {
      try {
        new Notification('Task Reminder', { body: `Remember to complete: ${task.name}` });
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    } else {
      console.log('Notification permission not granted or task already completed.');
    }
  }, []);

  useEffect(() => {
    // Clears previous intervals and sets new ones based on task reminder intervals
    const clearPreviousIntervals = () => {
      Object.values(intervalIds).forEach(clearInterval);
      setIntervalIds({});
    };

    const setNewIntervals = () => {
      const newIntervalIds = {};
      tasks.forEach(task => {
        if (task.reminder_interval && !task.completed) {
          const intervalId = setInterval(() => showNotification(task), task.reminder_interval * 1000);
          newIntervalIds[task.id] = intervalId;
        }
      });
      setIntervalIds(newIntervalIds);
    };

    clearPreviousIntervals();
    setNewIntervals();

    return clearPreviousIntervals;
  }, [tasks, showNotification]);

  useEffect(() => {
    // Requests notification permission on initial load
    Notification.requestPermission().then(permission => {
      if (permission !== 'granted') {
        console.log('Notification permission denied.');
      }
    });
  }, []);

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button title="Register" onPress={handleRegister} />
        <Button title="Login" onPress={handleLogin} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="New Task"
        value={newTask}
        onChangeText={setNewTask}
      />
      <Button title="Add Task" onPress={handleAddTask} />
      <FlatList
  data={tasks}
  keyExtractor={(item) => item.id.toString()}
  renderItem={({ item }) => (
    <View style={styles.taskContainer}>
      <Text style={item.completed ? styles.completedTask : styles.task}>{item.name}</Text>
      <TextInput
        style={styles.reminderInput}
        placeholder="Reminder Interval (seconds)"
        value={reminderIntervals[item.id] || ''}
        onChangeText={(text) => setReminderIntervals(prev => ({ ...prev, [item.id]: text }))}
      />
      <Button title="Set Reminder" onPress={() => handleSetReminder(item.id)} />
      <Button title="Complete" onPress={() => handleCompleteTask(item.id)} />
      <Button title="Delete" onPress={() => handleDeleteTask(item.id)} />
    </View>
  )}
/>
</View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',  // Center the main container content
  },
  input: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    width: '80%',  // Make the input field take 80% of the container width
  },
  taskContainer: {
    flexDirection: 'column',  // Change to column to stack items vertically
    justifyContent: 'center', // Center items vertically
    alignItems: 'center',     // Center items horizontally
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '80%',  // Make the task container take 80% of the container width
  },
  task: {
    fontSize: 16,
    textAlign: 'center',  // Center the task text
  },
  completedTask: {
    fontSize: 16,
    textDecorationLine: 'line-through',
    color: '#999',
    textAlign: 'center',  // Center the completed task text
  },
  reminderInput: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    width: '80%',  // Make the reminder input field take 80% of the container width
    textAlign: 'center', // Center the text inside the input
  },
});


export default App;
