import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  // --- NAVIGATION & USER STATE ---
  const [screen, setScreen] = useState('splash');
  const [userName, setUserName] = useState('');
  const [age, setAge] = useState('');
  const [progress, setProgress] = useState(0); 
  const [adminVisible, setAdminVisible] = useState(false);
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState('lesson'); 
  
  // --- BOT & GUARDIAN STATE ---
  const [botMsg, setBotMsg] = useState("Greetings! I am the Heavenly Guardian.");
  const [showAlt, setShowAlt] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMsgs, setChatMsgs] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  const sound = useRef(new Audio.Sound());
  const ADMIN_PIN = "2026"; 

  // --- TRAINED GUARDIAN DICTIONARY (AI Filter) ---
  const BANNED_VOCAB = ['fuck', 'shit', 'idiot', 'stupid', 'curse', 'hate', 'rude', 'fool'];

  // --- SUPERVISOR CONTENT (News, Prayer, Activities) ---
  const [classContent, setClassContent] = useState({
    '2-5': { news: "Morning Prayer", prayer: "God is Love.", activity: "Picture Puzzle" },
    '6-9': { news: "Sunday Picnic", prayer: "Lord, help me obey.", story: "David & Goliath" },
    '10-12': { news: "Trivia Night", prayer: "Guide my path.", facts: "Paul wrote 13 books.", team: "Memory Verse Relay" },
    '13-15': { news: "Youth Seminar", prayer: "Guard my heart.", discussion: "Peer Pressure", activity: "Trust Fall", presentation: "Skit" },
    '16-18': { news: "Mission Trip", prayer: "Use me, Lord.", outdoor: "Street Ministry", ministry: "Digital Evangelism" }
  });

  // --- RELIGIOUS AI QUIZ DATABASE (Story & Verse Based) ---
  const bibleQuizzes = [
    { passage: "In the beginning, God created the heavens and the earth.", q: "Who created the world?", a: "God", options: ["God", "Adam", "Moses"] },
    { passage: "The Lord is my shepherd; I shall not want.", q: "Who is our Shepherd?", a: "The Lord", options: ["David", "The Lord", "Paul"] }
  ];
  const altBibleQuizzes = [
    { passage: "Jesus wept.", q: "Who wept?", a: "Jesus", options: ["Peter", "Jesus", "John"] },
    { passage: "For God so loved the world...", q: "Did God love the world?", a: "Yes", options: ["Yes", "No", "Maybe"] }
  ];

  useEffect(() => {
    if (screen === 'splash') setTimeout(() => setScreen('login'), 2000);
    checkDailyProgress();
  }, [screen]);

  const checkDailyProgress = async () => {
    const today = new Date().toLocaleDateString();
    const lastDate = await AsyncStorage.getItem('last_reset');
    if (lastDate !== today) {
      await AsyncStorage.setItem('daily_points', '0');
      await AsyncStorage.setItem('last_reset', today);
    }
  };

  const playVoice = async (isCorrect) => {
    const uri = isCorrect ? 'https://www.soundjays.com/buttons/button-3.mp3' : 'https://www.soundjays.com/buttons/button-10.mp3';
    try {
      await sound.current.unloadAsync();
      await sound.current.loadAsync({ uri });
      await sound.current.playAsync();
    } catch (e) { console.log("Audio Error"); }
  };

  const handleReligiousQuiz = async (selected) => {
    const dailyPoints = parseInt(await AsyncStorage.getItem('daily_points') || '0');
    const correct = showAlt ? altBibleQuizzes[currentQIndex].a : bibleQuizzes[currentQIndex].a;

    if (selected === correct) {
      if (dailyPoints >= 2) {
        setBotMsg("⚠️ Daily Limit: You have earned your 2 points! Come back in 24 hours.");
        return;
      }
      playVoice(true); // "Good"
      setBotMsg("✅ GOOD!");
      await AsyncStorage.setItem('daily_points', (dailyPoints + 1).toString());
      setProgress(p => p + 1);
      setShowAlt(false);
      setCurrentQIndex(i => (i + 1) % bibleQuizzes.length);
    } else {
      playVoice(false); // "Try Again"
      setBotMsg("❌ TRY AGAIN! Here is a simpler verse.");
      setShowAlt(true);
    }
  };

  const sendRegulatedChat = () => {
    let text = chatInput;
    BANNED_VOCAB.forEach(word => {
      const regex = new RegExp(word, 'gi');
      text = text.replace(regex, '****');
    });
    setChatMsgs([{ user: userName, msg: text, time: new Date().toLocaleTimeString() }, ...chatMsgs]);
    setChatInput('');
  };

  if (screen === 'splash') return <View style={styles.splash}><Text style={styles.splashTitle}>F.G.C.K.</Text></View>;

  if (screen === 'login') return (
    <View style={styles.container}>
      <Text style={styles.header}>F.G.C.K. Sunday School</Text>
      <TextInput style={styles.input} placeholder="Child's Name" onChangeText={setUserName} />
      <TextInput style={styles.input} placeholder="Age" keyboardType="numeric" onChangeText={setAge} />
      <TouchableOpacity style={styles.btn} onPress={() => setScreen('main')}><Text style={styles.btnText}>ENTER</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => setAdminVisible(true)} style={styles.adminLink}><Text style={{color:'#CCC'}}>Teacher Dashboard</Text></TouchableOpacity>
    </View>
  );

  const currentAge = parseInt(age);
  const group = currentAge <= 5 ? '2-5' : currentAge <= 9 ? '6-9' : currentAge <= 12 ? '10-12' : currentAge <= 15 ? '13-15' : '16-18';
  const data = classContent[group];
  const quiz = showAlt ? altBibleQuizzes[currentQIndex] : bibleQuizzes[currentQIndex];

  return (
    <View style={{flex: 1, backgroundColor: '#FFF'}}>
      {/* ADMIN COMMAND CENTER */}
      <Modal visible={adminVisible}>
        <View style={styles.adminPanel}>
          {!isAdminAuth ? (
            <View style={{flex:1, justifyContent:'center', padding:40}}>
              <Text style={styles.header}>SECRET PIN ENQUIRY</Text>
              <TextInput style={styles.input} secureTextEntry onChangeText={setPin} />
              <TouchableOpacity style={styles.btn} onPress={() => pin === ADMIN_PIN ? setIsAdminAuth(true) : Alert.alert("Denied")}><Text style={styles.btnText}>VERIFY</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setAdminVisible(false)}><Text style={{textAlign:'center', marginTop:20}}>Exit</Text></TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={{padding: 20}}>
              <Text style={styles.header}>Supervisor Hub</Text>
              <Text style={styles.label}>1. Choose Age Group to Update:</Text>
              <View style={styles.tabRow}>
                {Object.keys(classContent).map(g => (
                  <TouchableOpacity key={g} onPress={() => setAge(g.split('-')[1])} style={styles.mBtn}><Text>{g}</Text></TouchableOpacity>
                ))}
              </View>
              
              <TextInput style={styles.input} placeholder="Class News" onChangeText={v => setClassContent({...classContent, [group]: {...classContent[group], news: v}})} />
              <TextInput style={styles.input} placeholder="Today's Prayer" onChangeText={v => setClassContent({...classContent, [group]: {...classContent[group], prayer: v}})} />
              
              <Text style={styles.label}>2. Oversight Actions:</Text>
              <TouchableOpacity style={styles.viewBtn} onPress={() => {setAdminVisible(false); setIsAdminAuth(false);}}><Text style={{color:'white'}}>MOVE TO {group} CLASSROOM (VERIFY)</Text></TouchableOpacity>
              
              <TouchableOpacity style={styles.btn} onPress={() => {setAdminVisible(false); setIsAdminAuth(false);}}><Text style={styles.btnText}>SAVE & PUBLISH</Text></TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* STUDENT MAIN VIEW */}
      <View style={styles.topBar}>
        <Text style={styles.welcome}>Hi, {userName}!</Text>
        <Text style={styles.progLabel}>Heavenly Points: {progress} (2/Day Max)</Text>
      </View>

      <ScrollView style={styles.main}>
        {activeTab === 'lesson' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.sec}>📣 CLASS UPDATES</Text>
              <Text>{data.news}</Text>
              <Text style={styles.prayer}>🙏 {data.prayer}</Text>
            </View>

            <View style={styles.botCard}>
              <Text style={styles.botTag}>🤖 HEAVENLY GUARDIAN BOT</Text>
              <Text style={styles.botMsg}>{botMsg}</Text>
              <View style={styles.bibleBox}><Text style={styles.passage}>"{quiz.passage}"</Text></View>
              <Text style={styles.qText}>{quiz.q}</Text>
              {quiz.options.map(c => (
                <TouchableOpacity key={c} style={styles.choice} onPress={() => handleReligiousQuiz(c)}><Text>{c}</Text></TouchableOpacity>
              ))}
            </View>

            {(currentAge >= 13) && (
              <View style={styles.chatCard}>
                <Text style={styles.sec}>💬 Regulated Youth Chat</Text>
                <ScrollView style={{height: 120}}>{chatMsgs.map((m,i)=><Text key={i} style={styles.msg}>[{m.time}] **{m.user}**: {m.msg}</Text>)}</ScrollView>
                <TextInput style={styles.input} value={chatInput} onChangeText={setChatInput} placeholder="Say something holy..." />
                <TouchableOpacity onPress={sendRegulatedChat} style={styles.miniBtn}><Text style={{color:'white'}}>Send</Text></TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <WebView source={{ uri: 'https://www.bible.com/' }} style={{height: 500}} />
        )}
      </ScrollView>

      {/* FOOTER NAVIGATION */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.navBtn, activeTab === 'lesson' && styles.activeNav]} onPress={() => setActiveTab('lesson')}><Text>Classroom</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.navBtn, activeTab === 'bible' && styles.activeNav]} onPress={() => setActiveTab('bible')}><Text>Bible Tab</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FF8C00' },
  splashTitle: { color: 'white', fontSize: 60, fontWeight: 'bold' },
  container: { flex: 1, padding: 40, justifyContent: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { borderBottomWidth: 1, borderColor: '#EEE', padding: 10, marginBottom: 20 },
  btn: { backgroundColor: '#FF8C00', padding: 18, borderRadius: 10, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
  topBar: { padding: 30, paddingTop: 60, backgroundColor: '#FFF', elevation: 3 },
  welcome: { fontSize: 20, fontWeight: 'bold' },
  progLabel: { fontSize: 10, color: '#4CAF50' },
  main: { padding: 15 },
  card: { backgroundColor: '#F9F9F9', padding: 20, borderRadius: 20, marginBottom: 15 },
  sec: { fontWeight: 'bold', color: '#FF8C00', marginBottom: 5 },
  botCard: { backgroundColor: '#FFF3E0', padding: 20, borderRadius: 20 },
  botTag: { fontSize: 10, fontWeight: 'bold', color: '#E65100' },
  botMsg: { marginVertical: 8, fontWeight: 'bold' },
  bibleBox: { backgroundColor: '#FFF', padding: 10, borderRadius: 10, marginVertical: 10, borderLeftWidth: 4, borderColor: '#FF8C00' },
  passage: { fontStyle: 'italic', color: '#555' },
  qText: { marginBottom: 15, fontWeight: 'bold' },
  choice: { backgroundColor: '#FFF', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#FF8C00' },
  chatCard: { backgroundColor: '#F0F0F0', padding: 20, borderRadius: 20, marginTop: 20 },
  msg: { fontSize: 12, marginBottom: 5 },
  miniBtn: { backgroundColor: '#FF8C00', padding: 10, borderRadius: 5, alignItems: 'center' },
  footer: { height: 80, flexDirection: 'row', borderTopWidth: 1, borderColor: '#EEE' },
  navBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  activeNav: { backgroundColor: '#FFF3E0' },
  adminPanel: { flex: 1, backgroundColor: '#FFF' },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  mBtn: { padding: 10, margin: 5, backgroundColor: '#EEE', borderRadius: 5 },
  viewBtn: { backgroundColor: '#333', padding: 15, borderRadius: 10, marginBottom: 20, alignItems: 'center' },
  label: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 10 },
  prayer: { marginTop: 10, fontStyle: 'italic' }
});
