# Real-Time MERN Chat Application

A full-stack, real-time chat application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) and Socket.IO. This project includes one-on-one messaging, group chats, user authentication, and a host of modern features.

## Live Demo

**[Click here to view the live application](chats-app-five.vercel.app)**

## Screenshot

![Chat App Screenshot](https://imgur.com/a/unZUvjm)

## Features

- **Full User Authentication**: Secure user registration and login using JWT and Google OAuth 2.0.
- **Real-Time Messaging**: Instant one-on-one and group messaging powered by Socket.IO.
- **Group Management**: Users can create, join, and delete group chats.
- **Rich Media Sharing**: Share images within chats, with a clickable lightbox for full-size viewing.
- **Advanced Messaging Features**:
  - Edit & Delete sent messages.
  - Reply to specific messages.
  - Real-time typing indicators for both private and group chats.
- **User Presence**: See which users are currently online.
- **Notifications**: Unread message counts and browser push notifications for offline users.
- **User Profiles**: Users can edit their profile information and upload a custom avatar.
- **Modern UI/UX**:
  - Fully responsive design for desktop and mobile.
  - Light/Dark mode toggle.
  - Emoji picker for messages.
  - Infinite scrolling to load older messages on demand.

## Tech Stack

- **Frontend**: React.js, Context API, Axios, Socket.IO Client
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Real-Time**: Socket.IO
- **Authentication**: JSON Web Token (JWT), Passport.js (for Google OAuth)
- **File Uploads**: Multer
- **Deployment**:
  - Frontend on Vercel
  - Backend on Render
  - Database on MongoDB Atlas

## Local Setup & Installation

To run this project on your local machine, follow these steps:

### Prerequisites
- Node.js installed
- MongoDB installed locally or a MongoDB Atlas account

### 1. Clone the repository
```bash
git clone [https://github.com/nishanthapa55/ChatsApp.git](https://github.com/nishanthapa55/ChatsApp.git)
cd ChatsApp