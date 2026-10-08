import { useState } from 'react';

const NEXT_STATUS = {
  Pending: 'Confirmed',
  Confirmed: 'Shipped',
  Shipped: 'Delivered'
};

export default function OrdersTable({ orders, mode, otherPartyLabel, onAdvance, onCancel, onTrack }) {
  const [busyId, setBusyId] = useState(null);

  if (!orders || orders.length === 0) {
    return <div className="empty-state">No orders yet.</div>;
  }

  async function handleAdvance(order) {
    setBusyId(order.order_id);
    try {
      await onAdvance(order.order_id, NEXT_STATUS[order.status]);
    } finally {
      setBusyId(null);
    }
  }
  async function handleCancel(order) {
    setBusyId(order.order_id);
    try {
      await onCancel(order.order_id);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Order</th>
          <th>{otherPartyLabel}</th>
          <th>Items</th>
          <th>Total</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {orders.map(o => (
          <tr key={o.order_id}>
            <td className="mono">#{String(o.order_id).padStart(4, '0')}</td>
            <td>{mode === 'incoming' ? o.buyer?.name : o.seller?.name}</td>
            <td>{o.OrderItems ? o.OrderItems.reduce((s, i) => s + i.quantity, 0) : '—'} units</td>
            <td className="mono">Rs {o.total_amount.toLocaleString()}</td>
            <td><span className={`badge ${o.status}`}>{o.status}</span></td>
            <td style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              {onTrack && (
                <button className="btn secondary small" onClick={() => onTrack(o.order_id)}>Track</button>
              )}
              {mode === 'incoming' && NEXT_STATUS[o.status] && (
                <button className="btn amber small" disabled={busyId === o.order_id} onClick={() => handleAdvance(o)}>
                  Mark {NEXT_STATUS[o.status]}
                </button>
              )}
              {mode === 'incoming' && o.status === 'Pending' && (
                <button className="btn danger small" disabled={busyId === o.order_id} onClick={() => handleCancel(o)}>
                  Cancel
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
