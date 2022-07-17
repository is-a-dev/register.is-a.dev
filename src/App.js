import { GithubAuthProvider, OAuthCredential } from "firebase/auth";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { addDoc, collection, getFirestore } from "firebase/firestore";
import React from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useForm } from 'react-hook-form';
import "./App.css";
import banner from "./assets/banner.png";
import config from "./config.json";
import commit from "./functions/commit";
import fork from "./functions/fork";
import getpr from "./functions/getpr";
import openPR from "./functions/pr";
import vars from "./vars";

firebase.initializeApp({
  apiKey: config.key,
  authDomain: "auth.is-a.dev",
  projectId: "is-a-dev",
  storageBucket: "is-a-dev.appspot.com",
  messagingSenderId: "611825040570",
  appId: "1:611825040570:web:98f70d5aaf5861552e1683",
  measurementId: "G-K9WXR60DWJ",
});

const auth = firebase.auth();
const githubLoginProvider = new firebase.auth.GithubAuthProvider();
// auth.signInWithPopup(provider);
const db = getFirestore();

function App() {
  window.addEventListener("load", (event) => auth.signOut());
  const [user] = useAuthState(auth);

  return (
    <>
      <header>
        {user ? <Nav /> : null}
        <img alt="banner" className="banner" src={banner}></img>
      </header>
      <main>{user ? <Dashboard /> : <SignIn />}</main>

      <footer>
        <h3>&copy; 2022 is-a.dev</h3>
        <h3></h3>
        <h3>Please do not share the link for this beta, however you may share screenshots!</h3>
      </footer>
    </>
  );
}

function SignIn() {
  return (
    <button
      onClick={() => {
        githubLoginProvider.addScope("repo");
        auth.signInWithPopup(githubLoginProvider)
          .then((res) => {
            vars.token = res.credential.accessToken;
            vars.user = res.additionalUserInfo.username;
            vars.email = res.user.email;

            // For development set this varible to "test-project"
            vars.repo = "register";

            Object.freeze(vars);
            // Fork on login
            fork();
        });
      }}
    >
      Sign in with GitHub
    </button>
  );
}

function Nav() {
  const pfp = auth.currentUser.photoURL;
  const name = auth.currentUser.displayName;

  return (
    <nav>
      <img alt="pfp.png" src={pfp}></img>
      <h3>Logged in as: {name}</h3>
    </nav>
  );
}

function Dashboard(props) {
  const queryParams = new URLSearchParams(window.location.search);
  const record = queryParams.get("records");
  const name = auth.currentUser.displayName;
  const { register, handleSubmit, formState: { errors } } = useForm();
  const onSubmit = data => dostuff(data);
  console.log(errors);
  
if(name == null) {
    auth.signOut();
  }

  return (
    <>
      <h1>Register a Subdomain</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
      <select {...register("Type", { required: true })}>
        <option value="A">A</option>
        <option value="CNAME">CNAME</option>
        <option value="MX">MX</option>
        <option value="TXT">TXT</option>
        <option value="URL">URL</option>
      </select>
      <input type="text" placeholder="subdomain" {...register("subdomain", {required: true, max: 12})} />
      <input type="text" placeholder="Record value" {...register("value", {required: true})} />
      <div className="btnBox">
        <input id="register" className="btn-green" type="submit" />
      </div>
    </form>

      <div className="btnBox">
        <button onClick={() => auth.signOut()}>Sign Out</button>
        <button className="btn-red" onClick={() => auth.currentUser.delete()}>
          Delete Account
        </button>
      </div>
    </>
  );
}

function dostuff(data) {
  const subdomain = data.subdomain;
  const recordType = data.Type;
  let recordData = data.value;

  if(recordType === "A" || recordType === "MX") {
    recordData = JSON.stringify(
      recordData.split(",").map((s) => s.trim())
    );
  } else {
    recordData = `"${recordData.trim()}"`;
  }
  commit(
    subdomain,
    `
    {
      "owner": {
        "username": "${vars.user}",
        "email": "${vars.email}"
      },
      "record": {
        "${recordType}": ${recordData}
      }
    }
  `
  ).then(
    () =>
      (document.getElementById("register").innerText = "Request Submitted")
  );

          
}

export default App;
