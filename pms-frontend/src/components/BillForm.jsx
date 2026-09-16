import { useState } from 'react';

export default function BillForm({ patients, initialData, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({
    patientId: initialData?.patientId || patients[0]?.id || '',
    description: initialData?.description || '',
    amount: initialData?.amount ?? '',
    tax: initialData?.tax ?? '0',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const errs = {};
    if (!form.patientId) errs.patientId = 'Select a patient';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Enter a valid amount';
    if (form.tax === '' || Number(form.tax) < 0) errs.tax = 'Tax cannot be negative';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      patientId: form.patientId,
      description: form.description,
      amount: Number(form.amount),
      tax: Number(form.tax),
    });
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit} noValidate>
      <label>
        Patient
        <select name="patientId" value={form.patientId} onChange={handleChange}>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.patientId} - {p.patientName}</option>
          ))}
        </select>
        {errors.patientId && <span className="field-error">{errors.patientId}</span>}
      </label>

      <label>
        Service / Description
        <input name="description" value={form.description} onChange={handleChange} />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </label>

      <label>
        Amount (₹)
        <input type="number" name="amount" value={form.amount} onChange={handleChange} />
        {errors.amount && <span className="field-error">{errors.amount}</span>}
      </label>

      <label>
        Tax (₹)
        <input type="number" name="tax" value={form.tax} onChange={handleChange} />
        {errors.tax && <span className="field-error">{errors.tax}</span>}
      </label>

      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Create Bill'}
        </button>
      </div>
    </form>
  );
}
