// Run inside auth-service: docker compose cp scripts/seed-demo.cjs auth-service:/app/seed-demo.cjs
// docker compose exec -T auth-service node /app/seed-demo.cjs <patient-email>
// Adds only labeled demo records; reruns do not duplicate or overwrite existing records.
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function main() {
  const email = process.argv[2];
  if (!email) throw new Error('Pass the existing patient email');
  await mongoose.connect('mongodb://mongo:27017/emedicare_auth');
  const client = mongoose.connection.getClient();
  const collection = (db, name) => client.db(db).collection(name);
  const auth = collection('emedicare_auth', 'auth');
  const user = await auth.findOne({ email, role: 'patient' });
  if (!user) throw new Error('Existing patient account not found');
  const uid = String(user._id);
  const now = new Date();
  const base = new Date('2026-11-16T00:00:00+05:30');
  const day = n => new Date(base.getTime() + n * 86400000);
  async function insert(db, name, key, values) {
    const coll = collection(db, name);
    await coll.updateOne(key, { $setOnInsert: { ...values, createdAt: now, updatedAt: now } }, { upsert: true });
    return coll.findOne(key);
  }
  const doctors = [];
  const password = await bcrypt.hash('DemoDoctor123!', 12);
  for (const [i, name, specialty, fee] of [[0, 'Maya Perera (Demo)', 'General Physician', 35], [1, 'Arun Silva (Demo)', 'Dermatologist', 50], [2, 'Nila Fernando (Demo)', 'Cardiologist', 65]]) {
    const doctorEmail = `demo.doctor${i + 1}@example.test`;
    const account = await insert('emedicare_auth', 'auth', { email: doctorEmail }, { name, password, role: 'doctor', isVerified: true });
    const doctor = await insert('emedicare_doctors', 'doctor', { email: doctorEmail }, {
      userId: String(account._id), name, specialty, consultationFee: fee,
      qualifications: ['Demo qualification'], experience: 8 + i, rating: 4.8,
      totalReviews: 12, isVerified: true, verificationStatus: 'approved', isAvailable: true,
      bio: 'DEMO DATA - fictional clinician for testing the application.', availableSlots: [], avatar: '', phone: ''
    });
    doctors.push(doctor);
    for (let offset = 1; offset <= 7; offset++) {
      await insert('emedicare_doctors', 'availability', { doctorId: doctor._id, date: day(offset).toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' }) }, { timeSlots: ['09:00', '10:00', '11:00', '14:00', '15:00'] });
    }
  }
  const patients = collection('emedicare_patients', 'patients');
  await patients.updateOne({ userId: uid }, { $setOnInsert: { name: user.name, email, reports: [], medicalHistory: [], isActive: true, createdAt: now } }, { upsert: true });
  for (const [condition, offset, notes] of [
    ['DEMO - Routine wellness review', -20, 'Fictional completed wellness visit; no clinical conclusions.'],
    ['DEMO - Seasonal allergy review', -12, 'Sample history entry for testing only; not a diagnosis.'],
    ['DEMO - Follow-up consultation', -5, 'Fictional follow-up record; no treatment prescribed.']
  ]) {
    await patients.updateOne({ userId: uid, 'medicalHistory.condition': { $ne: condition } }, { $push: { medicalHistory: { _id: new mongoose.Types.ObjectId(), condition, diagnosedAt: day(offset), notes } }, $set: { updatedAt: now } });
  }
  const appointments = [];
  for (const [i, offset, status, type] of [[0, -20, 'completed', 'in-person'], [1, -12, 'completed', 'in-person'], [2, -5, 'completed', 'video'], [3, 1, 'confirmed', 'video'], [4, 3, 'pending', 'in-person']]) {
    const doctor = doctors[i % doctors.length];
    const notes = `DEMO DATA - Sample appointment ${i + 1}; fictional consultation.`;
    const appointment = await insert('emedicare_appointments', 'appointments', { patientId: uid, notes }, {
      doctorId: String(doctor._id), date: day(offset), time: '10:00', type, status,
      confirmedByDoctorId: status === 'pending' ? '' : String(doctor._id),
      confirmedByDoctorUserId: status === 'pending' ? '' : doctor.userId, prescription: ''
    });
    appointments.push(appointment);
    if (i < 3) await insert('emedicare_payments', 'payments', { transactionId: `DEMO-${uid}-${i + 1}` }, {
      patientId: uid, appointmentId: String(appointment._id), amount: doctor.consultationFee,
      currency: 'USD', method: 'card', status: 'success', patientName: user.name, patientEmail: email,
      doctorName: doctor.name, appointmentDate: day(offset).toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' }), appointmentTime: '10:00'
    });
    if (type === 'video') await insert('emedicare_telemedicine', 'sessions', { appointmentId: String(appointment._id) }, {
      doctorId: String(doctor._id), patientId: uid, roomId: `demo-${appointment._id}`,
      scheduledAt: new Date(day(offset).getTime() + 10 * 3600000), type: 'video',
      status: status === 'completed' ? 'ended' : 'scheduled', durationMinutes: status === 'completed' ? 20 : 0,
      notes: 'DEMO DATA - fictional video consultation.', prescription: ''
    });
  }
  for (const [type, message] of [
    ['APPOINTMENT_REMINDER', 'DEMO - Your sample video appointment is scheduled for November 17 at 10:00.'],
    ['LAB_REPORT', 'DEMO - Two fictional sample reports are available in Reports.'],
    ['PAYMENT_RECEIPT', 'DEMO - Three sample payments totaling USD 150 have been recorded. No money was charged.']
  ]) await insert('notification_db', 'notifications', { recipient: email, message }, { type, channel: 'system', status: 'sent' });
  console.log(JSON.stringify({ patientId: uid, doctors: doctors.length, appointments: appointments.length, demoPayments: 3, demoTotal: 150 }));
  await mongoose.disconnect();
}
main().catch(err => { console.error(err.message); process.exit(1); });
