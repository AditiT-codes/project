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

  const fetchTasks = useCallback(async () => {
    const response = await getTasks(token);
    setTasks(response.data);
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token, fetchTasks]);

  const handleRegister = async () => {
    try {
      await registerUser(username, password);
      alert('Registration successful!');
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      } else {
        console.error('Error during registration:', error.message);
        alert('An unexpected error occurred. Please try again later.');
      }
    }
  };

  const handleLogin = async () => {
    try {
      const response = await loginUser(username, password);
      setToken(response.data.access_token);
      setIsLoggedIn(true);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        alert('Invalid credentials');
      } else {
        console.error('Error during login:', error.message);
        alert('An unexpected error occurred. Please try again later.');
      }
    }
  };

  const handleAddTask = async () => {
    await addTask(token, { name: newTask });
    setNewTask('');
    fetchTasks();
  };

  const handleCompleteTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    await updateTask(token, taskId, { completed: !task.completed });

    // Clear reminder interval for completed task
    if (intervalIds[taskId]) {
      clearInterval(intervalIds[taskId]);
      const newIntervalIds = { ...intervalIds };
      delete newIntervalIds[taskId];
      setIntervalIds(newIntervalIds);
    }

    fetchTasks();
  };

  const handleDeleteTask = async (taskId) => {
    await deleteTask(token, taskId);

    // Clear reminder interval for deleted task
    if (intervalIds[taskId]) {
      clearInterval(intervalIds[taskId]);
      const newIntervalIds = { ...intervalIds };
      delete newIntervalIds[taskId];
      setIntervalIds(newIntervalIds);
    }

    fetchTasks();
  };

  const handleSetReminder = async (taskId) => {
    const interval = reminderIntervals[taskId];
    if (interval) {
      await setReminderInterval(token, taskId, parseInt(interval));
      fetchTasks();
    } else {
      alert("Please enter a valid reminder interval.");
    }
  };

  // Change: Added check to ensure notifications are not shown for completed tasks
  const showNotification = useCallback((task) => {
    if (Notification.permission === 'granted' && !task.completed) {
      new Notification('Task Reminder', { body: `Remember to complete: ${task.name}` });
    }
  }, []);

  useEffect(() => {
    const clearPreviousIntervals = () => {
      Object.values(intervalIds).forEach(clearInterval);
      setIntervalIds({});
    };

    const setNewIntervals = () => {
      const newIntervalIds = {};
      tasks.forEach(task => {
        if (task.reminder_interval && !task.completed) { // Ensure only active tasks have reminders
          const intervalId = setInterval(() => {
            showNotification(task);
          }, task.reminder_interval * 1000); // Convert to milliseconds
          newIntervalIds[task.id] = intervalId;
        }
      });
      setIntervalIds(newIntervalIds);
    };

    clearPreviousIntervals();
    setNewIntervals();

    return () => {
      clearPreviousIntervals();
    };
  }, [tasks, showNotification]);

  useEffect(() => {
    const requestNotificationPermission = async () => {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied.');
      }
    };

    requestNotificationPermission();
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
              style={styles.input}
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
  },
  input: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
  },
  taskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  task: {
    fontSize: 16,
  },
  completedTask: {
    fontSize: 16,
    textDecorationLine: 'line-through',
    color: '#999',
  },
});

export default App;
