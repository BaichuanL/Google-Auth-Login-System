const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20");
const User = require("../models/user-model");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");

passport.serializeUser((user, done) => {
  console.log("Serialize users...");
  done(null, user._id); // 將mongoDB的id，存在session
  // 並且將id簽名後，以Cookie的形式給使用者。。。
});

passport.deserializeUser(async (_id, done) => {
  console.log(
    "Deserialize users... Use the id stored by serializeUser to find the data in the database"
  );
  let foundUser = await User.findOne({ _id });
  done(null, foundUser); // 將req.user這個屬性設定為foundUser
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/redirect",
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("Enter the area of Google Strategy");
      let foundUser = await User.findOne({ googleID: profile.id }).exec();
      if (foundUser) {
        console.log("The user has already registered. No need to store in the database.");
        done(null, foundUser);
      } else {
        console.log("New user detected. Data must be stored in the database");
        let newUser = new User({
          name: profile.displayName,
          googleID: profile.id,
          thumbnail: profile.photo[0].value,
          email: profile.emails[0].value,
        });
        let savedUser = await newUser.save();
        console.log("The new user is created successfully. Procedure");
        done(null, savedUser);
      }
    }
  )
);

passport.use(
  new LocalStrategy(async (username, password, done) => {
    let foundUser = await User.findOne({ email: username });
    if (foundUser) {
      let result = await bcrypt.compare(password, foundUser.password);
      if (result) {
        done(null, foundUser);
      } else {
        done(null, false);
      }
    } else {
      done(null, false);
    }
  })
);
