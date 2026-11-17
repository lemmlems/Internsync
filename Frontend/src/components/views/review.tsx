type ViewProps = {
  state: any;
  currentAccount: () => any;
  submissionFor: (requirementId: string) => any;
  formatDate: (value: string) => string;
  requirementFor: (id: string) => any;
};

export default function ReviewView({ state, formatDate, requirementFor }: ViewProps) {
  const submissions = (state.submissions ?? []).filter((submission: any) => {
    if (state.role === "adviser") return submission.status === "Pending adviser review" || submission.status === "Returned";
    return submission.status === "Approved" || submission.documentType === "MOU" || submission.documentType === "MOA";
  });

  return (
    <div className="dashboard-grid">
      <section className="panel">
        <div className="card-header">
          <div>
            <span className="eyebrow">REVIEW</span>
            <h2>{state.role === "adviser" ? "Review queue" : "Document review"}</h2>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="stack-list">
          {submissions.length === 0 ? (
            <div className="list-card empty-state-card">
              <p>No submissions are waiting for review.</p>
            </div>
          ) : (
            submissions.map((submission: any) => {
              const requirement = submission.requirementId ? requirementFor(submission.requirementId) : null;
              return (
                <article key={submission.id} className="list-card review-card">
                  <div>
                    <div className="list-topline">
                      <span className="chip">{submission.documentType}</span>
                      <span className="meta">{submission.studentName}</span>
                    </div>
                    <h4>{requirement?.title || submission.documentType}</h4>
                    <p>{submission.answer || "No additional notes provided."}</p>
                    <small>{formatDate(submission.submittedAt)}</small>
                  </div>
                  <div className="review-panel">
                    <textarea
                      className="form-control"
                      data-feedback={submission.id}
                      placeholder="Add feedback for the student"
                      defaultValue={submission.feedback || ""}
                    />
                    <div className="button-row">
                      <button type="button" className="button button-primary" data-review="Approved" data-submission={submission.id}>
                        Approve
                      </button>
                      <button type="button" className="button button-quiet" data-review="Returned" data-submission={submission.id}>
                        Return for changes
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
