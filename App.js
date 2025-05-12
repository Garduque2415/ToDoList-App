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
      Alert.alert('Please enter a task');
      return;
    }

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
      const newTasks = [...tasks, { text: task, completed: false, priority }];
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
      </View>

      <TouchableOpacity onPress={() => handleEditTask(index)}>
        <Feather name="edit" size={20} color="#FFA000" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handleDeleteTask(index)} style={{ marginLeft: 10 }}>
        <Feather name="trash-2" size={20} color="#F44336" />
      </TouchableOpacity>
    </View>
  );

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'All') return true;
    if (filter === 'Ongoing') return !t.completed;
    if (filter === 'Completed') return t.completed;
  });

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

      {/* Priority shown only when typing */}
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

      {/* Filtering is always visible */}
      <View style={styles.filterContainer}>
        {['All', 'Ongoing', 'Completed'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterButton,
              filter === type && styles.filterSelected,
            ]}
            onPress={() => setFilter(type)}
          >
            <Text
              style={[
                styles.filterText,
                filter === type && { color: 'white' },
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
      />
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
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  filterButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginHorizontal: 5,
  },
  filterSelected: {
    backgroundColor: '#2196F3',
  },
  filterText: {
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
});

