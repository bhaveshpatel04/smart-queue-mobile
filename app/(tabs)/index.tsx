import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import Animated, { Layout } from 'react-native-reanimated';
import { TextInput, Button, Card, Appbar, Avatar, Snackbar, ActivityIndicator } from 'react-native-paper';
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, addDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, DocumentData, getDocs
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDLxSlgVdTgmidpAb7vZi7F_CT8aI4tJEE",
  authDomain: "smartqueue-840b4.firebaseapp.com",
  projectId: "smartqueue-840b4",
  storageBucket: "smartqueue-840b4.appspot.com", // corrected `.app` to `.appspot.com`
  messagingSenderId: "1091609306611",
  appId: "1:1091609306611:web:e4f8cc565583ab9ad0de86",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const queueRef = collection(db, "queue");

export default function App() {
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [queue, setQueue] = useState<DocumentData[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [isAdmin, setIsAdmin] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  const themeColors = darkMode ? { background: '#121212', card: '#1E1E1E', text: '#ffffff' } : { background: '#ffffff', card: '#ffffff', text: '#000000' };

  useEffect(() => {
    const q = query(queueRef, orderBy("timestamp"));
    const unsub = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQueue(data);
    });
    return () => unsub();
  }, []);

  const getWaitTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
  };

  const joinQueue = async () => {
    let valid = true;
    setNameError(null);
    setPhoneError(null);

    if (!name.trim()) {
      setNameError("Name is required.");
      valid = false;
    }

    if (!/^\d{10}$/.test(phone)) {
      setPhoneError("Phone must be 10 digits.");
      valid = false;
    }

    if (!valid) return;

    if (phone === '9999999999') {
      if (name.toLowerCase() === 'admin123') {
        setIsAdmin(true);
        setSnackbar({ visible: true, message: "Logged in as admin." });
      } else {
        setSnackbar({ visible: true, message: "Incorrect admin password." });
      }
      return;
    }

    setLoading(true);
    try {
      const docRef = await addDoc(queueRef, {
        name,
        phone,
        avatar: profileAvatar,
        timestamp: Date.now()
      });
      setUserId(docRef.id);
      setSnackbar({ visible: true, message: "You have joined the queue!" });
    } catch (error) {
      setSnackbar({ visible: true, message: "Error joining the queue." });
    } finally {
      setLoading(false);
    }
  };

  const leaveQueue = async () => {
    if (userId) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, "queue", userId));
        setUserId(null);
        setSnackbar({ visible: true, message: "You have left the queue." });
      } catch (error) {
        setSnackbar({ visible: true, message: "Error leaving the queue." });
      } finally {
        setLoading(false);
      }
    }
  };

  const position = queue.findIndex((u) => u.id === userId) + 1;

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <Appbar.Header style={{ backgroundColor: '#2196f3', elevation: 4 }}>
        <Appbar.Content title="Smart Queue" />
        <Appbar.Action icon={darkMode ? "weather-sunny" : "weather-night"} onPress={() => setDarkMode(!darkMode)} />
      </Appbar.Header>
      <View style={{ padding: 20, flex: 1, justifyContent: 'center' }}>
        {!userId ? (
          <>
            <Button
              icon="camera"
              mode="outlined"
              onPress={() => {
                // Simulated avatar upload
                const avatars = ["👩", "🧑", "👨", "🧔", "👩‍🦰"];
                const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
                setProfileAvatar(randomAvatar);
              }}
              style={{ marginBottom: 12 }}
            >
              {profileAvatar ? `Avatar Selected: ${profileAvatar}` : "Choose Avatar"}
            </Button>
            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              error={!!nameError}
              style={{ marginBottom: 12, backgroundColor: '#f5f5f5' }}
              theme={{ roundness: 10 }}
            />
            {nameError && <Text style={{ color: 'red', marginBottom: 10 }}>{nameError}</Text>}
            <TextInput
              label="Phone"
              value={phone}
              onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ""))}
              keyboardType="numeric"
              error={!!phoneError}
              style={{ marginBottom: 12, backgroundColor: '#f5f5f5' }}
              theme={{ roundness: 10 }}
            />
            {phoneError && <Text style={{ color: 'red', marginBottom: 10 }}>{phoneError}</Text>}
            <Button
              icon="login"
              mode="contained"
              onPress={joinQueue}
              disabled={!name || !phone || loading}
              style={{ backgroundColor: '#2196f3', borderRadius: 10 }}
              contentStyle={{ paddingVertical: 10 }}
              labelStyle={{ fontSize: 16 }}
            >
              {loading ? <ActivityIndicator animating color="white" /> : "Join Queue"}
            </Button>
          </>
        ) : (
          <Card style={{ borderRadius: 10, marginVertical: 8, padding: 12, backgroundColor: themeColors.card, elevation: 3 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: themeColors.text }}>You're in the queue!</Text>
            <Text style={{ fontWeight: '600', color: themeColors.text }}>Your position: {position}</Text>
            <Button
              icon="logout"
              mode="outlined"
              onPress={leaveQueue}
              style={{ marginTop: 10, borderColor: '#d32f2f' }}
              labelStyle={{ color: '#d32f2f' }}
            >
              Leave Queue
            </Button>
          </Card>
        )}

        {isAdmin && (
          <>
            <TextInput
              placeholder="Search by name or phone"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ marginBottom: 12, backgroundColor: '#f5f5f5' }}
              left={<TextInput.Icon icon="magnify" />}
            />
            <Card style={{ borderRadius: 10, marginVertical: 8, padding: 12, backgroundColor: '#e3f2fd' }}>
              <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>Admin Panel</Text>
              <Button
                icon="delete"
                mode="contained"
                buttonColor="#ff7043"
                onPress={async () => {
                  try {
                    const q = query(queueRef);
                    const snapshot = await getDocs(q);
                    snapshot.forEach(async (docSnap) => {
                      await deleteDoc(docSnap.ref);
                    });
                    setSnackbar({ visible: true, message: "Queue cleared." });
                  } catch (err) {
                    setSnackbar({ visible: true, message: "Error clearing queue." });
                  }
                }}
              >
                Clear Queue
              </Button>
            </Card>
          </>
        )}

        <Text style={{ fontSize: 20, fontWeight: '700', marginTop: 20, marginBottom: 10, color: themeColors.text }}>Current Queue</Text>
        <FlatList
          data={queue.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.phone.includes(searchQuery)
          )}
          keyExtractor={(item: DocumentData) => item.id}
          renderItem={({ item, index }: { item: DocumentData; index: number }) => (
          <Animated.View
            entering={Animated.FadeIn.duration(300)}
            exiting={Animated.FadeOut.duration(300)}
            layout={Animated.Layout.springify()}
          >
              <Card style={{ borderRadius: 10, marginVertical: 8, padding: 12, backgroundColor: themeColors.card, elevation: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Avatar.Text size={40} label={item.avatar || item.name?.charAt(0)} style={{ backgroundColor: '#2196f3' }} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={{ fontSize: 16, color: themeColors.text }}>{index + 1}. {item.name}</Text>
                    <Text style={{ color: 'gray' }}>{item.phone}</Text>
                    <Text style={{ color: 'gray', fontSize: 12 }}>Joined {getWaitTime(item.timestamp)}</Text>
                    <Text style={{ color: 'gray', fontSize: 12 }}>
                      Estimated wait: {Math.round((Date.now() - item.timestamp) / 1000 / 60) + (index * 2)} mins
                    </Text>
                  </View>
                </View>
              </Card>
            </Animated.View>
          )}
        />
      </View>
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
      >
        <Text>{snackbar.message}</Text>
      </Snackbar>
    </View>
  );
}