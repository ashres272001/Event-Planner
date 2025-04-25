This is a full-stack web application built using **Express.js**, **Sequelize ORM**, **Handlebars.js**, and **Node.js**.  
It allows users to **create accounts** as either **Organizers** or **Attendees**, manage events, RSVP to events, and view RSVP details.

Features
- User Authentication (Register/Login/Logout)
- Role-based access (Organizer vs Attendee)
- Organizers can:
  - Create, Edit, Delete Events
  - View RSVP Details (See who has RSVP'd)
- Attendees can:
  - View all events
  - RSVP and Cancel RSVP
  - See their joined events
- Responsive design for desktop and mobile
- Session management for user state
- Secure password and email validations

  ├── models/
│   ├── user.js
│   ├── event.js
│   ├── rsvp.js
│   └── index.js
├── views/
│   ├── layouts/
│   │   └── main.handlebars
│   ├── home.handlebars
│   ├── login.handlebars
│   ├── register.handlebars
│   ├── dashboard.handlebars
│   ├── events-feed.handlebars
│   ├── create-event.handlebars
│   └── view-rsvps.handlebars
├── public/
│   ├── style.css
│   └── images/
├── .gitignore
├── app.js
├── package.json
└── README.md
