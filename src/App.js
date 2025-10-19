import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  orderBy,
  where,
  addDoc
} from "firebase/firestore";

function formatBR(value){ return Number(value).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }

export default function App(){
  const [user, setUser] = useState(null);
  const [view, setView] = useState("home");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [produtos, setProdutos] = useState([]);
  const [saldo, setSaldo] = useState(0);
  const [rendaHoje, setRendaHoje] = useState(0);
  const [receitaTotal, setReceitaTotal] = useState(0);
  const [pixKey] = useState("pix@exemplo.com");

  useEffect(()=>{
    onAuthStateChanged(auth, async (u)=>{
      if(u){
        setUser(u);
        await ensureUserDoc(u);
        loadUserData(u);
        loadProdutos();
      } else {
        setUser(null);
        setSaldo(0);
      }
    });
  },[]);

  async function ensureUserDoc(u){
    const docRef = doc(db, "users", u.uid);
    const snap = await getDoc(docRef);
    if(!snap.exists()){
      // create user doc with saldo inicial R$5 and referral code
      const code = "REF-" + btoa(u.email).slice(0,8);
      await setDoc(docRef, {
        email: u.email,
        saldo: 5.0,
        ultimoCheckin: null,
        createdAt: serverTimestamp(),
        referralCode: code,
        referredBy: null
      });
    }
  }

  async function loadUserData(u){
    const docRef = doc(db, "users", u.uid);
    const snap = await getDoc(docRef);
    if(snap.exists()){
      const data = snap.data();
      setSaldo(Number(data.saldo || 0));
      // compute rendaHoje & receitaTotal from purchases
      const q = query(collection(db,"compras"), where("userId","==",u.uid));
      const comps = await getDocs(q);
      let renda = 0, receita = 0;
      comps.forEach(c=>{
        const d = c.data();
        renda += Number(d.rendaDiaria||0);
        receita += Number(d.rendaTotal||0);
      });
      setRendaHoje(renda);
      setReceitaTotal(receita);
    }
  }

  async function loadProdutos(){
    const q = query(collection(db,"produtos"), orderBy("preco","asc"));
    const snap = await getDocs(q);
    const arr = [];
    snap.forEach(s=>arr.push({ id:s.id, ...s.data() }));
    setProdutos(arr);
  }

  async function handleSignup(){
    if(!email||!senha) return alert("Preencha email e senha");
    try{
      const cred = await createUserWithEmailAndPassword(auth, email, senha);
      alert("Conta criada! Você já tem R$5 no saldo.");
    }catch(e){ alert(e.message); }
  }

  async function handleLogin(){
    if(!email||!senha) return alert("Preencha email e senha");
    try{
      await signInWithEmailAndPassword(auth, email, senha);
    }catch(e){ alert(e.message); }
  }

  async function handleLogout(){
    await signOut(auth);
    setView("home");
  }

  async function doCheckin(){
    if(!user) return alert("Faça login");
    const docRef = doc(db,"users",user.uid);
    const snap = await getDoc(docRef);
    const data = snap.data();
    const hoje = new Date().toISOString().split("T")[0];
    if(data.ultimoCheckin === hoje) return alert("Você já fez check-in hoje");
    const novo = Number((Number(data.saldo||0) + 1).toFixed(2));
    await updateDoc(docRef, { saldo: novo, ultimoCheckin: hoje });
    setSaldo(novo);
    alert("+R$1 creditado no seu saldo");
  }

  async function comprar(prod){
    if(!user) return alert("Faça login");
    // show PIX instruction and confirm to register purchase
    const confirmMsg = `Enviar PIX de R$${prod.preco.toFixed(2)} para a chave ${pixKey} e depois clicar OK para marcar compra (modo de teste).`;
    // if(window.confirm("Deseja continuar?")) {
    // create compra doc and (optionally) debit balance
    // For demo we do not auto-debit; if you want debit: update users doc
    await addDoc(collection(db,"compras"), {
      userId: user.uid,
      produtoId: prod.id,
      preco: prod.preco,
      compradoEm: serverTimestamp(),
      rendaDiaria: prod.rendaDiaria,
      rendaTotal: prod.rendaTotal,
      validade: prod.validade
    });
    alert("Compra registrada (em ambiente de teste). Os rendimentos serão creditados automaticamente diariamente pelo Cloud Function.");
    loadUserData(user);
  }

  // Footer nav actions
  function goHome(){ setView("home"); }
  function goProdutos(){ setView("produtos"); }
  function goEquipe(){ setView("equipe"); }
  function goConta(){ setView("conta"); }

  return (
    <div>
      <header>
        <div className="logo">Apple-aporte</div>
        <nav>
          <button onClick={goHome}>Home</button>
          <button onClick={goProdutos}>Produtos</button>
          <button onClick={goEquipe}>Equipe</button>
          <button onClick={goConta}>Conta</button>
          {user ? <button onClick={handleLogout}>Sair</button> : null}
        </nav>
      </header>

      <div className="container">
        {!user && (
          <div className="card">
            <h3>Entrar / Cadastrar</h3>
            <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
            <input placeholder="Senha" type="password" value={senha} onChange={e=>setSenha(e.target.value)} />
            <div style={{marginTop:8}}>
              <button onClick={handleLogin}>Entrar</button>
              <button onClick={handleSignup} style={{marginLeft:8}}>Criar conta</button>
            </div>
            <p style={{marginTop:8}}>Ao criar conta, você ganha R$5,00.</p>
          </div>
        )}

        {user && (
          <div className="card">
            <h3>Minha Carteira</h3>
            <p>Saldo da Conta: R$ <strong>{formatBR(saldo)}</strong></p>
            <p>Renda de Hoje: R$ {formatBR(rendaHoje)}</p>
            <p>Receita Total: R$ {formatBR(receitaTotal)}</p>
            <div style={{marginTop:8}}>
              <button onClick={doCheckin}>Check-in (+R$1)</button>
            </div>
          </div>
        )}

        {/* Banner */}
        <div className="card">
          <h3>Banner promocional</h3>
          <p>Promoção de testes — use modo de teste.</p>
        </div>

        {/* Products */}
        {(view==="home"||view==="produtos") && (
          <div className="card">
            <h3>Produtos</h3>
            {produtos.map(p=>(
              <div key={p.id} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #eee'}}>
                <div>
                  <strong>{p.nome}</strong><br />
                  Preço: R$ {formatBR(p.preco)} • Validade: {p.validade} dias • Renda diária: R$ {formatBR(p.rendaDiaria)}
                </div>
                <div>
                  <button onClick={()=>comprar(p)}>Comprar</button>
                </div>
              </div>
            ))}
            {produtos.length===0 && <p>Carregando produtos...</p>}
          </div>
        )}

        {/* Equipe */}
        {view==="equipe" && user && (
          <div className="card">
            <h3>Equipe / Convites</h3>
            <p>Compartilhe seu link de convite para ganhar 20% do investimento do indicado (ex.: se indicar e ele comprar R$60, você recebe R$12 creditados; só poderá sacar após 20 dias).</p>
            <Invite user={user} />
          </div>
        )}

        {/* Conta */}
        {view==="conta" && user && (
          <div className="card">
            <h3>Conta</h3>
            <UserAccount user={user} saldo={saldo} />
          </div>
        )}

      </div>

      <footer>
        <button onClick={goHome}>Home</button>
        <button onClick={goProdutos}>Produto</button>
        <button onClick={goEquipe}>Equipe</button>
        <button onClick={goConta}>Conta</button>
      </footer>
    </div>
  );
}

function Invite({user}){
  const [link, setLink] = useState("");
  useEffect(()=>{
    const code = "REF-" + btoa(user.email).slice(0,8);
    setLink(window.location.origin + "?ref=" + encodeURIComponent(code));
  },[user]);
  return <>
    <p>Seu link de convite:</p>
    <input readOnly value={link} style={{width:'100%'}} />
    <p>Quando alguém se cadastrar usando esse link e comprar, você ganha 20% do valor (liberado para saque após 20 dias).</p>
  </>;
}

function UserAccount({user,saldo}){
  const [novaSenha,setNovaSenha] = useState("");
  async function changePass(){
    if(!novaSenha) return alert("Digite nova senha");
    // Changing password requires reauthentication in Firebase Auth.
    alert("Para alterar senha, você precisa fazer via painel do Firebase Auth — guia no README.");
  }
  return <>
    <p>Email: {user.email}</p>
    <p>Saldo: R$ {formatBR(saldo)}</p>
    <p><input placeholder="Nova senha" value={novaSenha} onChange={e=>setNovaSenha(e.target.value)} /></p>
    <p><button onClick={changePass}>Mudar senha</button></p>
  </>;
}
