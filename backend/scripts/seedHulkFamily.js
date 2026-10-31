require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Member = require('../models/Member');

const userSeed = {
  username: 'hulk.seed',
  email: 'hulk.seed@example.com',
  password: 'HulkSeed@123',
  firstName: 'Bruce',
  lastName: 'Banner'
};

const createMemberDoc = (userId, config) => ({
  userId,
  firstName: config.firstName,
  lastName: config.lastName || '',
  gender: config.gender || 'Other',
  isLiving: typeof config.isLiving === 'boolean' ? config.isLiving : true,
  bio: config.bio || '',
  occupation: config.occupation || '',
  placeOfBirth: config.placeOfBirth || '',
  placeOfDeath: config.placeOfDeath || '',
  dob: config.dob ? new Date(config.dob) : null,
  dod: config.dod ? new Date(config.dod) : null,
  imageUrl: '',
  nodePosition: config.nodePosition || { x: 0, y: 0 },
  parents: [],
  children: [],
  spouses: []
});

const setParentChild = (map, parentKey, childKey) => {
  const parent = map[parentKey];
  const child = map[childKey];
  if (!parent || !child) return;
  parent.children.push(child._id);
  child.parents.push(parent._id);
};

const setSpouse = (map, firstKey, secondKey) => {
  const first = map[firstKey];
  const second = map[secondKey];
  if (!first || !second) return;
  first.spouses.push(second._id);
  second.spouses.push(first._id);
};

const buildFamilyConfigs = () => ([
  {
    key: 'joshuaBanner',
    firstName: 'Joshua',
    lastName: 'Banner',
    gender: 'Male',
    isLiving: false,
    bio: 'Paternal grandfather in Banner family records.',
    occupation: 'Factory Supervisor',
    nodePosition: { x: -640, y: -420 }
  },
  {
    key: 'pamelaBanner',
    firstName: 'Pamela',
    lastName: 'Banner',
    gender: 'Female',
    isLiving: false,
    bio: 'Paternal grandmother remembered for protecting family.',
    occupation: 'Homemaker',
    nodePosition: { x: -360, y: -420 }
  },
  {
    key: 'brianBanner',
    firstName: 'Brian',
    lastName: 'Banner',
    gender: 'Male',
    isLiving: false,
    bio: 'Father of Bruce Banner.',
    occupation: 'Nuclear Physicist',
    nodePosition: { x: -520, y: -220 }
  },
  {
    key: 'rebeccaBanner',
    firstName: 'Rebecca',
    lastName: 'Banner',
    gender: 'Female',
    isLiving: false,
    bio: 'Mother of Bruce Banner.',
    occupation: 'Teacher',
    nodePosition: { x: -220, y: -220 }
  },
  {
    key: 'bruceBanner',
    firstName: 'Bruce',
    lastName: 'Banner',
    gender: 'Male',
    isLiving: true,
    bio: 'Brilliant scientist also known as Hulk.',
    occupation: 'Gamma Physicist',
    nodePosition: { x: -360, y: 40 }
  },
  {
    key: 'thaddeusRoss',
    firstName: 'Thaddeus',
    lastName: 'Ross',
    gender: 'Male',
    isLiving: false,
    bio: 'Military general and father of Betty Ross.',
    occupation: 'General',
    nodePosition: { x: 220, y: -220 }
  },
  {
    key: 'elizabethRoss',
    firstName: 'Elizabeth',
    lastName: 'Ross',
    gender: 'Female',
    isLiving: false,
    bio: 'Mother of Betty Ross.',
    occupation: 'Scientist',
    nodePosition: { x: 520, y: -220 }
  },
  {
    key: 'bettyRoss',
    firstName: 'Betty',
    lastName: 'Ross',
    gender: 'Female',
    isLiving: true,
    bio: 'Scientist and longtime partner of Bruce Banner.',
    occupation: 'Cell Biologist',
    nodePosition: { x: 40, y: 40 }
  },
  {
    key: 'skaar',
    firstName: 'Skaar',
    lastName: 'Banner',
    gender: 'Male',
    isLiving: true,
    bio: 'Son of Hulk from Sakaar lineage.',
    occupation: 'Warrior',
    nodePosition: { x: -460, y: 380 }
  },
  {
    key: 'hiroKala',
    firstName: 'Hiro-Kala',
    lastName: 'Banner',
    gender: 'Male',
    isLiving: false,
    bio: 'Other son of Hulk and Caiera on Sakaar.',
    occupation: 'Prince',
    nodePosition: { x: -680, y: 380 }
  },
  {
    key: 'caiera',
    firstName: 'Caiera',
    lastName: 'Oldstrong',
    gender: 'Female',
    isLiving: false,
    bio: 'Warrior of Sakaar and wife of Hulk.',
    occupation: 'Shadow Queen',
    nodePosition: { x: -580, y: 160 }
  },
  {
    key: 'thundra',
    firstName: 'Thundra',
    lastName: '',
    gender: 'Female',
    isLiving: true,
    bio: 'Warrior queen from the future.',
    occupation: 'Queen',
    nodePosition: { x: -840, y: 160 }
  },
  {
    key: 'lyra',
    firstName: 'Lyra',
    lastName: 'Banner',
    gender: 'Female',
    isLiving: true,
    bio: 'Daughter of Hulk and Thundra.',
    occupation: 'Agent of ARMOR',
    nodePosition: { x: -900, y: 380 }
  },
  {
    key: 'jenniferWalters',
    firstName: 'Jennifer',
    lastName: 'Walters',
    gender: 'Female',
    isLiving: true,
    bio: 'Cousin of Bruce Banner, also known as She-Hulk.',
    occupation: 'Attorney',
    nodePosition: { x: -40, y: 280 }
  },
  {
    key: 'elaineBanner',
    firstName: 'Elaine',
    lastName: 'Banner',
    gender: 'Female',
    isLiving: false,
    bio: 'Aunt in Banner family branch.',
    occupation: 'Nurse',
    nodePosition: { x: -120, y: 40 }
  },
  {
    key: 'morrisWalters',
    firstName: 'Morris',
    lastName: 'Walters',
    gender: 'Male',
    isLiving: false,
    bio: 'Father of Jennifer Walters.',
    occupation: 'Judge',
    nodePosition: { x: 200, y: 40 }
  }
]);

const seed = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required in environment');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existingUser = await User.findOne({ email: userSeed.email });
  let userId = existingUser?._id || null;

  if (userId) {
    await Member.deleteMany({ userId });
  } else {
    const hashedPassword = await bcrypt.hash(userSeed.password, 10);
    const user = await User.create({ ...userSeed, password: hashedPassword });
    userId = user._id;
  }

  const configs = buildFamilyConfigs();
  const createdDocs = await Member.insertMany(configs.map((cfg) => createMemberDoc(userId, cfg)));
  const map = {};
  configs.forEach((cfg, idx) => { map[cfg.key] = createdDocs[idx]; });

  setSpouse(map, 'joshuaBanner', 'pamelaBanner');
  setSpouse(map, 'brianBanner', 'rebeccaBanner');
  setSpouse(map, 'thaddeusRoss', 'elizabethRoss');
  setSpouse(map, 'bruceBanner', 'bettyRoss');
  setSpouse(map, 'bruceBanner', 'caiera');
  setSpouse(map, 'bruceBanner', 'thundra');
  setSpouse(map, 'elaineBanner', 'morrisWalters');

  setParentChild(map, 'joshuaBanner', 'brianBanner');
  setParentChild(map, 'pamelaBanner', 'brianBanner');
  setParentChild(map, 'brianBanner', 'bruceBanner');
  setParentChild(map, 'rebeccaBanner', 'bruceBanner');
  setParentChild(map, 'thaddeusRoss', 'bettyRoss');
  setParentChild(map, 'elizabethRoss', 'bettyRoss');
  setParentChild(map, 'bruceBanner', 'skaar');
  setParentChild(map, 'bettyRoss', 'skaar');
  setParentChild(map, 'caiera', 'skaar');
  setParentChild(map, 'caiera', 'hiroKala');
  setParentChild(map, 'bruceBanner', 'hiroKala');
  setParentChild(map, 'thundra', 'lyra');
  setParentChild(map, 'bruceBanner', 'lyra');
  setParentChild(map, 'elaineBanner', 'jenniferWalters');
  setParentChild(map, 'morrisWalters', 'jenniferWalters');

  await Promise.all(Object.values(map).map((doc) => doc.save()));

  console.log('Hulk family seed complete.');
  console.log(`User: ${userSeed.email}`);
  console.log(`Password: ${userSeed.password}`);
  console.log(`Members created: ${createdDocs.length}`);
};

seed()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
