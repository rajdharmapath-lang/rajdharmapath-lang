import React, {useState} from 'react';
import {SafeAreaView, Text, Pressable, StyleSheet, View} from 'react-native';
import {ChineseStrokeWriter, HSK500_CHARACTERS} from '../src';

export default function StrokePracticeScreen() {
  const [index, setIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const character = HSK500_CHARACTERS[index];
  const next = () => { setMistakes(0); setIndex(i => (i + 1) % HSK500_CHARACTERS.length); };
  return <SafeAreaView style={s.page}>
    <Text style={s.eyebrow}>STROKE PRACTICE · {index + 1}/500</Text>
    <Text style={s.title}>Trace the character</Text>
    <ChineseStrokeWriter key={character} character={character} mode="trace" size={320} onMistake={e=>setMistakes(e.mistakes)} />
    <View style={s.row}><Text>Mistakes: {mistakes}</Text><Pressable style={s.button} onPress={next}><Text style={s.buttonText}>Next character</Text></Pressable></View>
  </SafeAreaView>;
}
const s=StyleSheet.create({page:{flex:1,alignItems:'center',justifyContent:'center',gap:18,backgroundColor:'#FFF8EC'},eyebrow:{fontSize:12,letterSpacing:1.4,color:'#9A5A23'},title:{fontSize:28,fontWeight:'700',color:'#241B15'},row:{width:320,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},button:{backgroundColor:'#E85D2A',paddingHorizontal:18,paddingVertical:12,borderRadius:12},buttonText:{color:'white',fontWeight:'700'}});
