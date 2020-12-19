import {useState, useRef} from 'react';

import './App.css';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import {Button,AppBar,Toolbar,Container,IconButton,Avatar} from '@material-ui/core';
// import { IconButton } from '@material-ui/icons';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import config from './config';


firebase.initializeApp(config)
const auth =firebase.auth();
const firestore = firebase.firestore();


function App() {
const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header >
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu">

          </IconButton>
        <SignOut />

        </Toolbar>
      </AppBar>
      </header>
      <Container>
      <section>
        {user ?<ChatRoom/>:<SignIn/>}
      </section>
      </Container>

    </div>
  );
}
function SignIn(){
  const signInWithGoogle =()=>{
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  }
  return(
    <button onClick={signInWithGoogle}>sign In With Google</button>
  )
}

function SignOut(){
  return auth.currentUser &&(
    <Button variant="outlined" onClick={()=> auth.signOut()}>ログアウト</Button>
  )
}
function ChatRoom(){
  const messagesRef = firestore.collection('messages');
  const query = messagesRef.orderBy('createdAt').limit(25);
  const [messages] =  useCollectionData(query,{idField:'id'});
  const [formValue,setFormValue] = useState('');
  const dummy = useRef();

  // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/async_function
  const sendMessage = async(e)=>{
    // https://qiita.com/tochiji/items/4e9e64cabc0a1cd7a1ae 
    // デフォルトの動作を発生させない クリックで画面遷移するのを防ぐ
    e.preventDefault();
    const { uid,photoURL} = auth.currentUser;
    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL
    })
    setFormValue('');
    dummy.current.scrollIntoView({behavior:'smooth'});
  }
  return(
    <>


    <main>
      {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg}/> )}
      <div ref={dummy}></div>
    </main>
    <form onSubmit={sendMessage}>
      <input value={formValue} onChange={(e)=> setFormValue(e.target.value)}/>
      <Button color="primary" variant="contained" type='submit'>📩</Button>
    </form>
    </>
  )
}

function ChatMessage(props){
  const{text,uid,photoURL} = props.message;

  const messageClass = uid ===  auth.currentUser.uid ? 'sent' : 'received';
  return (
    <>
    <div className={`message ${messageClass}`}>
    <Avatar src={photoURL}/>
    <p>{text}</p>

    </div>
    </>
  )
}

export default App;
