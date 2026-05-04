import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

function AllCircularsPage() {
  const [circulars, setCirculars] = useState([]);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/circular/inbox")
      .then(res => res.json())
      .then(data => {
        // Sort newest → oldest
        const sorted = data.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setCirculars(sorted);
      });
  }, []);

  // Filter logic
  const filteredCirculars = circulars.filter(c => {
    return (
      c.subject.toLowerCase().includes(search.toLowerCase()) &&
      (departmentFilter === "" || c.department === departmentFilter)
    );
  });

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <Topbar />

        <div className="dashboard-content">
          {/* HEADER */}
          <div className="page-header">
            <div>
              <p className="portal-path">
                PORTAL / <span>ALL CIRCULARS</span>
              </p>
              <h1>All Circulars</h1>
            </div>
          </div>

          <div
  style={{
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    alignItems: "center",
    flexWrap: "nowrap"
  }}
>
  {/* SEARCH */}
  <input
    type="text"
    placeholder="Search circular..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={{
      padding: "8px",
      width: "250px"
    }}
  />

  {/* DEPARTMENT */}
  <select
    value={departmentFilter}
    onChange={(e) => setDepartmentFilter(e.target.value)}
    style={{
      padding: "8px",
      width: "200px"
    }}
  >
    <option value="">All Departments</option>

    {[...new Set(circulars.map(c => c.department))].map(dep => (
      <option key={dep} value={dep}>
        {dep}
      </option>
    ))}
  </select>
</div>

          {/* TABLE / LIST */}
          <div className="table-section">
            {filteredCirculars.length === 0 ? (
              <p>No circulars found.</p>
            ) : (
              filteredCirculars.map(c => (
                <div
                  key={c.id}
                  style={{
                    padding: "16px",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    marginBottom: "12px"
                  }}
                >
                  <h3>{c.subject}</h3>
                  <p>{c.description}</p>
                  <small>
                    {c.date} — {c.department}
                  </small>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AllCircularsPage;