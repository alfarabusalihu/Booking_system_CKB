import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sri Lanka Train Reservation Backend Running' });
});

app.listen(PORT, () => {
  console.log(`[BACKEND] Server listening on http://localhost:${PORT}`);
});
