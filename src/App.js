import {useState, useRef,useCallback} from 'react';

import './App.css';
import firebase from 'firebase';
// import firebase2 from 'firebase';
import 'firebase/firestore';
import 'firebase/auth';
import {Button,AppBar,Toolbar,Avatar, Paper} from '@material-ui/core';
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faTwitter } from "@fortawesome/free-brands-svg-icons";
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import { makeStyles } from '@material-ui/core/styles';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import config from './config';
// import ProfilePage from './components/imgUpload';

// console.log(firebase)


firebase.initializeApp(config)
const auth =firebase.auth();
const firestore = firebase.firestore();
var storage = firebase.storage();
console.log(storage)

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },

}));

// const 

function App() {
const [user] = useAuthState(auth);
// console.log(user);


  return (
    <div className="App">
      <AppBar position="sticky">
        <Toolbar>
          <div>Naction's chat 🐳</div>
          <div className="blank"></div>
        <SignOut />

        </Toolbar>
      </AppBar>
      <section>
        {user ?<ChatRoom/>:<SignIn/>}
      </section>

    </div>
  );

}
function SignIn(){
  const classes = useStyles();
  const signInWithGoogle =()=>{
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);

  }
  const signInAnonymously =()=>{
    firebase.auth().signInAnonymously()
    .then(() => {
      // Signed in..
    })
    .catch((error) => {
      // var errorCode = error.code;
      // var errorMessage = error.message;
      // ...
    })
  } 

  
  return(
    <div className="signin">
      {/* <FontAwesomeIcon style={iconStyle} icon={faTwitter} /> */}
      {/* <FontAwesomeIcon icon="coffee" /> */}
      <div className='margin '>

        <Paper className={classes.paper}>
          <div className='text-center py-2'>
            <Avatar className={classes.avatar}>
          <LockOutlinedIcon   />

            </Avatar>
          </div>
      

        <div className="text-center ">

          <Button color="primary" onClick={signInWithGoogle} className="signout-button" variant="contained">Googleでサインイン</Button>
        </div>

        <div className='text-center py-2'>
          <Button color='inherit' onClick={signInAnonymously } className="signout-button" variant="contained">ゲストログイン</Button>
        </div>
        <div>
        <div className="margin py-2">Googleでサインインをする場合あなたの情報がこのサイトに共有され、<br/>プロフィール写真をアイコンに使用させていただきます。<br/>了承いただける方のみご利用下さい。<br/>ゲストログインでは匿名の情報でチャットに参加することができます😎</div>
      </div>

        </Paper>
        </div>


      <div className="space"></div>
    </div>
  )
}

function SignOut(){
  return auth.currentUser &&(
    <Button variant="contained" onClick={()=> auth.signOut()}>ログアウト</Button>
  )
}
function ChatRoom(props){
  const messagesRef = firestore.collection('messages');
  const query = messagesRef.orderBy('createdAt');
  const [messages] =  useCollectionData(query,{idField:'id'});
  const [formValue,setFormValue] = useState('');
  const [images,setImages] = useState([])
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
  const uploadImage = useCallback((event)=>{
    const file = event.target.files;
    // 画像アップロードする際にblobに変換する必要がある
    let blob = new Blob(file,{type:'image/jpeg'});
    // ランダム文字列の生成をしファイル名にする
    const S ="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    const N =16;
    const fileName =Array.from(crypto.getRandomValues(new Uint32Array(N))).map((n)=>S[n%S.length]).join('')
    // 保存する参照先を取得
    const uploadRef = storage.ref('image').child(fileName);
    // blobを保存
    const uploadTask = uploadRef.put(blob);
    // console.log(uploadTask.snapshot.ref.getDownloadURL());
    uploadTask.snapshot.ref.getDownloadURL()
    .then((downloadURL)=>{
      console.log(downloadURL);
      const newImage = {id:fileName, path:downloadURL};
      props.setImages((prevState =>[...prevState,newImage]))
    console.log(newImage);

    },[props.setImages]);
  })
  return(
    <>
    <main>
      {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg}/> )}
      <div ref={dummy}></div>
      
    </main>
    <label>
            aaa
          <input type='file' onChange={uploadImage}/>

          </label>
          <img />
          
    <div className="last"></div>

    <form onSubmit={sendMessage}>
      <input id="standard-secondary" placeholder="好きな映画の話でもしましょう" value={formValue} onChange={(e)=> setFormValue(e.target.value)} />
      <Button color="primary" variant="contained" type='submit' >
        ✉️
      </Button>
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
