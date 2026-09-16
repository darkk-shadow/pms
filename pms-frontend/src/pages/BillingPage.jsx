import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBills, createBill, updateBill, deleteBill, markBillPaidLocally } from '../features/bills/billsSlice';
import { fetchPatients } from '../features/patients/patientsSlice';
import { createRazorpayOrder, verifyRazorpayPayment, fetchPaymentDetails, clearPaymentError } from '../features/payments/paymentsSlice';
import { fetchDashboardSummary } from '../features/dashboard/dashboardSlice';
import { openRazorpayCheckout } from '../api/razorpay';
import Modal from '../components/Modal';
import BillForm from '../components/BillForm';
import { Eye, Pencil, Trash2 } from 'lucide-react';

export default function BillingPage() {
  const dispatch = useDispatch();
  const { items: bills, loading, error, actionLoading, page, totalPages } = useSelector((state) => state.bills);
  const { items: patients } = useSelector((state) => state.patients);
  const { paymentLoading, paymentError, details, detailsLoading } = useSelector((state) => state.payments);

  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'view' | 'payments' | 'delete'
  const [selectedBill, setSelectedBill] = useState(null);
  const [payingBillId, setPayingBillId] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    dispatch(fetchPatients({ limit: 100 })); // need the list to populate the "create bill" dropdown
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchBills({ page: 1, limit: 10, search: searchFilter, status: statusFilter }));
    }, 300);
    return () => clearTimeout(timer);
  }, [dispatch, searchFilter, statusFilter]);

  const loadBills = (nextPage = page) => {
    dispatch(fetchBills({ page: nextPage, limit: 10, search: searchFilter, status: statusFilter }));
  };

  const clearFilters = () => {
    setSearchFilter('');
    setStatusFilter('');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedBill(null);
  };

  const handleCreateBill = async (billData) => {
    const result = await dispatch(createBill(billData));
    if (createBill.fulfilled.match(result)) {
      closeModal();
      loadBills(1);
    }
  };

  const handleUpdateBill = async (billData) => {
    const result = await dispatch(updateBill({ id: selectedBill.id, ...billData }));
    if (updateBill.fulfilled.match(result)) {
      closeModal();
      loadBills();
    }
  };

  const handleDeleteConfirm = async () => {
    const result = await dispatch(deleteBill(selectedBill.id));
    if (deleteBill.fulfilled.match(result)) {
      closeModal();
      loadBills(page > 1 && bills.length === 1 ? page - 1 : page);
    }
  };

  const handlePayBill = async (bill) => {
    dispatch(clearPaymentError());
    setPayingBillId(bill.id);

    try {
      const order = await dispatch(createRazorpayOrder(bill.id)).unwrap();

      const paymentResponse = await openRazorpayCheckout({
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        keyId: order.keyId,
        patientName: bill.patient?.patientName,
        description: bill.description,
      });

      await dispatch(
        verifyRazorpayPayment({
          razorpayOrderId: paymentResponse.razorpay_order_id,
          razorpayPaymentId: paymentResponse.razorpay_payment_id,
          razorpaySignature: paymentResponse.razorpay_signature,
        }),
      ).unwrap();

      dispatch(markBillPaidLocally(bill.id));
      loadBills();
      dispatch(fetchDashboardSummary());
    } catch (err) {
      // paymentError is already set in the slice for API failures;
      // this covers checkout cancellation / script load failures too
      const message = typeof err === 'string'
        ? err
        : err?.message || err?.error || 'Payment could not be completed.';
      console.error('Payment flow error:', message);
    } finally {
      setPayingBillId(null);
    }
  };

  const statusClass = (status) => `status-badge status-${status.toLowerCase()}`;

  return (
    <div>
      <div className="page-header">
        <h1>Billing</h1>
        <button onClick={() => setModalMode('add')} disabled={patients.length === 0}>
          + Create Bill
        </button>
      </div>

      {patients.length === 0 && (
        <p className="hint">Add a patient first before creating a bill.</p>
      )}

      {(error || paymentError) && (
        <div className="alert alert-error">{error || paymentError}</div>
      )}

      <div className="filters">
        <input
          placeholder="Search by patient name or Patient ID…"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        {(searchFilter || statusFilter) && (
          <button className="btn-secondary" onClick={clearFilters}>Clear Filters</button>
        )}
      </div>

      {loading ? (
        <p>Loading bills…</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Bill ID</th>
              <th>Patient</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Tax</th>
              <th>Total</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bills.length === 0 && (
              <tr><td colSpan="9">No bills found</td></tr>
            )}
            {bills.map((b) => (
              <tr key={b.id}>
                <td>{b.id.slice(0, 8)}…</td>
                <td>{b.patient?.patientId ? `${b.patient.patientId} - ${b.patient.patientName}` : (b.patient?.patientName || '—')}</td>
                <td>{b.description}</td>
                <td>₹{Number(b.amount).toFixed(2)}</td>
                <td>₹{Number(b.tax).toFixed(2)}</td>
                <td>₹{Number(b.totalAmount).toFixed(2)}</td>
                <td><span className={statusClass(b.paymentStatus)}>{b.paymentStatus}</span></td>
                <td>{new Date(b.createdDate).toLocaleDateString()}</td>
                <td className="actions-cell">
                  <button
                    type="button"
                    className="action-icon action-icon-view"
                    onClick={() => { setSelectedBill(b); setModalMode('view'); }}
                    aria-label="View Bill"
                    title="View Bill"
                  >
                    <Eye size={16} strokeWidth={2} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="action-icon action-icon-edit"
                    onClick={() => { setSelectedBill(b); setModalMode('edit'); }}
                    aria-label="Edit Bill"
                    title="Edit Bill"
                  >
                    <Pencil size={16} strokeWidth={2} aria-hidden="true" />
                  </button>
                  <button className="link" onClick={() => { setSelectedBill(b); setModalMode('payments'); dispatch(fetchPaymentDetails(b.id)); }}>Payments</button>
                  {b.paymentStatus !== 'PAID' && (
                    <button
                      className="link"
                      onClick={() => handlePayBill(b)}
                      disabled={paymentLoading && payingBillId === b.id}
                    >
                      {paymentLoading && payingBillId === b.id ? 'Processing…' : 'Pay Bill'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="action-icon action-icon-delete"
                    onClick={() => { setSelectedBill(b); setModalMode('delete'); }}
                    aria-label="Delete Bill"
                    title="Delete Bill"
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
          <button disabled={page <= 1} onClick={() => loadBills(page - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => loadBills(page + 1)}>Next</button>
        </div>
      )}

      {modalMode === 'add' && (
        <Modal title="Create Bill" onClose={closeModal}>
          <BillForm patients={patients} onSubmit={handleCreateBill} onCancel={closeModal} submitting={actionLoading} />
        </Modal>
      )}

      {modalMode === 'edit' && selectedBill && (
        <Modal title="Edit Bill" onClose={closeModal}>
          <BillForm
            patients={patients}
            initialData={selectedBill}
            onSubmit={handleUpdateBill}
            onCancel={closeModal}
            submitting={actionLoading}
          />
        </Modal>
      )}

      {modalMode === 'view' && selectedBill && (
        <Modal title="Bill Details" onClose={closeModal}>
          <div className="detail-list">
            <p><strong>Patient:</strong> {selectedBill.patient?.patientName}</p>
            <p><strong>Description:</strong> {selectedBill.description}</p>
            <p><strong>Amount:</strong> ₹{Number(selectedBill.amount).toFixed(2)}</p>
            <p><strong>Tax:</strong> ₹{Number(selectedBill.tax).toFixed(2)}</p>
            <p><strong>Total:</strong> ₹{Number(selectedBill.totalAmount).toFixed(2)}</p>
            <p><strong>Status:</strong> {selectedBill.paymentStatus}</p>
          </div>
        </Modal>
      )}

      {modalMode === 'payments' && selectedBill && (
        <Modal title="Payment Details" onClose={closeModal}>
          {detailsLoading ? <p>Loading payment details...</p> : (
            <table>
              <thead><tr><th>Payment ID</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {details.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.razorpayPaymentId || payment.razorpayOrderId}</td>
                    <td>₹{Number(payment.amount).toFixed(2)}</td>
                    <td>{payment.paymentStatus}</td>
                    <td>{new Date(payment.createdDate).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!details.length && <tr><td colSpan="4">No payment records found</td></tr>}
              </tbody>
            </table>
          )}
        </Modal>
      )}

      {modalMode === 'delete' && selectedBill && (
        <Modal title="Confirm Delete" onClose={closeModal}>
          <p>Delete this bill for <strong>{selectedBill.patient?.patientName}</strong>?</p>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={closeModal}>Cancel</button>
            <button className="btn-danger" onClick={handleDeleteConfirm}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
