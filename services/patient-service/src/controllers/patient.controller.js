const Patient = require('../models/patient.model');

// Keep only allowed fields when building update payloads.
const pickDefined = (payload, allowedFields) => {
  const out = {};
  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field) && payload[field] !== undefined) {
      out[field] = payload[field];
    }
  });
  return out;
};

// Normalize incoming patient data before writing to MongoDB.
const normalizePatientPayload = (payload) => {
  const data = { ...payload };

  if (typeof data.email === 'string') data.email = data.email.trim().toLowerCase();
  if (typeof data.name === 'string') data.name = data.name.trim();
  if (typeof data.phone === 'string') data.phone = data.phone.trim();
  if (typeof data.avatar === 'string') data.avatar = data.avatar.trim();

  if (data.address && typeof data.address === 'object') {
    const address = { ...data.address };
    ['street', 'city', 'state', 'country', 'zip'].forEach((k) => {
      if (typeof address[k] === 'string') address[k] = address[k].trim();
    });
    data.address = address;
  }

  if (data.emergencyContact && typeof data.emergencyContact === 'object') {
    const emergencyContact = { ...data.emergencyContact };
    ['name', 'relationship', 'phone'].forEach((k) => {
      if (typeof emergencyContact[k] === 'string') emergencyContact[k] = emergencyContact[k].trim();
    });
    data.emergencyContact = emergencyContact;
  }

  if (Array.isArray(data.allergies)) {
    data.allergies = data.allergies
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (Array.isArray(data.currentMedications)) {
    data.currentMedications = data.currentMedications
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return data;
};

// GET one patient profile using auth userId.
const getPatientByUserId = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ userId: req.params.userId });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    return res.status(200).json({ success: true, patient });
  } catch (error) {
    return next(error);
  }
};

// CREATE patient profile after registration.
const createPatient = async (req, res, next) => {
  try {
    const payload = normalizePatientPayload(req.body);

    const duplicate = await Patient.findOne({
      $or: [{ userId: payload.userId }, { email: payload.email }],
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'Patient already exists with the same userId or email',
      });
    }

    const patient = await Patient.create(payload);
    return res.status(201).json({ success: true, message: 'Patient profile created', patient });
  } catch (error) {
    return next(error);
  }
};

// UPDATE editable patient profile fields.
const updatePatient = async (req, res, next) => {
  try {
    const allowedFields = [
      'name',
      'email',
      'phone',
      'dateOfBirth',
      'gender',
      'bloodGroup',
      'address',
      'allergies',
      'currentMedications',
      'emergencyContact',
      'avatar',
      'isActive',
    ];

    const updates = normalizePatientPayload(pickDefined(req.body, allowedFields));

    const patient = await Patient.findOneAndUpdate(
      { userId: req.params.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    return res.status(200).json({ success: true, message: 'Patient profile updated', patient });
  } catch (error) {
    return next(error);
  }
};

// ADD one medical history entry to an existing patient.
const addMedicalHistory = async (req, res, next) => {
  try {
    const medicalEntry = {
      condition: req.body.condition.trim(),
      diagnosedAt: req.body.diagnosedAt || undefined,
      notes: typeof req.body.notes === 'string' ? req.body.notes.trim() : undefined,
    };

    const patient = await Patient.findOneAndUpdate(
      { userId: req.params.userId },
      { $push: { medicalHistory: medicalEntry } },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    return res.status(200).json({ success: true, message: 'Medical history updated', patient });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getPatientByUserId,
  createPatient,
  updatePatient,
  addMedicalHistory,
};
