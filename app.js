if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');

const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');

const MongoDBStore = require('connect-mongo');

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';

main().catch(err => console.log('Database ERROR!!!', err));
async function main() {
  await mongoose.connect(dbUrl);
  console.log('Database connected!');
}

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  mongoSanitize({
    replaceWith: '_',
  })
);

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

const store = new MongoDBStore({
  mongoUrl: dbUrl,
  secret,
  touchAfter: 24 * 60 * 60,
});

store.on('error', function (e) {
  console.log('Session STORE ERROR!!!');
});

const sessionConfig = {
  store,
  name: 'session',
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true,  // work only on HTTPS request
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));
app.use(flash());

app.use(helmet.dnsPrefetchControl());
app.use(helmet.expectCt());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.originAgentCluster());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  if (!['/login', '/'].includes(req.originalUrl)) {
    req.session.returnTo = req.originalUrl;
  }
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);

app.get('/', (req, res) => {
  res.render('home');
});

app.all('*', (req, res, next) => {
  next(new ExpressError('Page not found', 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = 'Oh NOOO... Something went wrong';
  res.status(statusCode).render('error', { err });
});

const port = process.env.PORT || '5000';
app.listen(port, (req, res) => {
  console.log(`Serving on port ${port}!`);
});
