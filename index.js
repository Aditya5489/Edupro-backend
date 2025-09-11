const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDb = require('./config/db');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const http=require('http');
const {Server}=require("socket.io");





const authRouter = require('./routes/auth.route');
const planRouter = require('./routes/studyplan.route');
const quizRouter = require('./routes/quiz.route');
const analyzeRouter = require('./routes/jobanalyzer.route');
const skillRouter = require('./routes/skill.route');
const checkAuthRouter = require('./routes/checkAuth.route');
const runCodeRouter = require("./routes/code.route");
const gameRouter = require("./routes/game.route");
const profileRouter = require('./routes/profile.route');
const  leaderboardRouter  = require('./routes/leaderboard.route');

dotenv.config();

const app = express();

const server=http.createServer(app);
const io=new Server(server);

const userSocketMap={};


const getAllConnectedClients=(roomId)=>{
  return Array.from(io.sockets.adapter.rooms.get(roomId)||[]).map((socketId)=>{
    return{
      socketId,
      username:userSocketMap[socketId]
    }
  });
}

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join", ({ roomId, username }) => {
    if (!username) return;

    userSocketMap[socket.id] = username;
    socket.join(roomId);

    const clients = getAllConnectedClients(roomId);
    io.in(roomId).emit("joined", {
      clients,
      username,
      socketId: socket.id,
    });
  });


  socket.on("code-change", ({ roomId, code }) => {
    socket.to(roomId).emit("code-change", { code });
  });

  
  socket.on("get-code", ({ roomId }) => {
    socket.to(roomId).emit("send-code", { socketId: socket.id });
  });

  
  socket.on("send-code", ({ code, socketId }) => {
    io.to(socketId).emit("code-change", { code });
  });

  socket.on("send-message", ({ roomId, username, message }) => {
   io.in(roomId).emit("receive-message", { username, message });
  });

  socket.on("leave-room", ({ roomId }) => {
  const username = userSocketMap[socket.id];
  socket.to(roomId).emit("disconnected", { socketId: socket.id, username });
  socket.leave(roomId);
  delete userSocketMap[socket.id];
});

 
  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.to(roomId).emit("disconnected", {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
  });
});




// --- Middlewares ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL,
    ttl: 60 * 60 * 24 * 7,
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  }
}));


app.use('/api', authRouter);
app.use('/api/studyplan', planRouter);
app.use('/api/generatecontent', quizRouter);
app.use('/api/analyzejob', analyzeRouter);
app.use('/api/skills', skillRouter);
app.use('/api/auth', checkAuthRouter);
app.use('/api/run-code',runCodeRouter);
app.use('/api/gamification',gameRouter);
app.use('/api/profile', profileRouter);
app.use('/api/leaderboard', leaderboardRouter);

app.get("/", (req, res) => {
  res.send("Hello World");
});




const port = process.env.PORT || 3000;
server.listen(port, () => {
  connectDb();
  console.log(`Server is running on port ${port}`);
});
