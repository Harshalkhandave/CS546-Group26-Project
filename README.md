# Drinking Water Quality Explorer

*This is the CS546 final project for **Group 26**.*

*Project Repository:* https://github.com/Harshalkhandave/CS546-Group26-Project

**Group Members**
- Harshal Khandave
- Xingyue Qiu
- Jingtong Wang
- Saketh Reddy Ambarapu
- Satya Anil Yanamadala


---

## Project Structure

```
.
├── README.md
├── app.js
├── archive
│   ├── fetchWaterSamplesAPI.js
│   ├── oldWaterSampleSeed.js
│   └── waterSampleCSVExport.js
├── config
│   ├── mongoConnection.js
│   └── passport.js
├── data
│   ├── boroughs.js
│   ├── comments.js
│   ├── index.js
│   ├── sampleSites.js
│   ├── users.js
│   ├── votes.js
│   └── waterSamples.js
├── helper
│   ├── helper.js
│   ├── sampleSitedataHelper.js
│   └── waterSampledataHelper.js
├── middleware.js
├── model
│   ├── borough.js
│   ├── comment.js
│   ├── deletedEmail.js
│   ├── index.js
│   ├── sampleSite.js
│   ├── user.js
│   ├── vote.js
│   └── waterSample.js
├── package.json
├── package-lock.json
├── public
│   ├── css
│   │   ├── styles.css
│   │   └── videos
│   ├── geojson
│   │   └── new-york-city-boroughs.geojson
│   └── js
│       ├── ajax_watersamples.js
│       ├── comments.js
│       ├── like.js
│       └── toast.js
├── routes
│   ├── api.js
│   ├── auth.js
│   ├── boroughs.js
│   ├── comments.js
│   ├── home.js
│   ├── index.js
│   ├── users.js
│   ├── votes.js
│   └── waterSamples.js
├── seedData
│   ├── boroughsDescription.json
│   ├── drinkingWaterSamples.csv
│   └── sampleSites.json
├── tasks
│   ├── migrateUsersToMongo.js
│   ├── sampleSiteSeed.js
│   └── waterSampleSeed.js
└── views
    ├── auth_google.handlebars
    ├── bestBorough.handlebars
    ├── boroughDetails.handlebars
    ├── error.handlebars
    ├── boroughs.handlebars
    ├── edit-profile.handlebars
    ├── forgot-password.handlebars
    ├── home.handlebars
    ├── layouts
    │   └── main.handlebars
    ├── login.handlebars
    ├── profile.handlebars
    ├── register.handlebars
    ├── reset-password.handlebars
    └── watersamples.handlebars

```

---

## Core Features

- Borough-level water quality summaries  
- Detailed borough indicator pages  
- Community comments and likes  
- Weekly voting for cleanest borough  
- Trend analysis across years  
- Data overview comparison table  
- User profiles with liked boroughs and comments  
- Admin moderation capabilities  
- Client-side AJAX interactions  

## Extra Features

- Map visualization  
- Dark mode support  
- Statistical charts and diagrams  

---

## Page Routes

### Home Page
**method**: `GET`  
**route**: `/`

Displays the landing page.

---

### Borough Listings
**method**: `GET`  
**route**: `/boroughs`

Displays all five NYC boroughs and their average water quality indicators.

---

### Borough Detail Page
**method**: `GET`  
**route**: `/boroughs/:id`

Displays detailed information for a selected borough, including:
- Borough description
- Average water quality indicators (chlorine, turbidity, coliform, E. coli, fluoride), if available
- Informational (non-medical) health notices and tips when indicators exceed defined guidelines
- Like/unlike functionality for authenticated users
- Community comments and feedback
- Recent water quality sample data, if available

---

### Water Samples Overview
**method**: `GET`  
**route**: `/waterSamples`

Renders the water samples browse/search page. Sample results are loaded dynamically via AJAX.

---

### User Profile
**method**: `GET`  
**route**: `/users/profile`

Requires authentication. Displays the logged-in user's account information, liked boroughs, and the user's comment history.

---

### Voting Page
**method**: `GET`  
**route**: `/votes/best`

Displays the weekly voting page and current results.

---

### Submit Vote
**method**: `POST`  
**route**: `/votes`

Allows logged-in users to vote for the “cleanest borough of the week”.  
On submission, the user is redirected back to `/votes/best`.

---

### Like Borough
**method**: `POST`  
**route**: `/boroughs/:id/like`

Requires authentication. Toggles the like/unlike status for the selected borough.

**response**
```json
{
  "success": true,
  "isLiked": true
}
```

---


## Running the Application

```bash
npm install
npm start
```
The application uses a pre-populated MongoDB Atlas database with sufficient test data already seeded to support all core features (users, boroughs, water samples, comments, and voting).

The server will start on:

```text
http://localhost:3000

```

---

## Notes

* AJAX is used for dynamic content loading
* Custom CSS is used throughout the application
* MongoDB is accessed via Mongoose models
* The application is tested to ensure* The application has been tested to ensure core features function as intended

```
