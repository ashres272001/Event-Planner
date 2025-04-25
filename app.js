const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const db = require('./models'); // import Sequelize models
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(session({
    secret: 'super-secret-key', // replace this in production
    resave: false,
    saveUninitialized: false
  }));

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

//  Set Handlebars as the view engine
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Sync Sequelize database
db.sequelize.sync()
  .then(() => console.log('Database connected'))
  .catch((err) => console.error('DB Error:', err));

//ROUTES

// Home page
app.get('/', (req, res) => {
  res.render('home');
});

// Show registration form
app.get('/register', (req, res) => {
  res.render('register');
});

// Handle registration form submission
app.post('/register', async (req, res) => {
    const { email, password, role } = req.body;
  
    try {
      const newUser = await db.User.create({ email, password, role });
  
      // Log the user in immediately
      req.session.userId = newUser.id;
      req.session.role = newUser.role;
  
      // Redirect based on role
      if (role === 'Organizer') {
        res.redirect('/dashboard');
      } else if (role === 'Attendee') {
        res.redirect('/events-feed');
      }
    } catch (error) {
      res.send(`Error: ${error.message}`);
    }
  });
  

// Show login form
app.get('/login', (req, res) => {
    res.render('login');
  });
  
  // Handle login form
  app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await db.User.findOne({ where: { email } });
  
      if (!user) {
        return res.render('login', { error: 'User not found.' });
      }
  
      if (user.password !== password) {
        return res.render('login', { error: 'Incorrect password.' });
      }
  
      req.session.userId = user.id;
      req.session.role = user.role;
  
      // Redirect based on role
      if (user.role === 'Organizer') {
        res.redirect('/dashboard');
      } else if (user.role === 'Attendee') {
        res.redirect('/events-feed');
      }
    } catch (error) {
      res.render('login', { error: `Error: ${error.message}` });
    }
  });
  
  
// Show dashboard
app.get('/dashboard', async (req, res) => {
    if (!req.session.userId || req.session.role !== 'Organizer') {
      return res.send('Access denied. You must be logged in as an Organizer.');
    }
  
    const organizerId = req.session.userId;
  
    const myEventsRaw = await db.Event.findAll({ where: { createdBy: organizerId } });
    const allEventsRaw = await db.Event.findAll();
  
    const myEvents = myEventsRaw.map(event => event.get({ plain: true }));
    const allEvents = allEventsRaw.map(event => event.get({ plain: true }));
  
    res.render('dashboard', { myEvents, allEvents, userId: req.session.userId, role: req.session.role });
  });  

app.get('/create-event', (req, res) => {
    if (!req.session.userId || req.session.role !== 'Organizer') {
      return res.redirect('/events-feed');
    }
  
    res.render('create-event');
  }); 
  
  
app.post('/events', async (req, res) => {
    const { title, description, location, time } = req.body;
    const organizerId = req.session.userId;
  
    try {
      await db.Event.create({
        title,
        description,
        location,
        time,
        createdBy: organizerId
      });
  
      res.redirect('/dashboard');
    } catch (err) {
      res.send(`Error: ${err.message}`);
    }
  });
  
app.get('/events-feed', async (req, res) => {
    if (!req.session.userId || req.session.role !== 'Attendee') {
      return res.send('Access denied');
    }
  
    // Get this user + their RSVPed events
    const user = await db.User.findByPk(req.session.userId, {
      include: {
        model: db.Event,
        as: 'RsvpedEvents'
      }
    });
  
    const rsvpedEvents = user.RsvpedEvents.map(e => e.get({ plain: true }));
    const rsvpedEventIds = rsvpedEvents.map(e => e.id); // 🧠 list of RSVP'd IDs
  
    // Get events the user has NOT RSVP'd to
    const allEventsRaw = await db.Event.findAll({
      where: {
        id: {
          [db.Sequelize.Op.notIn]: rsvpedEventIds
        }
      }
    });
  
    const allEvents = allEventsRaw.map(e => e.get({ plain: true }));
  
    res.render('events-feed', {
      allEvents,
      rsvpedEvents,
      userId: req.session.userId
    });
  });
  
  
app.get('/events/edit/:id', async (req, res) => {
    const event = await db.Event.findOne({ where: { id: req.params.id, createdBy: req.session.userId } });
  
    if (!event) return res.send('❌ Event not found or not yours.');
  
    res.render('edit-event', { event: event.get({ plain: true }) });
  });
  
app.post('/events/edit/:id', async (req, res) => {
    const { title, description, location, time } = req.body;
  
    await db.Event.update(
      { title, description, location, time },
      { where: { id: req.params.id, createdBy: req.session.userId } }
    );
  
    res.redirect('/dashboard');
  });  

app.post('/events/delete/:id', async (req, res) => {
    await db.Event.destroy({ where: { id: req.params.id, createdBy: req.session.userId } });
    res.redirect('/dashboard');
  });
  
app.post('/rsvp/:eventId', async (req, res) => {
    const userId = req.session.userId;
    const eventId = req.params.eventId;
  
    if (!userId || req.session.role !== 'Attendee') {
      return res.send('Unauthorized');
    }
  
    try {
      await db.RSVP.findOrCreate({
        where: { userId, eventId }
      });
  
      res.redirect('/events-feed');
    } catch (err) {
      res.send(`Error: ${err.message}`);
    }
  });
  
app.post('/cancel-rsvp/:eventId', async (req, res) => {
    const userId = req.session.userId;
    const eventId = req.params.eventId;
  
    if (!userId || req.session.role !== 'Attendee') {
      return res.send('Access denied');
    }
  
    try {
      await db.RSVP.destroy({
        where: {
          userId,
          eventId
        }
      });
  
      res.redirect('/events-feed');
    } catch (err) {
      res.send(`Error: ${err.message}`);
    }
  });

app.get('/events/rsvps/:eventId', async (req, res) => {
    if (!req.session.userId || req.session.role !== 'Organizer') {
      return res.send('Access denied.');
    }
  
    const event = await db.Event.findOne({
      where: {
        id: req.params.eventId,
        createdBy: req.session.userId
      },
      include: {
        model: db.User,
        as: 'Attendees',
        attributes: ['email']
      }
    });
  
    if (!event) return res.send('Event not found or not yours.');
  
    const attendees = event.Attendees.map(user => user.email);
  
    res.render('view-rsvps', {
      event: event.get({ plain: true }),
      attendees
    });
  });
  

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
      res.redirect('/');
    });
  });    

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});