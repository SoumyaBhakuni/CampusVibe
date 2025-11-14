import db from '../models/index.js';

export const createEventRequest = async (req, res) => {
  try {
    const {
      requestorEmail,
      eventDetails,
      requestType,
      scope,
      parentFestId,
      requestedEventCount
    } = req.body;

    // The admin will review this, so we set the initial status
    const status = 'Pending_Admin';

    const newRequest = await db.EventRequest.create({
      requestorEmail,
      eventDetails,
      requestType,
      scope,
      parentFestId: parentFestId || null,
      requestedEventCount: requestedEventCount || 1,
      status,
    });

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Error creating event request:', error);
    res.status(500).json({ message: 'Error submitting request' });
  }
};