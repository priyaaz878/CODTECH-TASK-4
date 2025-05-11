const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const Document = require('./models/Document');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/collab', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// API route to get or create a document
app.get('/api/documents/:id', async (req, res) => {
    let doc = await Document.findById(req.params.id);
    if (!doc) {
        doc = await Document.create({ _id: req.params.id, content: '' });
    }
    res.json(doc);
});

// API route to update a document
app.post('/api/documents', async (req, res) => {
    const { _id, content } = req.body;
    const doc = await Document.findByIdAndUpdate(_id, { content }, { new: true });
    res.json(doc);
});

// Socket.io for real-time editing
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('join', (docId) => {
        socket.join(docId);
        console.log(`Client joined document: ${docId}`);

        socket.on('edit', (newContent) => {
            socket.to(docId).emit('update', newContent);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
});

// Start server
const PORT = 4000;
server.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
