const express = require('express')
const cors = require('cors')
const app = express()
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('root')
})
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    message: "Backend is healthy",
    time: new Date().toISOString(),
  });
});
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})