import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@entrega/itens';

function Header({ title, showBack, onBack }) {
  return (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>〈 Voltar</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.backBtnPlaceholder} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.backBtnPlaceholder} />
    </View>
  );
}

export default function App() {
  const [itens, setItens] = useState([]);
  const [view, setView] = useState('list'); // 'list' | 'new' | 'detail'
  const [draft, setDraft] = useState({ nome: '', categoria: '', preco: '', frete: '', peso: '' });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) setItens(JSON.parse(raw));
    })();
  }, []);

  const persist = async (next) => {
    setItens(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  };

  const addItem = async () => {
    const preco = parseFloat(draft.preco || '0');
    const frete = parseFloat(draft.frete || '0');
    const peso = parseFloat(draft.peso || '0');
    if (!draft.nome.trim()) return;
    const novo = { id: Date.now().toString(), ...draft, preco, frete, peso };
    await persist([...itens, novo]);
    setDraft({ nome: '', categoria: '', preco: '', frete: '', peso: '' });
    setView('list');
  };

  const removeItem = async (id) => {
    const next = itens.filter((i) => i.id !== id);
    await persist(next);
    setView('list');
  };

  const openDetail = (item) => { setSelected(item); setView('detail'); };

// Fórmulas reais (modelo Receita Federal / Correios)
const II = 0.6; // 60%
const ICMS = 0.18; // 18%
const IOF = 0.0638; // 6.38%
const calcularTributos = (produto) => {
const preco = parseFloat(produto.preco || 0);
const frete = parseFloat(produto.frete || 0);
const totalProduto = preco + frete;
const impostoImportacao = totalProduto * II;
const baseICMS = (totalProduto + impostoImportacao) / (1 - ICMS);
const icms = baseICMS * ICMS;
const iof = totalProduto * IOF;
const totalFinal = totalProduto + impostoImportacao + icms + iof;
return { impostoImportacao, icms, iof, totalFinal };
};
const selectedTax = selected ? calcularTributos(selected) : null;
// soma de ICMS + IOF para exibição simples na tela de detalhe
const imposto = selectedTax ? (selectedTax.icms + selectedTax.iof) : 0;
const isSecondary = view === 'new' || view === 'detail';

return (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#0b1220' }}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={styles.container}>
        {view === 'list' && (
          <>
            <Text style={styles.title}>Entrega Fase 1 — App RN (SDK 51)</Text>
            <FlatList
              data={itens}
              keyExtractor={(i) => i.id}
              ListEmptyComponent={<Text style={styles.muted}>Nenhum item. Toque em “＋” para adicionar.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.card} onPress={() => openDetail(item)}>
                  <Text style={styles.cardTitle}>{item.nome}</Text>
                  <Text style={styles.cardText}>
                    Categoria: {item.categoria || '-'} • Pago: R$ {Number(item.preco||0).toFixed(2)}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.fab} onPress={() => setView('new')}>
              <Text style={styles.fabText}>＋</Text>
            </TouchableOpacity>
          </>
        )}

        {view === 'new' && (
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Novo Item</Text>
            <TextInput placeholder="Nome" style={styles.input} value={draft.nome} onChangeText={(v)=>setDraft({...draft, nome:v})} />
            <TextInput placeholder="Categoria" style={styles.input} value={draft.categoria} onChangeText={(v)=>setDraft({...draft, categoria:v})} />
            <TextInput placeholder="Preço (R$)" keyboardType="decimal-pad" style={styles.input} value={draft.preco} onChangeText={(v)=>setDraft({...draft, preco:v})} />
            <TextInput placeholder="Peso (kg)" keyboardType="decimal-pad" style={styles.input} value={draft.peso} onChangeText={(v)=>setDraft({...draft, peso:v})} />
            <TouchableOpacity style={styles.button} onPress={addItem}><Text style={styles.buttonText}>Salvar</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.button,{backgroundColor:'#374151'}]} onPress={()=>setView('list')}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}

        {view === 'detail' && selected && (
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{selected.nome}</Text>
            <Text style={styles.cardText}>Categoria: {selected.categoria || '-'}</Text>
            <Text style={styles.cardText}>Preço: R$ {Number(selected.preco||0).toFixed(2)}</Text>
            <Text style={styles.cardText}>Peso: {Number(selected.peso||0).toFixed(2)} kg</Text>
            <Text style={[styles.cardTitle,{marginTop:14}]}>= Estimativa de Tributos =</Text>
            <Text style={styles.cardText}>ICMS + IOF (exemplo): R$ {imposto.toFixed(2)}</Text>
            <TouchableOpacity style={[styles.button,{backgroundColor:'#ef4444'}]} onPress={()=>removeItem(selected.id)}>
              <Text style={styles.buttonText}>Excluir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button,{backgroundColor:'#374151'}]} onPress={()=>setView('list')}>
              <Text style={styles.buttonText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220', padding: 16 },
  title: { color: 'white', fontSize: 20, fontWeight: '800', marginBottom: 12 },
  card: { backgroundColor: '#111827', padding: 16, borderRadius: 14, marginBottom: 12 },
  cardTitle: { color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  cardText: { color: '#cbd5e1', fontSize: 14 },
  muted: { color: '#94a3b8' },
  input: { backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 10 },
  button: { backgroundColor: '#2563eb', padding: 12, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontWeight: '800' },
  fab: { position: 'absolute', right: 16, bottom: 24, backgroundColor: '#10b981', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  fabText: { color: 'white', fontSize: 28, fontWeight: 'bold', marginTop: -2 },
});