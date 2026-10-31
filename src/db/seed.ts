import { db } from './database';

function uuid() {
  return crypto.randomUUID();
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

export async function seedDatabase(force = false) {
  if (!force) {
    const existing = await db.households.count();
    if (existing > 0) return; // already seeded
  }

  const now = new Date().toISOString();

  // ── Household ──────────────────────────────────────────
  const householdId = 'hh-alex-001';
  await db.households.add({
    id: householdId,
    name: "Alex's Family",
    createdAt: now,
    updatedAt: now,
  });

  // ── Family Members ─────────────────────────────────────
  const alexId   = 'fm-alex-001';
  const samId    = 'fm-sam-001';
  const jamieId  = 'fm-jamie-001';

  await db.familyMembers.bulkAdd([
    {
      id: alexId,
      householdId,
      name: 'Alex',
      role: 'Owner / Primary Caretaker',
      responsibilities: ['Pet profiles', 'Posting jobs', 'Approvals'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: samId,
      householdId,
      name: 'Sam',
      role: 'Family Helper',
      responsibilities: ['Walks', 'Play sessions'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: jamieId,
      householdId,
      name: 'Jamie',
      role: 'Family Helper',
      responsibilities: ['Grooming', 'Memories'],
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // ── Pets ───────────────────────────────────────────────
  const brunoId = 'pet-bruno-001';
  const lunaId  = 'pet-luna-001';

  await db.pets.bulkAdd([
    {
      id: brunoId,
      householdId,
      name: 'Bruno',
      species: 'Dog',
      breed: 'Golden Retriever',
      birthDate: '2021-05-15',
      notes: 'Loves fetch and swimming. Allergic to chicken. Needs 2 walks daily.',
      photoUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop',
      createdAt: daysAgo(90),
      updatedAt: now,
    },
    {
      id: lunaId,
      householdId,
      name: 'Luna',
      species: 'Cat',
      breed: 'Domestic Shorthair',
      birthDate: '2022-03-20',
      notes: 'Indoor cat. Shy with strangers. Loves the laser pointer and cozy spots.',
      photoUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop',
      createdAt: daysAgo(60),
      updatedAt: now,
    },
  ]);

  // ── Caretaker Profile ──────────────────────────────────
  const riyaId = 'ct-riya-001';
  await db.caretakerProfiles.add({
    id: riyaId,
    displayName: 'Riya Sharma',
    bio: 'Passionate pet lover with 3+ years caring for dogs and cats. Certified in pet first aid. Available weekends and holidays.',
    experienceYears: 3,
    skills: ['Dog Walking', 'Feeding', 'Grooming Assistance', 'Medication', 'Companionship'],
    availability: 'Weekends, Holidays',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    rating: 4.9,
    completedJobs: 24,
    createdAt: daysAgo(120),
    updatedAt: now,
  });

  // ── Care Opportunities ─────────────────────────────────
  const job1Id = 'job-001';
  const job2Id = 'job-002';
  const job3Id = 'job-003';

  await db.careOpportunities.bulkAdd([
    {
      id: job1Id,
      ownerHouseholdId: householdId,
      petId: brunoId,
      title: 'Weekend Care for Bruno',
      description: 'Bruno needs company, 2 walks a day, and meals while I am away for the weekend. He loves fetch in the park!',
      startAt: daysFromNow(5),
      endAt: daysFromNow(7),
      location: 'Koramangala, Bengaluru',
      offeredAmountINR: 800,
      status: 'filled',
      tasks: ['Morning walk (30 min)', 'Evening walk (30 min)', 'Breakfast feeding', 'Dinner feeding', 'Playtime / fetch'],
      createdAt: daysAgo(5),
      updatedAt: daysAgo(2),
    },
    {
      id: job2Id,
      ownerHouseholdId: householdId,
      petId: lunaId,
      title: 'Luna Home Sitting — 3 Days',
      description: 'Luna is shy but warms up quickly. She needs feeding twice a day, litter cleaning, and some playtime.',
      startAt: daysFromNow(10),
      endAt: daysFromNow(13),
      location: 'Indiranagar, Bengaluru',
      offeredAmountINR: 600,
      status: 'open',
      tasks: ['Morning feeding', 'Evening feeding', 'Litter cleaning', 'Play session (laser/toy)'],
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      id: job3Id,
      ownerHouseholdId: householdId,
      petId: brunoId,
      title: 'Daily Dog Walk — Next Week',
      description: 'Need someone reliable to walk Bruno every morning for a week while I have early office meetings.',
      startAt: daysFromNow(3),
      endAt: daysFromNow(10),
      location: 'Koramangala, Bengaluru',
      offeredAmountINR: 1200,
      status: 'open',
      tasks: ['Morning walk (45 min)', 'Post-walk brushing'],
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
  ]);

  // ── Applications ───────────────────────────────────────
  const app1Id = 'app-001';

  await db.applications.bulkAdd([
    {
      id: app1Id,
      opportunityId: job1Id,
      caretakerId: riyaId,
      message: "Hi! I'd love to care for Bruno this weekend. I have experience with Golden Retrievers and live nearby. Bruno will be in great hands!",
      status: 'selected',
      appliedAt: daysAgo(4),
      updatedAt: daysAgo(2),
    },
  ]);

  // ── Assignments ────────────────────────────────────────
  const assign1Id = 'assign-001';
  await db.assignments.add({
    id: assign1Id,
    opportunityId: job1Id,
    caretakerId: riyaId,
    applicationId: app1Id,
    agreedAmountINR: 800,
    status: 'in_progress',
    acceptedAt: daysAgo(2),
    createdAt: daysAgo(2),
    updatedAt: now,
  });

  // ── Routines ───────────────────────────────────────────
  await db.routines.bulkAdd([
    {
      id: uuid(),
      petId: brunoId,
      assignmentId: assign1Id,
      title: 'Morning Walk',
      type: 'walking',
      time: '07:00',
      recurrence: 'daily',
      assignedMemberId: riyaId,
      active: true,
      createdAt: daysAgo(2),
      updatedAt: now,
    },
    {
      id: uuid(),
      petId: brunoId,
      title: 'Evening Walk',
      type: 'walking',
      time: '18:00',
      recurrence: 'daily',
      assignedMemberId: samId,
      active: true,
      createdAt: daysAgo(30),
      updatedAt: now,
    },
    {
      id: uuid(),
      petId: brunoId,
      title: 'Breakfast',
      type: 'feeding',
      time: '08:00',
      recurrence: 'daily',
      assignedMemberId: alexId,
      active: true,
      createdAt: daysAgo(30),
      updatedAt: now,
    },
    {
      id: uuid(),
      petId: lunaId,
      title: 'Luna Morning Meal',
      type: 'feeding',
      time: '08:30',
      recurrence: 'daily',
      assignedMemberId: alexId,
      active: true,
      createdAt: daysAgo(30),
      updatedAt: now,
    },
    {
      id: uuid(),
      petId: brunoId,
      title: 'Weekly Grooming',
      type: 'grooming',
      time: '10:00',
      recurrence: 'weekly',
      assignedMemberId: jamieId,
      active: true,
      createdAt: daysAgo(30),
      updatedAt: now,
    },
  ]);

  // ── Care Tasks ─────────────────────────────────────────
  await db.careTasks.bulkAdd([
    {
      id: 'task-001',
      petId: brunoId,
      assignmentId: assign1Id,
      title: 'Morning walk (30 min)',
      dueAt: daysAgo(1),
      status: 'completed',
      completedAt: daysAgo(1),
      completedBy: riyaId,
      notes: 'Bruno was super energetic! Did an extra 10 minutes in the park.',
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      id: 'task-002',
      petId: brunoId,
      assignmentId: assign1Id,
      title: 'Breakfast feeding',
      dueAt: daysAgo(1),
      status: 'completed',
      completedAt: daysAgo(1),
      completedBy: riyaId,
      notes: 'Finished his whole bowl.',
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      id: 'task-003',
      petId: brunoId,
      assignmentId: assign1Id,
      title: 'Evening walk (30 min)',
      dueAt: new Date().toISOString(),
      status: 'pending',
      createdAt: daysAgo(2),
      updatedAt: now,
    },
    {
      id: 'task-004',
      petId: brunoId,
      assignmentId: assign1Id,
      title: 'Dinner feeding',
      dueAt: new Date().toISOString(),
      status: 'pending',
      createdAt: daysAgo(2),
      updatedAt: now,
    },
  ]);

  // ── Health Records ─────────────────────────────────────
  await db.careRecords.bulkAdd([
    {
      id: uuid(),
      petId: brunoId,
      type: 'vaccination',
      title: 'Rabies Vaccine',
      eventDate: daysAgo(120),
      nextDueDate: daysFromNow(245),
      notes: 'Annual rabies booster administered.',
      provider: 'Dr. Arjun — PetCare Clinic',
      createdAt: daysAgo(120),
      updatedAt: daysAgo(120),
    },
    {
      id: uuid(),
      petId: brunoId,
      type: 'vaccination',
      title: 'DHPP (Combo)',
      eventDate: daysAgo(180),
      nextDueDate: daysFromNow(185),
      notes: 'Distemper, Hepatitis, Parvovirus, Parainfluenza combo.',
      provider: 'Dr. Arjun — PetCare Clinic',
      createdAt: daysAgo(180),
      updatedAt: daysAgo(180),
    },
    {
      id: uuid(),
      petId: brunoId,
      type: 'grooming',
      title: 'Full Grooming Session',
      eventDate: daysAgo(14),
      nextDueDate: daysFromNow(14),
      notes: 'Bath, blow dry, nail trim, ear cleaning.',
      provider: 'Pawsome Spa',
      createdAt: daysAgo(14),
      updatedAt: daysAgo(14),
    },
    {
      id: uuid(),
      petId: brunoId,
      type: 'vet_visit',
      title: 'Annual Checkup',
      eventDate: daysAgo(30),
      nextDueDate: daysFromNow(335),
      notes: 'All vitals normal. Weight 28 kg. Healthy!',
      provider: 'Dr. Arjun — PetCare Clinic',
      createdAt: daysAgo(30),
      updatedAt: daysAgo(30),
    },
    {
      id: uuid(),
      petId: lunaId,
      type: 'vaccination',
      title: 'Feline Combo Vaccine',
      eventDate: daysAgo(90),
      nextDueDate: daysFromNow(275),
      notes: 'FVRCP combo. Luna was a brave girl!',
      provider: 'Dr. Priya — CatCare Clinic',
      createdAt: daysAgo(90),
      updatedAt: daysAgo(90),
    },
    {
      id: uuid(),
      petId: lunaId,
      type: 'vet_visit',
      title: 'Dental Checkup',
      eventDate: daysAgo(45),
      nextDueDate: daysFromNow(320),
      notes: 'Mild tartar on upper molars. Recommended dental treats.',
      provider: 'Dr. Priya — CatCare Clinic',
      createdAt: daysAgo(45),
      updatedAt: daysAgo(45),
    },
  ]);

  // ── Earnings ───────────────────────────────────────────
  await db.earningsEntries.add({
    id: 'earn-001',
    assignmentId: assign1Id,
    caretakerId: riyaId,
    amountINR: 800,
    status: 'pending',
    createdAt: daysAgo(2),
    updatedAt: now,
  });

  // ── Memories ──────────────────────────────────────────
  await db.memories.bulkAdd([
    {
      id: uuid(),
      petId: brunoId,
      title: "Bruno's First Beach Trip",
      caption: 'Bruno ran into the waves for the first time. He was a little scared at first, then absolutely loved it!',
      occurredAt: daysAgo(200),
      photoUrl: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=600&h=400&fit=crop',
      milestone: true,
      createdAt: daysAgo(200),
      updatedAt: daysAgo(200),
    },
    {
      id: uuid(),
      petId: lunaId,
      title: "Luna's First Birthday",
      caption: "We made a tiny tuna cake for Luna's birthday. She inspected it for 10 minutes before taking one small bite.",
      occurredAt: daysAgo(180),
      photoUrl: 'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=600&h=400&fit=crop',
      milestone: true,
      createdAt: daysAgo(180),
      updatedAt: daysAgo(180),
    },
    {
      id: uuid(),
      petId: brunoId,
      title: 'Park Playdate with Max',
      caption: 'Bruno met his best friend Max the Labrador at Cubbon Park. They played fetch together for 2 hours!',
      occurredAt: daysAgo(45),
      photoUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop',
      milestone: false,
      createdAt: daysAgo(45),
      updatedAt: daysAgo(45),
    },
    {
      id: uuid(),
      petId: lunaId,
      title: 'Luna Discovers the Sunny Spot',
      caption: "Found Luna sleeping in a perfect sunbeam on the kitchen floor. She looked so peaceful we didn't have the heart to move her.",
      occurredAt: daysAgo(20),
      photoUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&h=400&fit=crop',
      milestone: false,
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
    },
    {
      id: uuid(),
      petId: brunoId,
      title: "Bruno's Care by Riya",
      caption: 'Riya completed the weekend care assignment beautifully. Bruno was happy and well-fed!',
      occurredAt: daysAgo(1),
      milestone: false,
      linkedCompletionId: 'task-001',
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
  ]);

  // ── AI Checklists ─────────────────────────────────────
  await db.checklists.add({
    id: uuid(),
    petId: brunoId,
    title: 'Weekend Care Checklist for Bruno',
    sourceInstructions: 'Bruno needs walks, feeding, and companionship. He has no allergies to fish or beef.',
    status: 'approved',
    items: [
      { id: uuid(), text: 'Morning walk — minimum 30 minutes, off-leash if safe area', done: true },
      { id: uuid(), text: 'Breakfast — 1.5 cups dry food (fish/beef flavour only)', done: true },
      { id: uuid(), text: 'Fresh water — refill bowl twice daily', done: true },
      { id: uuid(), text: 'Evening walk — minimum 30 minutes', done: false },
      { id: uuid(), text: 'Dinner — 1.5 cups dry food', done: false },
      { id: uuid(), text: 'Playtime — 15 minutes fetch or tug-of-war', done: false },
      { id: uuid(), text: 'Check paws for cuts or debris after each walk', done: false },
      { id: uuid(), text: 'Brush coat briefly before bedtime', done: false },
    ],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
  });

  console.log('✅ PawCircle demo data seeded successfully.');
}

export async function resetDemoDatabase() {
  await Promise.all([
    db.households.clear(),
    db.familyMembers.clear(),
    db.pets.clear(),
    db.caretakerProfiles.clear(),
    db.careOpportunities.clear(),
    db.applications.clear(),
    db.assignments.clear(),
    db.routines.clear(),
    db.careTasks.clear(),
    db.careRecords.clear(),
    db.earningsEntries.clear(),
    db.memories.clear(),
    db.checklists.clear(),
  ]);

  await seedDatabase(true);
}


