type ViewProps = {
  state: any;
  currentAccount: () => any;
  submissionFor: (requirementId: string) => any;
  formatDate: (value: string) => string;
  requirementFor: (id: string) => any;
};

export default function DocumentsView({ state, currentAccount, formatDate }: ViewProps) {
  const account = currentAccount();
  const submissions = (state.submissions ?? []).filter((submission: any) => {
    if (state.role === "student") return submission.studentId === account?.email || submission.studentName === account?.name;
    if (state.role === "adviser") return submission.documentType === "assignment";
    return submission.status === "Approved" || ["MOA", "MOU"].includes(submission.documentType);
  });

  const filtered = submissions.filter((submission: any) => {
    if (!state.search) return true;
    const query = state.search.toLowerCase();
    return [submission.id, submission.status, submission.documentType, submission.studentName, submission.answer]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  return (
    <div className="dashboard-grid">
      <section className="panel">
        <div className="card-header">
          <div>
            <span className="eyebrow">DOCUMENTS</span>
            <h2>{state.role === "spards" ? "Document review" : "My documents"}</h2>
          </div>
        </div>
        <p className="muted-copy">Files and signed forms related to your OJT workflow.</p>
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <span className="eyebrow">FILES</span>
            <h3>{filtered.length} document(s)</h3>
          </div>
        </div>

        <div className="stack-list">
          {filtered.length === 0 ? (
            <div className="list-card empty-state-card">
              <p>No matching documents found.</p>
            </div>
          ) : (
            filtered.map((submission: any) => (
              <article key={submission.id} className="list-card">
                <div>
                  <div className="list-topline">
                    <span className="chip">{submission.documentType}</span>
                    <span className="meta">{submission.status}</span>
                  </div>
                  <h4>{submission.fileName || `${submission.documentType} submission`}</h4>
                  <p>{submission.answer || "No written notes were provided for this document."}</p>
                </div>
                <div className="list-actions">
                  <strong>{formatDate(submission.submittedAt)}</strong>
                  {submission.storedFile && (
                    <a href={`/api/classroom/submissions/${encodeURIComponent(submission.id)}/file`} className="button button-quiet" download>
                      Download
                    </a>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
