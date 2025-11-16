import db from '../models/index.js'; 
import { sendResourceRequestMail } from '../utils/mailer.js';

export const addEventRequirement = async (req, res) => {
  const { eventId } = req.params;
  const { items } = req.body; // Expecting: items = [{ resourceId: 'R1', quantity: 10 }, ...]
  const organizer = req.user; 
  const t = await db.sequelize.transaction();

  try {
    const event = await db.Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // --- FIX: Filter out invalid/empty items before processing ---
    // This ensures only items with a string ID and quantity > 0 are processed.
    const validItems = items.filter(item => 
        item.resourceId && item.resourceId.length > 0 && item.quantity > 0
    );

    if (validItems.length === 0) {
        await t.rollback();
        // Return 400 if the request contained no valid resources
        return res.status(400).json({ message: 'No valid resources selected or quantities are zero.' });
    }
    // -----------------------------------------------------------
    
    const requirementPromises = validItems.map(item => 
      db.EventRequirement.create({
        eventId,
        resourceId: item.resourceId, // Now guaranteed to be a non-null string
        quantity: item.quantity,
        status: 'Pending',
      }, { transaction: t })
    );
    const createdRequirements = await Promise.all(requirementPromises);

    const resourceIds = validItems.map(item => item.resourceId);
    const resources = await db.Resource.findAll({
      where: { resourceId: resourceIds },
      include: [{ model: db.Employee, as: 'Incharge', attributes: ['email', 'name'] }]
    });

    const mailMap = new Map();
    for (const reqItem of createdRequirements) {
      const resource = resources.find(r => r.resourceId === reqItem.resourceId);
      if (resource && resource.Incharge) {
        const inchargeEmail = resource.Incharge.email;
        const inchargeName = resource.Incharge.name;
        
        if (!mailMap.has(inchargeEmail)) {
          mailMap.set(inchargeEmail, { inchargeName, items: [] });
        }
        
        mailMap.get(inchargeEmail).items.push({
          name: resource.resourceName,
          quantity: reqItem.quantity,
        });
      }
    }

    const mailPromises = [];
    const organizerUser = await db.User.findByPk(organizer.id); // Get organizer's email
    
    for (const [inchargeEmail, data] of mailMap.entries()) {
      mailPromises.push(
        sendResourceRequestMail({
          inchargeEmail: inchargeEmail,
          inchargeName: data.inchargeName,
          organizerName: organizerUser.email, 
          event,
          items: data.items,
        })
      );
    }
    await Promise.all(mailPromises);
    
    await t.commit();
    res.status(201).json({ message: 'Requirements submitted and emails sent.', data: createdRequirements });

  } catch (error) {
    await t.rollback();
    console.error('Error submitting requirements:', error);
    res.status(500).json({ message: 'Error submitting requirements' });
  }
};