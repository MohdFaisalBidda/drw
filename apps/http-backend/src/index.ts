import express from 'express'
import { authRouter } from './routes/auth'
import { roomRouter } from './routes/room'
import { chatRouter } from './routes/chat'

const app = express()
const PORT = process.env.PORT || 8000

app.use(express.json())
app.use("/api/auth", authRouter)
app.use("/api/room", roomRouter)
app.use("/api/chat", chatRouter)

app.listen(PORT, () => {
    console.log(`Server running at PORT ${PORT}`);
})