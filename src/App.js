import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [saldo, setSaldo] = useState(0);
  const [cotas, setCotas] = useState(0);
  const [novaCota, setNovaCota] = useState("");

  // Verifica login automático
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usuario) => {
      if (usuario) {
        setUser(usuario);
        const userRef = doc(db, "users", usuario.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const dados = userSnap.data();
          setSaldo(dados.saldo);
          setCotas(dados.cotas);
          // Atualiza saldo com 8% ao dia
          atualizarSaldo(usuario.uid, dados);
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Função para atualizar saldo (8% ao dia)
  const atualizarSaldo = async (uid, dados) => {
    const agora = new Date();
    const ultimaAtualizacao = dados.ultimaAtualizacao?.toDate?.() || new Date();

    const diffHoras = (agora - ultimaAtualizacao) / 1000 / 60 / 60;
    if (diffHoras >= 24) {
      const novosDias = Math.floor(diffHoras / 24);
      const novoSaldo = dados.saldo * Math.pow(1.08, novosDias);
      await updateDoc(doc(db, "users", uid), {
        saldo: novoSaldo,
        ultimaAtualizacao: serverTimestamp(),
      });
      setSaldo(novoSaldo);
    }
  };

  // Cadastro
  const registrar = async () => {
    const userCred = await createUserWithEmailAndPassword(auth, email, senha);
    await setDoc(doc(db, "users", userCred.user.uid), {
      email,
      saldo: 0,
      cotas: 0,
      ultimaAtualizacao: serverTimestamp(),
    });
  };

  // Login
  const entrar = async () => {
    await signInWithEmailAndPassword(auth, email, senha);
  };

  // Logout
  const sair = async () => {
    await signOut(auth);
  };

  // Adicionar cota
  const comprarCota = async () => {
    if (!novaCota || isNaN(novaCota)) return alert("Digite um valor válido!");
    const valor = parseFloat(novaCota);
    const novoSaldo = saldo + valor;
    const novasCotas = cotas + 1;
    await updateDoc(doc(db, "users", user.uid), {
      saldo: novoSaldo,
      cotas: novasCotas,
    });
    setSaldo(novoSaldo);
    setCotas(novasCotas);
    setNovaCota("");
  };

  if (!user)
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Apple Aporte</h1>
        <input
          className="border p-2 m-2"
          placeholder="E-mail"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border p-2 m-2"
          placeholder="Senha"
          type="password"
          onChange={(e) => setSenha(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4 py-2 m-2" onClick={entrar}>
          Entrar
        </button>
        <button className="bg-green-500 text-white px-4 py-2 m-2" onClick={registrar}>
          Cadastrar
        </button>
      </div>
    );

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Painel Apple Aporte 🍎</h1>
      <p className="text-lg mb-2">Email: {user.email}</p>
      <p className="text-lg mb-2">Saldo: R$ {saldo.toFixed(2)}</p>
      <p className="text-lg mb-4">Cotas: {cotas}</p>

      <input
        className="border p-2 m-2"
        placeholder="Valor da cota"
        value={novaCota}
        onChange={(e) => setNovaCota(e.target.value)}
      />
      <button className="bg-purple-500 text-white px-4 py-2 m-2" onClick={comprarCota}>
        Comprar Cota
      </button>

      <button className="bg-red-500 text-white px-4 py-2 m-2" onClick={sair}>
        Sair
      </button>
    </div>
  );
}

export default App;
