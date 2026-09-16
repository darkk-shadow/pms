import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPatients,
  createPatient,
  updatePatient,
  deletePatient,
} from '../features/patients/patientsSlice';
import Modal from '../components/Modal';
import PatientForm from '../components/PatientForm';
import { Eye, Pencil, Trash2 } from 'lucide-react';

export default function PatientsPage() {
  const dispatch = useDispatch();
  const { items, loading, error, actionLoading, totalPages, page } = useSelector(
    (state) => state.patients,
  );

  const [searchFilter, setSearchFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'view' | 'delete'
  const [selectedPatient, setSelectedPatient] = useState(null);

  const loadPatients = (overrides = {}) => {
    dispatch(
      fetchPatients({
        search: searchFilter,
        gender: genderFilter,
        page: 1,
        ...overrides,
      }),
    );
  };

  useEffect(() => {
    loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce search/filter so we don't hit the API on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => loadPatients(), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchFilter, genderFilter]);

  const openAdd = () => {
    setSelectedPatient(null);
    setModalMode('add');
  };

  const openEdit = (patient) => {
    setSelectedPatient(patient);
    setModalMode('edit');
  };

  const openView = (patient) => {
    setSelectedPatient(patient);
    setModalMode('view');
  };

  const openDelete = (patient) => {
    setSelectedPatient(patient);
    setModalMode('delete');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedPatient(null);
  };

  const handleAddSubmit = async (formData) => {
    const result = await dispatch(createPatient(formData));
    if (createPatient.fulfilled.match(result)) closeModal();
  };

  const handleEditSubmit = async (formData) => {
    const result = await dispatch(updatePatient({ id: selectedPatient.id, ...formData }));
    if (updatePatient.fulfilled.match(result)) closeModal();
  };

  const handleDeleteConfirm = async () => {
    await dispatch(deletePatient(selectedPatient.id));
    closeModal();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Patient Management</h1>
        <button onClick={openAdd}>+ Add Patient</button>
      </div>

      <div className="filters">
        <input
          placeholder="Search by name, Patient ID, or phone…"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
        />
        <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
          <option value="">All Genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p>Loading patients…</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan="8">No patients found</td></tr>
            )}
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.patientId}</td>
                <td>{p.patientName}</td>
                <td>{p.age}</td>
                <td>{p.gender}</td>
                <td>{p.phoneNumber}</td>
                <td>{p.email}</td>
                <td>{new Date(p.createdDate).toLocaleDateString()}</td>
                <td className="actions-cell">
                  <button
                    type="button"
                    className="action-icon action-icon-view"
                    onClick={() => openView(p)}
                    aria-label="View Patient"
                    title="View Patient"
                  >
                    <Eye size={16} strokeWidth={2} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="action-icon action-icon-edit"
                    onClick={() => openEdit(p)}
                    aria-label="Edit Patient"
                    title="Edit Patient"
                  >
                    <Pencil size={16} strokeWidth={2} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="action-icon action-icon-delete"
                    onClick={() => openDelete(p)}
                    aria-label="Delete Patient"
                    title="Delete Patient"
                  >
                    <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => loadPatients({ page: page - 1 })}>
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => loadPatients({ page: page + 1 })}>
            Next
          </button>
        </div>
      )}

      {modalMode === 'add' && (
        <Modal title="Add Patient" onClose={closeModal}>
          <PatientForm onSubmit={handleAddSubmit} onCancel={closeModal} submitting={actionLoading} />
        </Modal>
      )}

      {modalMode === 'edit' && selectedPatient && (
        <Modal title="Edit Patient" onClose={closeModal}>
          <PatientForm
            initialData={{
              patientName: selectedPatient.patientName,
              age: selectedPatient.age,
              gender: selectedPatient.gender,
              phoneNumber: selectedPatient.phoneNumber,
              email: selectedPatient.email,
              address: selectedPatient.address,
            }}
            onSubmit={handleEditSubmit}
            onCancel={closeModal}
            submitting={actionLoading}
          />
        </Modal>
      )}

      {modalMode === 'view' && selectedPatient && (
        <Modal title="Patient Details" onClose={closeModal}>
          <div className="detail-list">
            <p><strong>Patient ID:</strong> {selectedPatient.patientId}</p>
            <p><strong>Name:</strong> {selectedPatient.patientName}</p>
            <p><strong>Age:</strong> {selectedPatient.age}</p>
            <p><strong>Gender:</strong> {selectedPatient.gender}</p>
            <p><strong>Phone:</strong> {selectedPatient.phoneNumber}</p>
            <p><strong>Email:</strong> {selectedPatient.email}</p>
            <p><strong>Address:</strong> {selectedPatient.address}</p>
            <p><strong>Created:</strong> {new Date(selectedPatient.createdDate).toLocaleString()}</p>
          </div>
        </Modal>
      )}

      {modalMode === 'delete' && selectedPatient && (
        <Modal title="Confirm Delete" onClose={closeModal}>
          <p>Are you sure you want to delete <strong>{selectedPatient.patientName}</strong>? This cannot be undone.</p>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={closeModal}>Cancel</button>
            <button className="btn-danger" onClick={handleDeleteConfirm}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
