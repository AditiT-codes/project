import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native-web';
import { registerUser, loginUser, getTasks, addTask, updateTask, deleteTask, setReminderIntervall } from './api';



const App = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [reminderInterval, setReminderInterval] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [intervalIds, setIntervalIds] = useState([]);





  const fetchTasks = useCallback(async () => {
    const response = await getTasks(token);
    setTasks(response.data);
  }, [token]);


  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token, fetchTasks]);


  // const handleRegister = async () => {
  //   await registerUser(username, password);
  // };
  const handleRegister = async () => {
    try {
      await registerUser(username, password);
      // Registration successful, show message or handle accordingly
      alert('Registration successful!');
    } catch (error) {
      // Handle registration errors here
      if (error.response) {
        // Server responded with an error status code (4xx or 5xx)
        alert(error.response.data.message); // Display the error message from the server
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error during registration:', error.message);
        alert('An unexpected error occurred. Please try again later.');
      }
    }
  };

  const handleLogin = async () => {
    const response = await loginUser(username, password);
    setToken(response.data.access_token);
    setIsLoggedIn(true);
  };

  const handleAddTask = async () => {
    await addTask(token, { name: newTask });
    setNewTask('');
    fetchTasks();
  };

  const handleCompleteTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    await updateTask(token, taskId, { completed: !task.completed });
    fetchTasks();
  };

  const handleDeleteTask = async (taskId) => {
    await deleteTask(token, taskId);
    fetchTasks();
  };

  const handleSetReminder = async (taskId) => {
    const data = await setReminderIntervall(token, taskId, parseInt(reminderInterval));
    console.log(data)
    setReminderInterval('');
    fetchTasks();
  };

  const showNotification = useCallback((task) => {
    if (Notification.permission === 'granted') {
      new Notification(`Task Reminder`, { body: `Remember to complete: ${task.name}` });
    }
  }, []);

  // useEffect(() => {
  //   intervalIds.forEach(clearInterval); // Clear previous intervals

  //   const newIntervalIds = tasks.map(task => {
  //     if (task.reminder_interval && !task.completed) {
  //       return setInterval(() => {
  //         showNotification(task);
  //       }, task.reminder_interval * 1000); // Convert to milliseconds
  //     }
  //     return null;
  //   }).filter(id => id !== null);

  //   setIntervalIds(newIntervalIds);

  //   return () => {
  //     newIntervalIds.forEach(clearInterval); // Clean up intervals on unmount
  //   };
  // }, [tasks, intervalIds]);
  useEffect(() => {
    intervalIds.forEach(clearInterval); // Clear previous intervals
    const newIntervalIds = tasks.map(task => {
      if (task.reminder_interval && !task.completed) {
        return setInterval(() => {
          showNotification(task);
        }, task.reminder_interval * 1000); // Convert to milliseconds
      }
      return null;
    }).filter(id => id !== null);
  
    setIntervalIds(newIntervalIds);
  
    return () => {
      newIntervalIds.forEach(clearInterval); // Clean up intervals on unmount
    };
  }, [tasks, showNotification]);



  // useEffect(() => {
  //   if (Notification.permission !== 'granted') {
  //     Notification.requestPermission();
  //   }
  // }, []);
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
              value={reminderInterval}
              onChangeText={setReminderInterval}
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