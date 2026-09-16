import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchDashboardSummary } from '../features/dashboard/dashboardSlice';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const {
    totalPatients,
    recentPatients,
    totalBills,
    totalPaid,
    totalPending,
    loading,
    error,
  } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardSummary());
  }, [dispatch]);

  if (loading) return <p>Loading dashboard…</p>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Total Patients</span>
          <span className="stat-value">{totalPatients}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Bills</span>
          <span className="stat-value">{totalBills}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Paid</span>
          <span className="stat-value">₹{Number(totalPaid).toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Pending</span>
          <span className="stat-value">₹{Number(totalPending).toFixed(2)}</span>
        </div>
      </div>

      <div className="quick-links">
        <Link to="/patients" className="btn">Manage Patients</Link>
        <Link to="/billing" className="btn">Manage Billing</Link>
      </div>

      <h2>Recently Added Patients</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          {recentPatients.length === 0 && (
            <tr><td colSpan="4">No patients yet</td></tr>
          )}
          {recentPatients.map((p) => (
            <tr key={p.id}>
              <td>{p.patientName}</td>
              <td>{p.age}</td>
              <td>{p.gender}</td>
              <td>{p.phoneNumber}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
