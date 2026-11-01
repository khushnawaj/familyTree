const mongoose = require('mongoose');
const Member = require('../models/Member');

const relationFields = ['parents', 'children', 'spouses', 'siblings'];

const escapeRegex = (text) => {
  return String(text).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

const normalizePayload = (body) => {
  const payload = {
    firstName: (body.firstName || '').trim(),
    lastName: (body.lastName || '').trim(),
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

  const addedParents = newParents.filter(id => !oldParents.includes(id));
  const removedParents = oldParents.filter(id => !newParents.includes(id));

  // Auto-sync spouse parents: If a child adds a parent, and that parent has a spouse,
  // the spouse should also be added as a parent (unless they already are).
  if (addedParents.length > 0) {
    const parentDocs = await Member.find({ _id: { $in: addedParents }, userId }).select('spouses');
    const spouseParentIds = [];
    for (const parent of parentDocs) {
      if (parent.spouses && parent.spouses.length > 0) {
        for (const spouseId of parent.spouses) {
          const spouseIdStr = String(spouseId);
          if (!newParents.includes(spouseIdStr) && !spouseParentIds.includes(spouseIdStr)) {
            spouseParentIds.push(spouseIdStr);
          }
        }
      }
    }
    if (spouseParentIds.length > 0) {
      updates.push(Member.findOneAndUpdate({ _id: memberId, userId }, { $addToSet: { parents: { $each: spouseParentIds } } }));
      updates.push(Member.updateMany({ _id: { $in: spouseParentIds }, userId }, { $addToSet: { children: memberIdStr } }));
    }
  }

  // Batched Parents updates
  if (removedParents.length > 0) {
    updates.push(Member.updateMany({ _id: { $in: removedParents }, userId }, { $pull: { children: memberIdStr } }));
  }
  if (addedParents.length > 0) {
    updates.push(Member.updateMany({ _id: { $in: addedParents }, userId }, { $addToSet: { children: memberIdStr } }));
  }

  // Batched Children updates
  const removedChildren = oldChildren.filter(id => !newChildren.includes(id));
  const addedChildren = newChildren.filter(id => !oldChildren.includes(id));
  if (removedChildren.length > 0) {
    updates.push(Member.updateMany({ _id: { $in: removedChildren }, userId }, { $pull: { parents: memberIdStr } }));
  }
  if (addedChildren.length > 0) {
    updates.push(Member.updateMany({ _id: { $in: addedChildren }, userId }, { $addToSet: { parents: memberIdStr } }));
  }

  // Batched Spouses updates
  const removedSpouses = oldSpouses.filter(id => !newSpouses.includes(id));
  const addedSpouses = newSpouses.filter(id => !oldSpouses.includes(id));
  if (removedSpouses.length > 0) {
    updates.push(Member.updateMany({ _id: { $in: removedSpouses }, userId }, { $pull: { spouses: memberIdStr } }));
  }
  if (addedSpouses.length > 0) {
    updates.push(Member.updateMany({ _id: { $in: addedSpouses }, userId }, { $addToSet: { spouses: memberIdStr } }));
  }

  // Batched Siblings updates
  const removedSiblings = oldSiblings.filter(id => !newSiblings.includes(id));
  const addedSiblings = newSiblings.filter(id => !oldSiblings.includes(id));
  if (removedSiblings.length > 0) {
    updates.push(Member.updateMany({ _id: { $in: removedSiblings }, userId }, { $pull: { siblings: memberIdStr } }));
  }
  if (addedSiblings.length > 0) {
    updates.push(Member.updateMany({ _id: { $in: addedSiblings }, userId }, { $addToSet: { siblings: memberIdStr } }));
  }

  await Promise.all(updates);
};

exports.createMember = async (req, res) => {
  try {
    const firstName = (req.body.firstName || '').trim();
    if (!firstName) {
      return res.status(400).json({ error: 'First name is required' });
    }
    const lastName = (req.body.lastName || '').trim();

    // Check for duplicate member within user's family tree
    const duplicateQuery = {
      userId: req.user._id,
      firstName: { $regex: new RegExp(`^${escapeRegex(firstName)}$`, 'i') }
    };
    if (lastName) {
      duplicateQuery.lastName = { $regex: new RegExp(`^${escapeRegex(lastName)}$`, 'i') };
    } else {
      duplicateQuery.$or = [{ lastName: '' }, { lastName: { $exists: false } }, { lastName: null }];
    }

    const existingMember = await Member.findOne(duplicateQuery);
    if (existingMember) {
      const incomingDob = req.body.dob ? new Date(req.body.dob).toISOString().split('T')[0] : null;
      const existingDob = existingMember.dob ? new Date(existingMember.dob).toISOString().split('T')[0] : null;
      
      const isDistinct = incomingDob && existingDob && incomingDob !== existingDob;
      if (!isDistinct) {
        const fullName = [firstName, lastName].filter(Boolean).join(' ');
        return res.status(409).json({ 
          error: `A member named "${fullName}" already exists in your family tree.` 
        });
      }
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

    const firstName = req.body.firstName !== undefined ? (req.body.firstName || '').trim() : oldMember.firstName;
    if (!firstName) {
      return res.status(400).json({ error: 'First name is required' });
    }
    const lastName = req.body.lastName !== undefined ? (req.body.lastName || '').trim() : (oldMember.lastName || '');

    // Check duplicate among other members
    const duplicateQuery = {
      _id: { $ne: req.params.id },
      userId: req.user._id,
      firstName: { $regex: new RegExp(`^${escapeRegex(firstName)}$`, 'i') }
    };
    if (lastName) {
      duplicateQuery.lastName = { $regex: new RegExp(`^${escapeRegex(lastName)}$`, 'i') };
    } else {
      duplicateQuery.$or = [{ lastName: '' }, { lastName: { $exists: false } }, { lastName: null }];
    }

    const existingMember = await Member.findOne(duplicateQuery);
    if (existingMember) {
      const incomingDob = req.body.dob !== undefined 
        ? (req.body.dob ? new Date(req.body.dob).toISOString().split('T')[0] : null) 
        : (oldMember.dob ? new Date(oldMember.dob).toISOString().split('T')[0] : null);
      const existingDob = existingMember.dob ? new Date(existingMember.dob).toISOString().split('T')[0] : null;

      const isDistinct = incomingDob && existingDob && incomingDob !== existingDob;
      if (!isDistinct) {
        const fullName = [firstName, lastName].filter(Boolean).join(' ');
        return res.status(409).json({ 
          error: `Another member named "${fullName}" already exists in your family tree.` 
        });
      }
    }

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

exports.createFamilyUnit = async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      existingMemberId, 
      primary, 
      parents, 
      spouse, 
      children = [], 
      basePosition = { x: 500, y: 250 } 
    } = req.body;

    let primaryDoc = null;
    let primaryId = null;

    if (existingMemberId) {
      primaryDoc = await Member.findOne({ _id: existingMemberId, userId });
      if (!primaryDoc) {
        return res.status(404).json({ error: 'Selected member was not found' });
      }
      primaryId = primaryDoc._id;
    } else {
      if (!primary?.firstName?.trim()) {
        return res.status(400).json({ error: 'Primary member first name is required' });
      }
    }

    // 1. Collect all newly requested members for uniqueness validation
    const newMembersToValidate = [];
    if (!existingMemberId && primary) {
      newMembersToValidate.push({ role: 'Primary Member', ...primary });
    }
    if (parents?.father?.firstName?.trim()) {
      newMembersToValidate.push({ role: 'Father', ...parents.father, gender: 'Male' });
    }
    if (parents?.mother?.firstName?.trim()) {
      newMembersToValidate.push({ role: 'Mother', ...parents.mother, gender: 'Female' });
    }
    if (spouse?.firstName?.trim()) {
      newMembersToValidate.push({ 
        role: 'Spouse', 
        ...spouse, 
        gender: spouse.gender || (primaryDoc?.gender === 'Male' ? 'Female' : 'Male') 
      });
    }
    children.forEach((child, index) => {
      if (child.firstName?.trim()) {
        newMembersToValidate.push({ role: `Child ${index + 1}`, ...child });
      }
    });

    if (newMembersToValidate.length === 0) {
      return res.status(400).json({ error: 'Please enter at least one member to add' });
    }

    // A. Verify uniqueness within the submitted form payload itself
    const seenNames = new Map();
    for (const m of newMembersToValidate) {
      const first = m.firstName.trim();
      const last = (m.lastName || '').trim();
      const key = `${first.toLowerCase()} ${last.toLowerCase()}`;
      if (seenNames.has(key)) {
        return res.status(400).json({ 
          error: `Duplicate member name "${first} ${last}".trim() appears multiple times in the form (${seenNames.get(key)} and ${m.role}).` 
        });
      }
      seenNames.set(key, m.role);
    }

    // B. Verify uniqueness against existing database members
    for (const m of newMembersToValidate) {
      const first = m.firstName.trim();
      const last = (m.lastName || '').trim();
      const query = {
        userId,
        firstName: { $regex: new RegExp(`^${escapeRegex(first)}$`, 'i') }
      };
      if (last) {
        query.lastName = { $regex: new RegExp(`^${escapeRegex(last)}$`, 'i') };
      } else {
        query.$or = [{ lastName: '' }, { lastName: { $exists: false } }, { lastName: null }];
      }

      const found = await Member.findOne(query);
      if (found) {
        const incomingDob = m.dob ? new Date(m.dob).toISOString().split('T')[0] : null;
        const existingDob = found.dob ? new Date(found.dob).toISOString().split('T')[0] : null;
        const isDistinct = incomingDob && existingDob && incomingDob !== existingDob;
        if (!isDistinct) {
          const fullName = [first, last].filter(Boolean).join(' ');
          return res.status(409).json({ 
            error: `A member named "${fullName}" already exists in your family tree.` 
          });
        }
      }
    }

    // 2. Prepare Object IDs upfront for atomic bidirectional linkage
    if (!primaryId) {
      primaryId = new mongoose.Types.ObjectId();
    }
    const fatherId = parents?.father?.firstName?.trim() ? new mongoose.Types.ObjectId() : null;
    const motherId = parents?.mother?.firstName?.trim() ? new mongoose.Types.ObjectId() : null;
    const spouseId = spouse?.firstName?.trim() ? new mongoose.Types.ObjectId() : null;

    const validChildren = children.filter(c => c.firstName?.trim());
    const childIds = validChildren.map(() => new mongoose.Types.ObjectId());

    const docsToInsert = [];
    const posX = existingMemberId ? (primaryDoc.nodePosition?.x || basePosition.x) : basePosition.x;
    const posY = existingMemberId ? (primaryDoc.nodePosition?.y || basePosition.y) : basePosition.y;

    // A. Parents Documents
    const newParentIds = [fatherId, motherId].filter(Boolean);
    if (fatherId) {
      docsToInsert.push({
        _id: fatherId,
        userId,
        firstName: parents.father.firstName.trim(),
        lastName: (parents.father.lastName || primaryDoc?.lastName || primary?.lastName || '').trim(),
        gender: 'Male',
        isLiving: parents.father.isLiving !== false,
        dob: parents.father.dob || null,
        occupation: parents.father.occupation || '',
        nodePosition: { x: posX - 120, y: posY - 220 },
        spouses: motherId ? [motherId] : [],
        children: [primaryId],
        parents: [],
        siblings: []
      });
    }

    if (motherId) {
      docsToInsert.push({
        _id: motherId,
        userId,
        firstName: parents.mother.firstName.trim(),
        lastName: (parents.mother.lastName || '').trim(),
        gender: 'Female',
        isLiving: parents.mother.isLiving !== false,
        dob: parents.mother.dob || null,
        occupation: parents.mother.occupation || '',
        nodePosition: { x: posX + 120, y: posY - 220 },
        spouses: fatherId ? [fatherId] : [],
        children: [primaryId],
        parents: [],
        siblings: []
      });
    }

    // B. Spouse Document
    if (spouseId) {
      docsToInsert.push({
        _id: spouseId,
        userId,
        firstName: spouse.firstName.trim(),
        lastName: (spouse.lastName || '').trim(),
        gender: spouse.gender || (primaryDoc?.gender === 'Male' ? 'Female' : 'Male'),
        isLiving: spouse.isLiving !== false,
        dob: spouse.dob || null,
        occupation: spouse.occupation || '',
        nodePosition: { x: posX + 240, y: posY },
        spouses: [primaryId],
        children: childIds,
        parents: [],
        siblings: []
      });
    }

    // C. Children Documents
    const effectiveParentIds = [primaryId, spouseId].filter(Boolean);
    validChildren.forEach((child, idx) => {
      const cId = childIds[idx];
      const otherSiblingIds = childIds.filter(id => !id.equals(cId));
      
      // Calculate smooth horizontal spacing for children below
      const totalWidth = (validChildren.length - 1) * 220;
      const childX = posX + (idx * 220) - (totalWidth / 2) + (spouseId ? 110 : 0);
      const childY = posY + 220;

      docsToInsert.push({
        _id: cId,
        userId,
        firstName: child.firstName.trim(),
        lastName: (child.lastName || primaryDoc?.lastName || primary?.lastName || '').trim(),
        gender: child.gender || 'Other',
        dob: child.dob || null,
        isLiving: child.isLiving !== false,
        occupation: child.occupation || '',
        nodePosition: { x: childX, y: childY },
        parents: effectiveParentIds,
        siblings: otherSiblingIds,
        spouses: [],
        children: []
      });
    });

    // D. Primary Member Document (if new)
    if (!existingMemberId) {
      docsToInsert.push({
        _id: primaryId,
        userId,
        firstName: primary.firstName.trim(),
        lastName: (primary.lastName || '').trim(),
        gender: primary.gender || 'Male',
        dob: primary.dob || null,
        isLiving: primary.isLiving !== false,
        occupation: primary.occupation || '',
        nodePosition: { x: posX, y: posY },
        parents: newParentIds,
        spouses: spouseId ? [spouseId] : [],
        children: childIds,
        siblings: []
      });
    } else {
      // If primary already exists, update its relations
      const updates = {};
      if (newParentIds.length > 0) {
        updates.$addToSet = updates.$addToSet || {};
        updates.$addToSet.parents = { $each: newParentIds };
      }
      if (spouseId) {
        updates.$addToSet = updates.$addToSet || {};
        updates.$addToSet.spouses = spouseId;
      }
      if (childIds.length > 0) {
        updates.$addToSet = updates.$addToSet || {};
        updates.$addToSet.children = { $each: childIds };
      }

      if (Object.keys(updates).length > 0) {
        await Member.updateOne({ _id: existingMemberId, userId }, updates);
      }
    }

    // 3. Batch insert in a single operation
    if (docsToInsert.length > 0) {
      await Member.insertMany(docsToInsert);
    }

    res.status(201).json({
      success: true,
      createdCount: docsToInsert.length,
      primaryId
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
