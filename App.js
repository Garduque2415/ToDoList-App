import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, MaterialIcons } from '@expo/vector-icons';

export default function App() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [editIndex, setEditIndex] = useState(-1);
  const [priority, setPriority] = useState('Medium');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem('tasks');
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
    } catch (error) {
      console.error('Error loading tasks', error);
    }
  };

  const saveTasks = async (tasksToSave) => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(tasksToSave));
    } catch (error) {
      console.error('Error saving tasks', error);
    }
  };

  const handleAddTask = () => {
    if (task.trim() === '') {
      Alert.alert('Error', 'Please enter a task');
      return;
    }

    const timestamp = new Date().toISOString(); // Timestamp for task creation

    if (editIndex !== -1) {
      const updatedTasks = [...tasks];
      updatedTasks[editIndex] = {
        ...updatedTasks[editIndex],
        text: task,
        priority,
      };
      setTasks(updatedTasks);
      saveTasks(updatedTasks);
      setEditIndex(-1);
    } else {
      const newTasks = [
        ...tasks,
        { text: task, completed: false, priority, createdAt: timestamp, completedAt: null },
      ];
      setTasks(newTasks);
      saveTasks(newTasks);
    }

    setTask('');
    setPriority('Medium');
    Keyboard.dismiss();
  };

  const handleEditTask = (index) => {
    setTask(tasks[index].text);
    setPriority(tasks[index].priority);
    setEditIndex(index);
  };

  const handleDeleteTask = (index) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: () => {
          const updatedTasks = tasks.filter((_, i) => i !== index);
          setTasks(updatedTasks);
          saveTasks(updatedTasks);
        },
      },
    ]);
  };

  const handleToggleComplete = (index) => {
    const updatedTasks = [...tasks];
    updatedTasks[index].completed = !updatedTasks[index].completed;

    if (updatedTasks[index].completed) {
      updatedTasks[index].completedAt = new Date().toISOString(); // Timestamp when completed
    } else {
      updatedTasks[index].completedAt = null; // Clear the completed timestamp if task is undone
    }

    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const getPriorityColor = (level) => {
    switch (level) {
      case 'Low':
        return '#8BC34A';
      case 'Medium':
        return '#FFC107';
      case 'High':
        return '#F44336';
      default:
        return '#BDBDBD';
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'All') return true;
    if (filter === 'Ongoing') return !task.completed;
    if (filter === 'Completed') return task.completed;
  });

  const renderTask = ({ item, index }) => (
    <View style={styles.taskContainer}>
      <TouchableOpacity onPress={() => handleToggleComplete(index)}>
        <MaterialIcons
          name={item.completed ? 'check-box' : 'check-box-outline-blank'}
          size={24}
          color={item.completed ? '#4CAF50' : '#757575'}
        />
      </TouchableOpacity>

      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text
          style={[
            styles.taskText,
            {
              textDecorationLine: item.completed ? 'line-through' : 'none',
              color: item.completed ? '#9E9E9E' : '#212121',
            },
          ]}
        >
          {item.text}
        </Text>
        <Text style={{ color: getPriorityColor(item.priority), fontSize: 12 }}>
          {item.priority}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: item.completed ? '#4CAF50' : '#FF9800',
            fontWeight: 'bold',
          }}
        >
          {item.completed ? 'Completed' : 'Ongoing'}
        </Text>

        {/* Display task creation and completion timestamps */}
        <Text style={{ fontSize: 10, color: '#757575' }}>
          {`Created: ${new Date(item.createdAt).toLocaleString()}`}
        </Text>
        {item.completedAt && (
          <Text style={{ fontSize: 10, color: '#757575' }}>
            {`Completed: ${new Date(item.completedAt).toLocaleString()}`}
          </Text>
        )}
      </View>

      <TouchableOpacity onPress={() => handleEditTask(index)}>
        <Feather name="edit" size={20} color="#FFA000" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handleDeleteTask(index)} style={{ marginLeft: 10 }}>
        <Feather name="trash-2" size={20} color="#F44336" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>To-Do List</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a new task"
          value={task}
          onChangeText={setTask}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
          <Text style={styles.addButtonText}>{editIndex !== -1 ? 'UPDATE' : 'ADD'}</Text>
        </TouchableOpacity>
      </View>

      {task.trim() !== '' && (
        <View style={styles.priorityContainer}>
          {['Low', 'Medium', 'High'].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.priorityButton,
                priority === level && styles.selectedPriority,
              ]}
              onPress={() => setPriority(level)}
            >
              <Text
                style={[
                  styles.priorityText,
                  priority === level && { color: 'white' },
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(_, index) => index.toString()}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="inbox" size={48} color="#ccc" />
            <Text style={{ color: '#999', marginTop: 10 }}>No tasks found</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Balanced Bottom Filter Tabs */}
      <View style={styles.bottomTabContainer}>
        {[
          { label: 'All', icon: 'list' },
          { label: 'Ongoing', icon: 'clock' },
          { label: 'Completed', icon: 'check-circle' },
        ].map(({ label, icon }) => (
          <TouchableOpacity
            key={label}
            style={[
              styles.tabButton,
              filter === label && styles.tabButtonActive,
            ]}
            onPress={() => setFilter(label)}
          >
            <Feather
              name={icon}
              size={18}
              color={filter === label ? 'white' : '#555'}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabButtonText,
                filter === label && { color: 'white' },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  priorityButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginHorizontal: 5,
  },
  selectedPriority: {
    backgroundColor: '#2196F3',
  },
  priorityText: {
    fontWeight: 'bold',
    color: '#424242',
  },
  taskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  taskText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },

  bottomTabContainer: {
    position: 'flex',
    top: -25,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    borderRadius: 15,
    paddingVertical: 16,
    paddingHorizontal: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: '#2196F3',
  },
  tabButtonText: {
    color: '#555',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabIcon: {
    marginRight: 6,
  },
});


