import express from 'express';
import prisma from '../config/db.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// @desc    Submit a new contact message
// @route   POST /api/messages
// @access  Public
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject,
        message,
      },
    });

    res.status(201).json(contactMessage);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// @desc    Get all contact messages
// @route   GET /api/messages
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server check failed' });
  }
});

// @desc    Mark a contact message as read
// @route   PUT /api/messages/:id/read
// @access  Private/Admin
router.put('/:id/read', protect, admin, async (req, res) => {
  try {
    const message = await prisma.contactMessage.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json(message);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Failed to update message' });
  }
});

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    await prisma.contactMessage.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

export default router;
