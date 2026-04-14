# DiaBEATS Backend API

A Node.js + Express + MongoDB backend for the DiaBEATS diabetes nutrition tracking app.

---

## Quick Start

### 1. Install dependencies
```bash
cd diabeats-backend
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Then open `.env` and fill in:
- `MONGO_URI` — your MongoDB Atlas connection string
- `JWT_SECRET` — any long random string
- `ANTHROPIC_API_KEY` — your Anthropic key (optional, for server-side AI)

### 3. Get a free MongoDB database
1. Go to https://www.mongodb.com/atlas
2. Create a free account → Create a free cluster
3. Click **Connect** → **Connect your application**
4. Copy the connection string and paste it into `MONGO_URI` in your `.env`
5. Replace `<password>` with your database user password

### 4. Run the server
```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

Server runs on **http://localhost:5000**

---

## Connect the Frontend

In your `index.html` (the DiaBEATS frontend), set:
```javascript
const API_BASE = 'http://localhost:5000/api'; // local
// or
const API_BASE = 'https://your-deployed-backend.railway.app/api'; // deployed
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create new account | No |
| POST | `/api/auth/login` | Sign in | No |
| GET | `/api/auth/me` | Get my profile | Yes |
| PUT | `/api/auth/me` | Update my profile | Yes |

**Register body:**
```json
{
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "password": "secret123",
  "diabetesType": "type2",
  "language": "fr"
}
```

**Login body:**
```json
{ "email": "jean@example.com", "password": "secret123" }
```

**Response (both):**
```json
{
  "_id": "...",
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "diabetesType": "type2",
  "language": "fr",
  "dailyCalorieGoal": 1800,
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

All protected routes need this header:
```
Authorization: Bearer <token>
```

---

### Meals
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/meals` | Log a new meal | Yes |
| GET | `/api/meals` | Get all my meals | Yes |
| GET | `/api/meals/today` | Today's meals + summary | Yes |
| GET | `/api/meals/stats` | Weekly stats | Yes |
| DELETE | `/api/meals/:id` | Delete a meal | Yes |

**Log meal body:**
```json
{
  "mealName": "Groundnut Soup + Rice",
  "scanMethod": "camera",
  "calories": 540,
  "carbohydrates": 72,
  "protein": 18,
  "fat": 22,
  "fiber": 4,
  "sugar": 3,
  "glycemicIndex": "high",
  "safetyLevel": "caution",
  "diabetesAdvice": "High GI — reduce portion size.",
  "confidencePct": 88
}
```

---

### Community Posts
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/posts` | Get all posts | Yes |
| POST | `/api/posts` | Create a post | Yes |
| PUT | `/api/posts/:id/like` | Like/unlike a post | Yes |
| POST | `/api/posts/:id/reply` | Reply to a post | Yes |
| DELETE | `/api/posts/:id` | Delete own post | Yes |

**Create post body:**
```json
{
  "content": "Replaced white rice with cauliflower rice and my blood sugar improved!",
  "tag": "Meal Tips"
}
```
Tags: `Meal Tips`, `Question`, `Recipe`, `Success Story`, `General`

---

### AI Proxy (server-side key)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/ai/analyze` | Analyze a meal (text or image) | Yes |
| POST | `/api/ai/chat` | Chat with AI assistant | Yes |

**Analyze body:**
```json
{ "prompt": "Rice and beans, 1 cup each" }
```
Or with image:
```json
{ "prompt": "Analyze this meal", "imageBase64": "data:image/jpeg;base64,..." }
```

---

## Deploy to Railway (Free)

1. Push this folder to a GitHub repo
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Add environment variables in the Railway dashboard
4. Railway gives you a public URL like `https://diabeats-backend.up.railway.app`
5. Update the `API_BASE` in your frontend HTML to that URL

---

## Project Structure

```
diabeats-backend/
├── server.js          ← Entry point
├── config/
│   └── db.js          ← MongoDB connection
├── models/
│   ├── User.js        ← User schema
│   ├── Meal.js        ← Meal log schema
│   └── Post.js        ← Community post schema
├── routes/
│   ├── auth.js        ← Register, login, profile
│   ├── meals.js       ← Meal CRUD
│   ├── posts.js       ← Community posts
│   └── ai.js          ← Anthropic AI proxy
├── middleware/
│   └── auth.js        ← JWT verification
├── .env.example       ← Environment variable template
└── package.json
```
