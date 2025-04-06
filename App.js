import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { TextInput, Button, Card } from 'react-native-paper';
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, addDoc, deleteDoc,
  doc, onSnapshot, query, orderBy
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const queueRef = collection(db, "queue");

export default function App() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [queue, setQueue] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const q = query(queueRef, orderBy("timestamp"));
    const unsub = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQueue(data);
    });
    return () => unsub();
  }, []);

  const joinQueue = async () => {
    const docRef = await addDoc(queueRef, {
      name, phone, timestamp: Date.now()
    });
    setUserId(docRef.id);
  };

  const leaveQueue = async () => {
    if (userId) {
      await deleteDoc(doc(db, "queue", userId));
      setUserId(null);
    }
  };

  const position = queue.findIndex((u) => u.id === userId) + 1;

  return (
    <View style={{ padding: 20, flex: 1 }}>
      {!userId ? (
        <>
          <TextInput label="Name" value={name} onChangeText={setName} style={{ marginBottom: 10 }} />
          <TextInput label="Phone" value={phone} onChangeText={setPhone} style={{ marginBottom: 10 }} />
          <Button mode="contained" onPress={joinQueue} disabled={!name || !phone}>
            Join Queue
          </Button>
        </>
      ) : (
        <Card style={{ padding: 10, marginVertical: 10 }}>
          <Text style={{ fontSize: 18 }}>You're in the queue!</Text>
          <Text>Your position: {position}</Text>
          <Button mode="outlined" onPress={leaveQueue} style={{ marginTop: 10 }}>
            Leave Queue
          </Button>
        </Card>
      )}

      <Text style={{ fontSize: 18, marginTop: 20 }}>Current Queue:</Text>
      <FlatList
        data={queue}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Text>{index + 1}. {item.name}</Text>
        )}
      />
    </View>
  );
}