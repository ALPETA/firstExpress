const express = require("express");
const app = express();
const port = 3000;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const { auth } = require("./middleware/auth");
const { User } = require("./models/User");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

const mongoose = require("mongoose");

mongoose.set("strictQuery", false);
mongoose
  .connect(
    "mongodb+srv://user1:1234@cluster.feta1l9.mongodb.net/?retryWrites=true&w=majority",
    {
      /**
       * ! 6버전부터 더이상 지원 안함(아래가 기본값으로 실행됨)
       * useNewUrlParser: true,
       * useUnifiedTopology: true,
       * useCreateIndex: true,
       * useFindAndModify: false,
       */
    }
  )
  .then(() => console.log("MongoDb Connected..."))
  .catch((err) => console.log(err));

// app.get("/", (req, res) => {
//   res.send("hello node.js");
// });

app.get("/", (req, res) => {
  //res.send("<h1>hi h1!</h1>");
  res.sendFile(__dirname + "/public/template/main.html");
});

app.post("/register", (req, res) => {
  const user = new User(req.body);
  user.save((err, userInfo) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).json({
      success: true,
    });
  });
});

app.post("/login", (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (!user) {
      return res.json({
        loginSuccess: false,
        message: "제공된 이메일에 해당하는 유저가 없습니다.",
      });
    }

    user.comparePassword(req.body.password, (err, isMatch) => {
      if (!isMatch)
        return res.json({
          loginSuccess: false,
          message: "비밀번호가 틀렸습니다.",
        });
    });

    user.generateToken((err, user) => {
      if (err) return res.status(400).send(err);

      res
        .cookie("x_auth", user.token)
        .status(200)
        .json({ loginSuccess: true, userId: user._id });
    });
  });
});

app.get("/api/users/auth", auth, (req, res) => {
  res.status(200).json({
    _id: req.user._id,
    isAdmin: req.user.role === 0 ? false : true,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role,
    Image: req.user.Image,
  });
});

app.get("/api/users/logout", auth, (req, res) => {
  User.findOneAndUpdate({ _id: req.user._id }, { token: "" }, (err, user) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).send({
      success: true,
    });
  });
});

app.listen(port, () => {
  console.log(`서버 실행함. http://localhost:${port}`);
});
