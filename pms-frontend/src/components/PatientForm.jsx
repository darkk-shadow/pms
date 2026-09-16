import { useState } from 'react';

const emptyForm = {
  patientName: '',
  age: '',
  gender: 'MALE',
  phoneNumber: '',
  email: '',
  address: '',
};

export default function PatientForm({ initialData, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(initialData || emptyForm);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const errs = {};
    if (!form.patientName.trim()) errs.patientName = 'Patient name is required';
    if (!form.age || Number(form.age) <= 0) errs.age = 'Enter a valid age';
    if (!form.phoneNumber.trim()) {
      errs.phoneNumber = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(form.phoneNumber)) {
      errs.phoneNumber = 'Phone number must be exactly 10 digits.';
    }
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      errs.email = 'Enter a valid email';
    }
    if (!form.address.trim()) errs.address = 'Address is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, age: Number(form.age) });
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit} noValidate>
      <label>
        Patient Name
        <input name="patientName" value={form.patientName} onChange={handleChange} />
        {errors.patientName && <span className="field-error">{errors.patientName}</span>}
      </label>

      <label>
        Age
        <input type="number" name="age" value={form.age} onChange={handleChange} />
        {errors.age && <span className="field-error">{errors.age}</span>}
      </label>

      <label>
        Gender
        <select name="gender" value={form.gender} onChange={handleChange}>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>
      </label>

      <label>
        Phone Number
        <input
          name="phoneNumber"
          value={form.phoneNumber}
          onChange={handleChange}
          inputMode="numeric"
          maxLength={10}
        />
        {errors.phoneNumber && <span className="field-error">{errors.phoneNumber}</span>}
      </label>

      <label>
        Email
        <input type="email" name="email" value={form.email} onChange={handleChange} />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </label>

      <label>
        Address
        <textarea name="address" value={form.address} onChange={handleChange} />
        {errors.address && <span className="field-error">{errors.address}</span>}
      </label>

      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
