import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer/simplepeer.min.js";

const API = process.env.REACT_APP_API;
const socket = io(API);

function Messenger() {
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [currentChat, setCurrentChat] = useState(null);
  const [isGroup, setIsGroup] = useState(false);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [typingUser, setTypingUser] = useState("");

  // VIDEO CALL STATES
  const [stream, setStream] = useState(null);
  const [call, setCall] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [callerSignal, setCallerSignal] = useState(null);

  const myVideo = useRef();
  const userVideo = useRef();
  const peerRef = useRef();

  const token = localStorage.getItem("token");
  const myId = localStorage.getItem("userId");

  const chatRef = useRef();

  // -----------------------
  // LOAD FRIENDS + GROUPS
  // -----------------------
  useEffect(() => {
    const loadData = async () => {
      try {
        const f = await fetch(`${API}/api/users/friends`, {
          headers: { Authorization: "Bearer " + token }
        });
        setFriends(await f.json());

        const g = await fetch(`${API}/api/groups`, {
          headers: { Authorization: "Bearer " + token }
        });
        setGroups(await g.json());

      } catch (err) {
        console.log(err);
      }
    };

    loadData();
  }, []);

  // -----------------------
  // SOCKET
  // -----------------------
  useEffect(() => {
    if (!myId) return;

    socket.emit("addUser", myId);

    socket.on("getUsers", (users) => {
      setOnlineUsers(users);
    });

    socket.on("receiveMessage", (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on("receiveGroupMessage", (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on("typing", () => {
      setTypingUser("typing...");
      setTimeout(() => setTypingUser(""), 1000);
    });

    // CALL
    socket.on("incomingCall", ({ from, signal }) => {
      setCall({ from });
      setCallerSignal(signal);
    });

    socket.on("callAccepted", ({ signal }) => {
      setCallAccepted(true);
      peerRef.current.signal(signal);
    });

    return () => socket.off();
  }, [myId]);

  // -----------------------
  // OPEN CHAT
  // -----------------------
  const openChat = (id) => {
    setCurrentChat(id);
    setIsGroup(false);

    socket.emit("joinRoom", {
      senderId: myId,
      receiverId: id
    });

    setMessages([]);
  };

  // -----------------------
  // OPEN GROUP
  // -----------------------
  const openGroup = (group) => {
    setCurrentChat(group._id);
    setIsGroup(true);

    socket.emit("joinGroup", group._id);
    setMessages([]);
  };

  // -----------------------
  // SEND MESSAGE
  // -----------------------
  const sendMessage = () => {
    if (!currentChat) return;

    const msg = {
      senderId: myId,
      receiverId: currentChat,
      text
    };

    if (isGroup) {
      socket.emit("sendGroupMessage", {
        groupId: currentChat,
        senderId: myId,
        text
      });
    } else {
      socket.emit("sendMessage", msg);
    }

    setMessages(prev => [...prev, msg]);
    setText("");
  };

  // -----------------------
  // VIDEO STREAM START
  // -----------------------
  const startVideo = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    setStream(mediaStream);
    myVideo.current.srcObject = mediaStream;
  };

  // -----------------------
  // CALL USER
  // -----------------------
  const callUser = () => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream
    });

    peer.on("signal", (signal) => {
      socket.emit("callUser", {
        from: myId,
        to: currentChat,
        signal
      });
    });

    peer.on("stream", (remoteStream) => {
      userVideo.current.srcObject = remoteStream;
    });

    peerRef.current = peer;
  };

  // -----------------------
  // ACCEPT CALL
  // -----------------------
  const acceptCall = () => {
    setCallAccepted(true);

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream
    });

    peer.on("signal", (signal) => {
      socket.emit("answerCall", {
        to: call.from,
        signal
      });
    });

    peer.on("stream", (remoteStream) => {
      userVideo.current.srcObject = remoteStream;
    });

    peer.signal(callerSignal);
    peerRef.current = peer;
  };

  // -----------------------
  // END CALL
  // -----------------------
  const endCall = () => {
    setCallEnded(true);
    setCall(null);
    setCallAccepted(false);

    if (peerRef.current) {
      peerRef.current.destroy();
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  // -----------------------
  // UI
  // -----------------------
  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* LEFT */}
      <div style={{ width: "30%", borderRight: "1px solid gray" }}>
        <h3>Friends</h3>
        {friends.map(f => (
          <div key={f._id} onClick={() => openChat(f._id)}>
            {onlineUsers.includes(f._id) ? "🟢" : "⚪"} {f.name}
          </div>
        ))}

        <h3>Groups</h3>
        {groups.map(g => (
          <div key={g._id} onClick={() => openGroup(g)}>
            👥 {g.name}
          </div>
        ))}
      </div>

      {/* RIGHT */}
      <div style={{ width: "70%", padding: "10px" }}>
        <h3>Chat</h3>

        <div style={{ height: "60%", overflowY: "scroll" }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              textAlign: m.senderId === myId ? "right" : "left"
            }}>
              <p>{m.text}</p>
            </div>
          ))}
          <div ref={chatRef}></div>
        </div>

        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            socket.emit("typing", {
              senderId: myId,
              receiverId: currentChat
            });
          }}
        />

        <button onClick={sendMessage}>Send</button>

        <div>
          <button onClick={startVideo}>🎥 Start Camera</button>
          <button onClick={callUser}>📞 Call</button>
        </div>

        <video ref={myVideo} autoPlay muted width="120" />
        <video ref={userVideo} autoPlay width="120" />

        {typingUser && <p>{typingUser}</p>}
      </div>

      {/* INCOMING CALL */}
      {call && !callAccepted && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          background: "#fff",
          padding: "15px",
          borderRadius: "10px"
        }}>
          <p>📞 Incoming Call</p>
          <button onClick={acceptCall}>Accept</button>
          <button onClick={() => setCall(null)}>Reject</button>
        </div>
      )}

      {/* VIDEO CALL FULL SCREEN */}
      {callAccepted && !callEnded && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "black",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <video ref={userVideo} autoPlay style={{ width: "80%" }} />
          <video
            ref={myVideo}
            autoPlay
            muted
            style={{
              position: "absolute",
              bottom: "100px",
              right: "20px",
              width: "120px"
            }}
          />

          <button
            onClick={endCall}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              background: "red",
              color: "white"
            }}
          >
            ❌ End Call
          </button>
        </div>
      )}

    </div>
  );
}

export default Messenger;
