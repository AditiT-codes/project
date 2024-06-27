import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native-web';
// import { setReminder } from './api'; // Import appropriate function for setting reminders

const SetReminder = ({ taskId }) => {
  const [reminderTime, setReminderTime] = useState('');

  const handleSetReminder = async () => {
    // Perform validation if needed
    await setReminder(taskId, reminderTime); // Implement this function in your API file
    setReminderTime(''); // Clear reminder time after setting
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DDTHH:MM:SS"
        value={reminderTime}
        onChangeText={setReminderTime}
      />
      <Button title="Set Reminder" onPress={handleSetReminder} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
  },
});

export default SetReminder;
