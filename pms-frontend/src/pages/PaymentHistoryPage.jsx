import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPaymentHistory } from '../features/payments/paymentsSlice';

export default function PaymentHistoryPage() {
  const dispatch = useDispatch();
  const {
    history,
    historyLoading,
    paymentError,
    historyPage: page,
    historyTotalPages: totalPages,
  } = useSelector((state) => state.payments);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchPaymentHistory({ page: 1, limit: 10, search: searchFilter, status: statusFilter }));
    }, 300);
    return () => clearTimeout(timer);
  }, [dispatch, searchFilter, statusFilter]);

  const loadPayments = (nextPage = page) => {
    dispatch(fetchPaymentHistory({
      page: nextPage,
      limit: 10,
      search: searchFilter,
      status: statusFilter,
    }));
  };

  const clearFilters = () => {
    setSearchFilter('');
    setStatusFilter('');
  };

  return (
    <div>
      <div className="page-header">
        <h1>Payment History</h1>
      </div>
      {paymentError && <div className="alert alert-error">{paymentError}</div>}
      <div className="filters">
        <input
          placeholder="Search by patient name…"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="CREATED">Created</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
        </select>
        {(searchFilter || statusFilter) && (
          <button className="btn-secondary" onClick={clearFilters}>Clear Filters</button>
        )}
      </div>
      {historyLoading ? (
        <p>Loading payment history...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Bill</th>
              <th>Patient</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr><td colSpan="6">No payments found</td></tr>
            )}
            {history.map((payment) => (
              <tr key={payment.id}>
                <td>{payment.razorpayPaymentId || payment.razorpayOrderId}</td>
                <td>{payment.billId.slice(0, 8)}...</td>
                <td>{payment.bill?.patient?.patientName || '-'}</td>
                <td>₹{Number(payment.amount).toFixed(2)}</td>
                <td>{payment.paymentStatus}</td>
                <td>{new Date(payment.createdDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => loadPayments(page - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => loadPayments(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
