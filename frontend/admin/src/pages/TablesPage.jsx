export default function TablesPage({ tables, update }) {
  return (
    <div className="card">
      <h2>Quản lý bàn</h2>
      <div className="grid cols-4">
        {tables.map((table) => (
          <div className="card" key={table.id} style={{ boxShadow: 'none' }}>
            <h3>Bàn {table.tableNumber}</h3>
            <p>Sức chứa: {table.capacity}</p>
            <select className="select" value={table.status} onChange={(event) => update(table, event.target.value)}>
              <option>EMPTY</option><option>OCCUPIED</option><option>RESERVED</option><option>CLEANING</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
