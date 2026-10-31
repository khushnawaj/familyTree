const Member = require('../models/Member');

const relationFields = ['parents', 'children', 'spouses', 'siblings'];

const normalizePayload = (body) => {
  const payload = {
    firstName: body.firstName,
    lastName: body.lastName || '',
    dob: body.dob || null,
    dod: body.dod || null,
    gender: body.gender || 'Other',
    isLiving: typeof body.isLiving === 'boolean' ? body.isLiving : true,
    bio: body.bio || '',
    imageUrl: body.imageUrl || '',
    placeOfBirth: body.placeOfBirth || '',
    placeOfDeath: body.placeOfDeath || '',
    occupation: body.occupation || ''
  };

  if (body.nodePosition) {
    payload.nodePosition = {
      x: Number(body.nodePosition.x || 0),
      y: Number(body.nodePosition.y || 0)
    };
  }

  relationFields.forEach((field) => {
    payload[field] = Array.isArray(body[field]) ? body[field].filter(Boolean) : [];
  });

  return payload;
};

const syncRelations = async (memberId, previousDoc, nextDoc, userId) => {
  const memberIdStr = String(memberId);
  const oldParents = (previousDoc.parents || []).map(String);
  const newParents = (nextDoc.parents || []).map(String);
  const oldChildren = (previousDoc.children || []).map(String);
  const newChildren = (nextDoc.children || []).map(String);
  const oldSpouses = (previousDoc.spouses || []).map(String);
  const newSpouses = (nextDoc.spouses || []).map(String);
  const oldSiblings = (previousDoc.siblings || []).map(String);
  const newSiblings = (nextDoc.siblings || []).map(String);

  const updates = [];

  // Auto-sync spouse parents: If a child adds a parent, and that parent has a spouse,
  // the spouse should also be added as a parent (unless they already are).
  if (newParents.length > oldParents.length) {
    const addedParents = newParents.filter(id => !oldParents.includes(id));
    for (const parentId of addedParents) {
      const parent = await Member.findOne({ _id: parentId, userId });
      if (parent && parent.spouses && parent.spouses.length > 0) {
        for (const spouseId of parent.spouses) {
          const spouseIdStr = String(spouseId);
          if (!newParents.includes(spouseIdStr)) {
            // Add spouse as parent to the child (memberId)
            updates.push(Member.findOneAndUpdate({ _id: memberId, userId }, { $addToSet: { parents: spouseIdStr } }));
            // Add child to the spouse's children list
            updates.push(Member.findOneAndUpdate({ _id: spouseId, userId }, { $addToSet: { children: memberIdStr } }));
          }
        }
      }
    }
  }

  // Regular Parents updates
  oldParents.filter(id => !newParents.includes(id)).forEach(id => {
    updates.push(Member.findOneAndUpdate({ _id: id, userId }, { $pull: { children: memberIdStr } }));
  });
  newParents.filter(id => !oldParents.includes(id)).forEach(id => {
    updates.push(Member.findOneAndUpdate({ _id: id, userId }, { $addToSet: { children: memberIdStr } }));
  });

  // Children updates
  oldChildren.filter(id => !newChildren.includes(id)).forEach(id => {
    updates.push(Member.findOneAndUpdate({ _id: id, userId }, { $pull: { parents: memberIdStr } }));
  });
  newChildren.filter(id => !oldChildren.includes(id)).forEach(id => {
    updates.push(Member.findOneAndUpdate({ _id: id, userId }, { $addToSet: { parents: memberIdStr } }));
  });

  // Spouses updates
  oldSpouses.filter(id => !newSpouses.includes(id)).forEach(id => {
    updates.push(Member.findOneAndUpdate({ _id: id, userId }, { $pull: { spouses: memberIdStr } }));
  });
  newSpouses.filter(id => !oldSpouses.includes(id)).forEach(id => {
    updates.push(Member.findOneAndUpdate({ _id: id, userId }, { $addToSet: { spouses: memberIdStr } }));
  });

  // Siblings updates
  oldSiblings.filter(id => !newSiblings.includes(id)).forEach(id => {
    updates.push(Member.findOneAndUpdate({ _id: id, userId }, { $pull: { siblings: memberIdStr } }));
  });
  newSiblings.filter(id => !oldSiblings.includes(id)).forEach(id => {
    updates.push(Member.findOneAndUpdate({ _id: id, userId }, { $addToSet: { siblings: memberIdStr } }));
  });

  await Promise.all(updates);
};

exports.createMember = async (req, res) => {
  try {
    if (!req.body.firstName) {
      return res.status(400).json({ error: 'First name is required' });
    }

    const memberData = { ...normalizePayload(req.body), userId: req.user._id };
    const member = await Member.create(memberData);

    await syncRelations(member._id, { parents: [], children: [], spouses: [] }, memberData, req.user._id);
    
    // Fetch the final version with synced relations
    const finalMember = await Member.findById(member._id);
    res.status(201).json(finalMember);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getMembers = async (req, res) => {
  try { 
    const members = await Member.find({ userId: req.user._id }).sort({ createdAt: -1 }); 
    res.json(members); 
  }
  catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getMember = async (req, res) => {
  try {
    const member = await Member.findOne({ _id: req.params.id, userId: req.user._id }).populate('parents spouses children');
    if (!member) return res.status(404).json({ error: 'Not found' });
    res.json(member);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateMember = async (req, res) => {
  try {
    const oldMember = await Member.findOne({ _id: req.params.id, userId: req.user._id });
    if (!oldMember) return res.status(404).json({ error: 'Not found' });

    const payload = normalizePayload(req.body);
    const member = await Member.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      payload,
      { new: true }
    );

    await syncRelations(member._id, oldMember, payload, req.user._id);

    // Fetch the final version with synced relations
    const finalMember = await Member.findById(member._id);
    res.json(finalMember);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.deleteMember = async (req, res) => {
  try {
    const member = await Member.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!member) return res.status(404).json({ error: 'Not found' });

    await Member.updateMany(
      { userId: req.user._id },
      {
        $pull: {
          parents: member._id,
          children: member._id,
          spouses: member._id,
          siblings: member._id
        }
      }
    );

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updatePositions = async (req, res) => {
  try {
    const updates = Array.isArray(req.body?.positions) ? req.body.positions : [];
    await Promise.all(
      updates.map((item) => Member.updateOne(
        { _id: item.id, userId: req.user._id },
        { $set: { nodePosition: { x: Number(item.x || 0), y: Number(item.y || 0) } } }
      ))
    );

    res.json({ success: true, count: updates.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
