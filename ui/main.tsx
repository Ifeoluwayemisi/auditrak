import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
const api = async (path: string, method = "GET", data?: unknown) => {
  const r = await fetch("/api/v1" + path, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const value = await r.json();
  if (!r.ok) throw new Error(value.error ?? "Request failed");
  return value;
};
const money = (minor: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(
    minor / 100,
  );
const date = () => new Date().toISOString().slice(0, 10);
const uid = () => crypto.randomUUID();
function Button({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props}>{children}</button>;
}
function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = props.type === "password";
  return (
    <label>
      {label}
      {isPassword ? (
        <span className="password-control">
          <input
            {...props}
            type={passwordVisible ? "text" : "password"}
            autoComplete={props.autoComplete}
          />
          <button
            className="password-toggle"
            type="button"
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            aria-pressed={passwordVisible}
            onClick={() => setPasswordVisible(!passwordVisible)}
          >
            {passwordVisible ? "Hide" : "Show"}
          </button>
        </span>
      ) : (
        <input {...props} />
      )}
    </label>
  );
}
function Badge({
  children,
  good = false,
}: {
  children: React.ReactNode;
  good?: boolean;
}) {
  return <span className={"badge " + (good ? "good" : "")}>{children}</span>;
}
function Form({
  title,
  children,
  submit,
}: {
  title: string;
  children: React.ReactNode;
  submit: (f: Record<string, string>) => Promise<any>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <section className="card">
      <h3>{title}</h3>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await submit(
              Object.fromEntries(new FormData(e.currentTarget)) as Record<
                string,
                string
              >,
            );
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="fields">{children}</div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <Button disabled={busy}>
          {busy
            ? "Saving…"
            : title === "Sign in"
              ? "Sign in"
              : title === "Create your workspace"
                ? "Create workspace"
                : "Save " + title.toLowerCase()}
        </Button>
      </form>
    </section>
  );
}
function App() {
  const [user, setUser] = useState<any>(null),
    [ready, setReady] = useState(false),
    [events, setEvents] = useState<any[]>([]),
    [selected, setSelected] = useState<any>(null),
    [view, setView] = useState("jobs"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [profile, setProfile] = useState<any>(null),
    [audit, setAudit] = useState<any[]>([]),
    [business, setBusiness] = useState<any>(null),
    [signup, setSignup] = useState(false),
    [link, setLink] = useState(""),
    [busy, setBusy] = useState(false);
  const token = location.pathname.startsWith("/confirm/")
    ? location.pathname.split("/")[2]
    : null;
  const refresh = async () => {
    const list = await api("/events");
    setEvents(list);
    if (user?.role === "business") {
      setProfile(await api("/profile"));
      setBusiness(await api("/business"));
    }
  };
  useEffect(() => {
    api("/auth/me")
      .then((x) => setUser(x.user))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (user) refresh().catch((e) => setError(e.message));
  }, [user]);
  const act = async (fn: () => Promise<any>, message = "Saved") => {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const result = await fn();
      setNotice(message);
      await refresh();
      return result;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  };
  const save = async (path: string, method: string, data?: unknown) => {
    const value = await api("/events/" + selected.id + path, method, data);
    setSelected(value);
    setLink("");
    await refresh();
    setNotice("Saved. Run the assessment again after changing evidence.");
    return value;
  };
  if (token) return <Confirmation token={token} />;
  if (!ready)
    return (
      <main className="login">
        <h1>AuditTrak</h1>
        <p>Opening your workspace…</p>
      </main>
    );
  if (!user)
    return (
      <main className="login">
        <div className="brand">◈ AUDITTRAK</div>
        <h1>
          Keep every job’s
          <br />
          records together.
        </h1>
        <p>
          Organize agreements, invoices, payments, and delivery records in one
          workspace. See what matches and what needs your attention.
        </p>
        <Form
          title={signup ? "Create your workspace" : "Sign in"}
          submit={async (f) => {
            const r = await api(
              signup ? "/auth/signup" : "/auth/login",
              "POST",
              f,
            );
            setUser(r.user);
          }}
        >
          {signup && (
            <>
              <Field label="Your name" name="name" required />
              <Field label="Business name" name="businessName" required />
            </>
          )}
          <Field label="Email" name="email" type="email" required />
          <Field
            label="Password"
            name="password"
            type="password"
            minLength={signup ? 12 : 1}
            required
            autoComplete={signup ? "new-password" : "current-password"}
          />
          {signup && (
            <p className="field-hint">
              Choose a password with at least 12 characters. Use Show to check
              what you entered before creating your workspace.
            </p>
          )}
        </Form>
        <Button className="quiet" onClick={() => setSignup(!signup)}>
          {signup
            ? "Already registered? Sign in"
            : "New here? Create a workspace"}
        </Button>
      </main>
    );
  return (
    <div className="shell">
      <aside>
        <div className="brand">◈ AUDITTRAK</div>
        <p className="muted">The story behind the money</p>
        <nav>
          {(user.role === "business"
            ? ["jobs", "profile", "business", "audit"]
            : ["jobs"]
          ).map((x) => (
            <Button
              key={x}
              className={view === x ? "active" : "quiet"}
              onClick={async () => {
                setSelected(null);
                setView(x);
                if (x === "audit") setAudit(await api("/audit"));
              }}
            >
              {x === "jobs"
                ? user.role === "reviewer"
                  ? "Review queue"
                  : "My jobs"
                : x[0].toUpperCase() + x.slice(1)}
            </Button>
          ))}
        </nav>
        <div className="aside-bottom">
          <p>
            {user.name}
            <br />
            <small>
              {user.role === "reviewer"
                ? "Institutional reviewer"
                : business?.name}
            </small>
          </p>
          <Button
            className="quiet"
            onClick={async () => {
              await api("/auth/logout", "POST");
              setUser(null);
              setSelected(null);
              setEvents([]);
              setView("jobs");
              setProfile(null);
              setAudit([]);
              setBusiness(null);
            }}
          >
            Sign out
          </Button>
        </div>
      </aside>
      <main>
        <header>
          <div>
            <small>COMMERCIAL EVIDENCE WORKSPACE</small>
            <h1>
              {selected
                ? selected.title
                : view === "jobs"
                  ? user.role === "reviewer"
                    ? "Shared jobs for review"
                    : "Your work. One clear record."
                  : view === "profile"
                    ? "Commercial activity profile"
                    : view === "business"
                      ? "Your business"
                      : "Activity history"}
            </h1>
          </div>
          <Badge good={user.role === "business"}>
            {user.role === "reviewer"
              ? "Reviewer workspace"
              : "Business workspace"}
          </Badge>
        </header>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="notice">
            {notice}
          </p>
        )}
        {selected ? (
          <>
            <Button
              className="quiet"
              onClick={() => {
                setSelected(null);
                setLink("");
              }}
            >
              ← Back to jobs
            </Button>
            <div className="job-meta">
              <span>{selected.counterparty}</span>
              <span>
                {selected.channel === "marketplace"
                  ? "Marketplace job"
                  : "Direct client"}
              </span>
              <span>Revision {selected.revision}</span>
              <Badge good={!!selected.submitted}>
                {selected.submitted ? "Shared for review" : "Private draft"}
              </Badge>
            </div>
            <div className="flow">
              {[
                ["Agreement", !!selected.agreement],
                ["Invoice", !!selected.invoice],
                ["Payment", selected.transactions.length > 0],
                [
                  "Delivery",
                  selected.fulfillment?.status === "completed" &&
                    selected.evidence.some(
                      (x: any) => x.kind === "fulfillment",
                    ),
                ],
                [
                  "Confirmation",
                  selected.attestations.some(
                    (x: any) =>
                      x.revision === selected.revision &&
                      x.status === "confirmed",
                  ),
                ],
              ].map(([name, done], i) => (
                <div className={done ? "done" : ""} key={String(name)}>
                  <b>{done ? "✓" : i + 1}</b>
                  <span>{name}</span>
                </div>
              ))}
            </div>
            <p className="muted">
              Each step is linked to this job. A filled step shows a record
              exists; it does not prove authenticity.
            </p>
            {selected.assessment && (
              <section className="card assessment">
                <div className="section-heading">
                  <h2>
                    {selected.assessment.stale
                      ? "Evidence changed — reassess"
                      : selected.assessment.label}
                  </h2>
                  <Badge
                    good={
                      !selected.assessment.stale &&
                      selected.assessment.status === "consistent"
                    }
                  >
                    {selected.assessment.coverage.present}/5 stages
                  </Badge>
                </div>
                <p>{selected.assessment.summary}</p>
                <p className="muted">
                  {selected.assessment.confidenceExplanation}
                </p>
                <div className="signals">
                  {selected.assessment.reasons.map((x: any, i: number) => (
                    <div className={"signal " + x.status} key={i}>
                      <b>
                        {x.status === "match"
                          ? "✓"
                          : x.status === "mismatch"
                            ? "!"
                            : "○"}{" "}
                        {x.status}
                      </b>
                      <span>{x.message}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {user.role === "business" && (
              <div className="actions">
                <Button
                  disabled={busy}
                  onClick={() =>
                    act(() => save("/assessment", "POST"), "Assessment updated")
                  }
                >
                  Check this job
                </Button>
                <Button
                  className="secondary"
                  disabled={
                    busy || !selected.assessment || selected.assessment.stale
                  }
                  onClick={() =>
                    act(
                      () =>
                        save(
                          selected.submitted ? "/unshare" : "/submit",
                          "POST",
                        ),
                      selected.submitted
                        ? "Sharing revoked"
                        : "Shared with the reviewer workspace",
                    )
                  }
                >
                  {selected.submitted ? "Revoke sharing" : "Share for review"}
                </Button>
              </div>
            )}
            <div className="columns">
              <div>
                {user.role === "business" ? (
                  <>
                    <Form
                      key={selected.id + "agreement"}
                      title="Agreement"
                      submit={(f) =>
                        save("/agreement", "PUT", {
                          id: selected.agreement?.id ?? uid(),
                          kind: "agreement",
                          source: "user",
                          counterparty: f.counterparty,
                          service: f.service,
                          amount: {
                            amountMinor: Math.round(Number(f.amount) * 100),
                            currency: selected.currency,
                          },
                          effectiveDate: f.date,
                          reference: f.reference,
                        })
                      }
                    >
                      <Field
                        label="Client named in agreement"
                        name="counterparty"
                        defaultValue={
                          selected.agreement?.counterparty ??
                          selected.counterparty
                        }
                        required
                      />
                      <Field
                        label="Work agreed"
                        name="service"
                        defaultValue={
                          selected.agreement?.service ?? selected.service
                        }
                        required
                      />
                      <Field
                        label={"Agreed amount (" + selected.currency + ")"}
                        name="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={
                          selected.agreement
                            ? selected.agreement.amount.amountMinor / 100
                            : ""
                        }
                        required
                      />
                      <Field
                        label="Agreement date"
                        name="date"
                        type="date"
                        defaultValue={
                          selected.agreement?.effectiveDate ?? date()
                        }
                        required
                      />
                      <Field
                        label="Reference (optional)"
                        name="reference"
                        defaultValue={selected.agreement?.reference}
                      />
                    </Form>
                    <Form
                      key={selected.id + "invoice"}
                      title="Invoice"
                      submit={(f) =>
                        save("/invoice", "PUT", {
                          id: selected.invoice?.id ?? uid(),
                          kind: "invoice",
                          source: "user",
                          invoiceNumber: f.number,
                          counterparty: f.counterparty,
                          service: selected.service,
                          amount: {
                            amountMinor: Math.round(Number(f.amount) * 100),
                            currency: selected.currency,
                          },
                          issuedDate: f.date,
                        })
                      }
                    >
                      <Field
                        label="Invoice number"
                        name="number"
                        defaultValue={selected.invoice?.invoiceNumber}
                        required
                      />
                      <Field
                        label="Client billed"
                        name="counterparty"
                        defaultValue={
                          selected.invoice?.counterparty ??
                          selected.counterparty
                        }
                        required
                      />
                      <Field
                        label={"Billed amount (" + selected.currency + ")"}
                        name="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={
                          selected.invoice
                            ? selected.invoice.amount.amountMinor / 100
                            : ""
                        }
                        required
                      />
                      <Field
                        label="Invoice date"
                        name="date"
                        type="date"
                        defaultValue={selected.invoice?.issuedDate ?? date()}
                        required
                      />
                    </Form>
                    <Form
                      title="Payment record"
                      submit={(f) =>
                        save("/transactions", "POST", {
                          id: uid(),
                          kind: "payment",
                          source: "user",
                          transactionId: f.transactionId,
                          direction: f.direction,
                          counterparty: f.payer,
                          amount: {
                            amountMinor: Math.round(Number(f.amount) * 100),
                            currency: selected.currency,
                          },
                          transactionDate: f.date,
                          reference: f.reference,
                        })
                      }
                    >
                      <Field
                        label="Transaction ID (unique)"
                        name="transactionId"
                        required
                      />
                      <Field
                        label="Payer / other party"
                        name="payer"
                        defaultValue={selected.counterparty}
                        required
                      />
                      <Field
                        label={"Amount (" + selected.currency + ")"}
                        name="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                      />
                      <Field
                        label="Payment date"
                        name="date"
                        type="date"
                        defaultValue={date()}
                        required
                      />
                      <label>
                        Direction
                        <select name="direction">
                          <option value="credit">Money received</option>
                          <option value="debit">
                            Money returned / debited
                          </option>
                        </select>
                      </label>
                      <Field
                        label="Invoice or payment reference"
                        name="reference"
                      />
                    </Form>
                    <details className="card">
                      <summary>Import selected Mono transactions</summary>
                      <p>
                        Optional sandbox setup: the operator must bind your
                        consented account first. Nothing is connected by
                        default.
                      </p>
                      <Form
                        title="Bank import"
                        submit={(f) =>
                          save("/mono-import", "POST", {
                            transactionIds: f.ids
                              .split(",")
                              .map((x) => x.trim())
                              .filter(Boolean),
                          })
                        }
                      >
                        <Field
                          label="Transaction IDs (comma separated)"
                          name="ids"
                          required
                        />
                      </Form>
                    </details>
                    <Form
                      key={selected.id + "delivery"}
                      title="Delivery"
                      submit={(f) =>
                        save("/fulfillment", "PUT", {
                          status: f.status,
                          description: f.description,
                          ...(f.status === "completed"
                            ? { completedDate: f.date }
                            : {}),
                        })
                      }
                    >
                      <label>
                        Work status
                        <select
                          name="status"
                          defaultValue={
                            selected.fulfillment?.status ?? "in_progress"
                          }
                        >
                          <option value="in_progress">In progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </label>
                      <Field
                        label="What was delivered?"
                        name="description"
                        defaultValue={selected.fulfillment?.description}
                        required
                      />
                      <Field
                        label="Completion date"
                        name="date"
                        type="date"
                        defaultValue={
                          selected.fulfillment?.completedDate ?? date()
                        }
                      />
                    </Form>
                  </>
                ) : (
                  <section className="card">
                    <h2>Source records</h2>
                    {[
                      ["Agreement", selected.agreement],
                      ["Invoice", selected.invoice],
                      ["Delivery", selected.fulfillment],
                    ].map(([name, value]) => (
                      <div key={String(name)}>
                        <h3>{String(name)}</h3>
                        {value ? (
                          <pre>{JSON.stringify(value, null, 2)}</pre>
                        ) : (
                          <p>Not provided</p>
                        )}
                      </div>
                    ))}
                  </section>
                )}
                <section className="card">
                  <h3>Linked payments</h3>
                  {!selected.transactions.length && (
                    <p>No records linked yet.</p>
                  )}
                  {selected.transactions.map((x: any) => (
                    <article className="record" key={x.id}>
                      <b>
                        {x.direction === "debit" ? "−" : "+"}
                        {money(x.amount.amountMinor, x.amount.currency)}
                      </b>
                      <p>
                        {x.counterparty} · {x.transactionDate}
                      </p>
                      <small>
                        {x.transactionId} · {x.reference || "No reference"} ·
                        Source: {x.source}
                      </small>
                      {user.role === "business" && (
                        <Button
                          className="quiet"
                          onClick={() =>
                            act(
                              () =>
                                save(
                                  "/transactions/" +
                                    encodeURIComponent(x.transactionId),
                                  "DELETE",
                                ),
                              "Payment unlinked",
                            )
                          }
                        >
                          Unlink
                        </Button>
                      )}
                    </article>
                  ))}
                </section>
              </div>
              <div>
                <section className="card">
                  <h3>Evidence files</h3>
                  <p className="muted">
                    Attach the original chat export, invoice, receipt, or
                    delivery proof. A receipt shared in chat is a claim to check
                    against a bank record.
                  </p>
                  {selected.evidence.map((x: any) => (
                    <p key={x.id}>
                      <a
                        href={
                          "/api/v1/events/" + selected.id + "/evidence/" + x.id
                        }
                      >
                        {x.name}
                      </a>{" "}
                      <Badge>{x.kind}</Badge>
                    </p>
                  ))}
                  {user.role === "business" && (
                    <Upload
                      onUpload={async (data) => save("/evidence", "POST", data)}
                    />
                  )}
                </section>
                <section className="card">
                  <h3>Client confirmation</h3>
                  {selected.attestations.map((x: any) => (
                    <p key={x.id}>
                      <Badge
                        good={
                          x.status === "confirmed" &&
                          x.revision === selected.revision
                        }
                      >
                        {x.status}
                      </Badge>{" "}
                      {x.name ?? "Awaiting response"} · revision {x.revision}
                      {x.comment && (
                        <small className="block">{x.comment}</small>
                      )}
                    </p>
                  ))}
                  {user.role === "business" && (
                    <>
                      <p>
                        Finish editing evidence first. Changes make old
                        confirmation links invalid.
                      </p>
                      <Button
                        className="secondary"
                        onClick={() =>
                          act(async () => {
                            const r = await api(
                              "/events/" + selected.id + "/attestations",
                              "POST",
                            );
                            setLink(location.origin + r.path);
                            setSelected(await api("/events/" + selected.id));
                            return r;
                          }, "Link created. Share it with the intended client yourself.")
                        }
                      >
                        Create confirmation link
                      </Button>
                      {link && (
                        <p>
                          <a href={link} target="_blank" rel="noreferrer">
                            Open client confirmation ↗
                          </a>
                          <input
                            aria-label="Confirmation link"
                            readOnly
                            value={link}
                            onFocus={(e) => e.target.select()}
                          />
                        </p>
                      )}
                    </>
                  )}
                  <p className="muted">
                    Anyone holding this link can respond. It is not independent
                    identity verification. No message is sent automatically.
                  </p>
                </section>
                <details className="card">
                  <summary>Evidence graph — linked records</summary>
                  <p>
                    Each record below supports this commercial event. A link
                    shows association, not verification.
                  </p>
                  {selected.evidenceGraph?.nodes
                    .filter((x: any) => x.type !== "commercial_event")
                    .map((x: any) => (
                      <p key={x.id}>
                        <Badge>{x.type}</Badge> {x.label} → this job
                      </p>
                    ))}
                </details>
                <section className="card">
                  <h3>Evidence timeline</h3>
                  {[
                    { label: "Job created", at: selected.created_at },
                    ...selected.evidence.map((x: any) => ({
                      label: x.kind + " file added: " + x.name,
                      at: x.created_at,
                    })),
                    ...selected.attestations
                      .filter((x: any) => x.responded_at)
                      .map((x: any) => ({
                        label: "Client response: " + x.status,
                        at: x.responded_at,
                      })),
                    ...selected.reviews.map((x: any) => ({
                      label: "Reviewer note added",
                      at: x.created_at,
                    })),
                  ]
                    .sort((a, b) => a.at.localeCompare(b.at))
                    .map((x, i) => (
                      <p className="timeline" key={i}>
                        <b>{x.label}</b>
                        <small>{new Date(x.at).toLocaleString()}</small>
                      </p>
                    ))}
                </section>
                {user.role === "business" && (
                  <Form
                    title="AI extraction proposal"
                    submit={async (f) => {
                      await api(
                        "/events/" + selected.id + "/extraction",
                        "POST",
                        {
                          documentId: f.documentId,
                          documentKind: f.kind,
                          documentText: f.text,
                        },
                      );
                      setSelected(await api("/events/" + selected.id));
                      setNotice(
                        "Proposal saved for review. Copy reviewed fields into the evidence forms.",
                      );
                    }}
                  >
                    <p className="muted">
                      Optional provider setup required. Paste text from an
                      attached document; proposed fields never change saved
                      evidence automatically.
                    </p>
                    <label>
                      Attached document
                      <select name="documentId" required>
                        <option value="">Choose a file</option>
                        {selected.evidence
                          .filter((x: any) =>
                            ["agreement", "invoice"].includes(x.kind),
                          )
                          .map((x: any) => (
                            <option value={x.id} key={x.id}>
                              {x.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      Document type
                      <select name="kind">
                        <option>agreement</option>
                        <option>invoice</option>
                      </select>
                    </label>
                    <label>
                      Document text
                      <textarea name="text" minLength={20} required />
                    </label>
                  </Form>
                )}
                {selected.proposals.map((x: any) => (
                  <section className="card" key={x.id}>
                    <h3>Proposed fields — review required</h3>
                    {Object.entries(x.data.fields).map(
                      ([k, v]: [string, any]) => (
                        <p key={k}>
                          <b>
                            {k}: {String(v.value)}
                          </b>
                          <small className="block">
                            Source excerpt: {v.supportingText}
                          </small>
                        </p>
                      ),
                    )}
                  </section>
                ))}
                <section className="card">
                  <h3>Reviewer notes</h3>
                  {selected.reviews.map((x: any) => (
                    <article key={x.id}>
                      <p>{x.note}</p>
                      <small>
                        {x.reviewer_name} · revision {x.revision}
                      </small>
                    </article>
                  ))}
                  {!selected.reviews.length && <p>No reviewer notes yet.</p>}
                </section>
                {user.role === "reviewer" && (
                  <Form
                    title="Review note"
                    submit={(f) => save("/reviews", "POST", { note: f.note })}
                  >
                    <label>
                      Your observations
                      <textarea name="note" required minLength={3} />
                    </label>
                  </Form>
                )}
                {user.role === "business" && (
                  <details className="card">
                    <summary>Edit or remove this job</summary>
                    <EventForm
                      event={selected}
                      submit={(f) => save("", "PATCH", f)}
                    />
                    <Button
                      className="danger"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Delete this job and its evidence? This cannot be undone.",
                          )
                        )
                          act(async () => {
                            await api("/events/" + selected.id, "DELETE");
                            setSelected(null);
                          }, "Job deleted");
                      }}
                    >
                      Delete job
                    </Button>
                  </details>
                )}
              </div>
            </div>
          </>
        ) : view === "jobs" ? (
          <>
            <section className="hero">
              <div>
                <h2>
                  {user.role === "reviewer"
                    ? "Read the evidence. Record your observations."
                    : "Start with one job."}
                </h2>
                <p>
                  {user.role === "reviewer"
                    ? "Only jobs explicitly shared by their owners appear here. Evidence assessments support review; they do not decide credit."
                    : "What was agreed? What was billed? What arrived? Add delivery proof and ask your client to confirm."}
                </p>
              </div>
            </section>
            <div className="stats">
              <div>
                <b>{events.length}</b>
                <span>
                  {user.role === "reviewer" ? "Shared jobs" : "Saved jobs"}
                </span>
              </div>
              <div>
                <b>
                  {
                    events.filter((x) => x.assessment && !x.assessment.stale)
                      .length
                  }
                </b>
                <span>Current assessments</span>
              </div>
              <div>
                <b>
                  {
                    events.filter((x) => x.assessment?.status === "conflict")
                      .length
                  }
                </b>
                <span>Recorded differences</span>
              </div>
            </div>
            <section className="card">
              <h2>{user.role === "reviewer" ? "Review queue" : "Your jobs"}</h2>
              {!events.length && (
                <p className="muted">
                No jobs yet.{" "}
                {user.role === "business"
                    ? "Create a job to organize its agreement, invoice, payment, and delivery records."
                    : "Ask the business owner to share an assessed job."}
                </p>
              )}
              <div className="job-list">
                {events.map((x) => (
                  <button
                    className="job"
                    key={x.id}
                    onClick={() => {
                      setSelected(x);
                      setError("");
                      setNotice("");
                    }}
                  >
                    <div>
                      <b>{x.title}</b>
                      <small>
                        {x.counterparty} · {x.channel} · {x.currency}
                      </small>
                    </div>
                    <Badge
                      good={
                        x.assessment?.status === "consistent" &&
                        !x.assessment?.stale
                      }
                    >
                      {x.assessment?.stale
                        ? "Reassess"
                        : (x.assessment?.label ?? "Not checked")}
                    </Badge>
                    <span>Open →</span>
                  </button>
                ))}
              </div>
            </section>
            {user.role === "business" && (
              <EventForm
                submit={async (f) => {
                  const x = await api("/events", "POST", f);
                  setSelected(x);
                  await refresh();
                }}
              />
            )}
          </>
        ) : view === "profile" ? (
          <section className="card">
            <h2>{business?.name}</h2>
            <p>{profile?.explanation}</p>
            <div className="stats">
              <div>
                <b>{profile?.events}</b>
                <span>Jobs</span>
              </div>
              <div>
                <b>{profile?.consistent}</b>
                <span>Consistent records</span>
              </div>
              <div>
                <b>{profile?.requiresReview}</b>
                <span>Require review</span>
              </div>
            </div>
            <h3>Net linked payments by currency</h3>
            {Object.entries(profile?.netLinkedPaymentsByCurrency ?? {}).map(
              ([c, v]) => (
                <p key={c}>{money(Number(v), c)}</p>
              ),
            )}
            <p className="muted">
              These are linked record totals, not verified revenue.
              Mixed-currency jobs are excluded from totals.
            </p>
          </section>
        ) : view === "business" ? (
          <Form
            key={business?.id}
            title="Business profile"
            submit={async (f) => {
              await api("/business", "PUT", f);
              await refresh();
              setNotice("Business updated");
            }}
          >
            <Field
              label="Business name"
              name="name"
              defaultValue={business?.name}
              required
            />
            <Field
              label="Sector"
              name="sector"
              defaultValue={business?.sector}
            />
            <label>
              About your business
              <textarea
                name="description"
                defaultValue={business?.description}
              />
            </label>
          </Form>
        ) : (
          <section className="card">
            <h2>Recent actions</h2>
            {audit.map((x, i) => (
              <p className="timeline" key={i}>
                <b>{x.action.replaceAll(".", " ")}</b>
                <small>{new Date(x.created_at).toLocaleString()}</small>
              </p>
            ))}
          </section>
        )}
        <footer>
          AuditTrak · Evidence for human review · No credit decisions or fraud
          labels
        </footer>
      </main>
    </div>
  );
}
function EventForm({
  event,
  submit,
}: {
  event?: any;
  submit: (f: any) => Promise<any>;
}) {
  return (
    <Form title={event ? "Job details" : "New job"} submit={submit}>
      <Field
        label="Job title"
        name="title"
        defaultValue={event?.title}
        required
      />
      <Field
        label="Service / work"
        name="service"
        defaultValue={event?.service}
        required
      />
      <Field
        label="Client / counterparty"
        name="counterparty"
        defaultValue={event?.counterparty}
        required
      />
      <Field
        label="Client email (optional)"
        name="counterpartyEmail"
        type="email"
        defaultValue={event?.counterparty_email}
      />
      <Field
        label="Currency (3 letters)"
        name="currency"
        defaultValue={event?.currency ?? "NGN"}
        pattern="[A-Z]{3}"
        required
      />
      <label>
        Job source
        <select name="channel" defaultValue={event?.channel ?? "direct"}>
          <option value="direct">Direct client</option>
          <option value="marketplace">Marketplace</option>
        </select>
      </label>
    </Form>
  );
}
function Upload({ onUpload }: { onUpload: (x: any) => Promise<any> }) {
  const [kind, setKind] = useState("agreement"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <>
      <label>
        Evidence stage
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          {["agreement", "invoice", "payment", "fulfillment", "other"].map(
            (x) => (
              <option key={x}>{x}</option>
            ),
          )}
        </select>
      </label>
      <label>
        {busy ? "Uploading…" : "Attach a file (PDF, PNG, JPEG, text; max 5 MB)"}
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.txt"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setError("");
            if (file.size > 5 * 1024 * 1024) {
              setError("Please choose a file under 5 MB.");
              return;
            }
            setBusy(true);
            try {
              const data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () =>
                  resolve(String(reader.result).split(",")[1]);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
              await onUpload({
                kind,
                name: file.name,
                mime: file.type || "text/plain",
                base64: data,
              });
              e.target.value = "";
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </>
  );
}
function Confirmation({ token }: { token: string }) {
  const [value, setValue] = useState<any>(null),
    [error, setError] = useState(""),
    [done, setDone] = useState(false);
  useEffect(() => {
    api("/attest/" + token)
      .then(setValue)
      .catch((e) => setError(e.message));
  }, [token]);
  return (
    <main className="login">
      <div className="brand">◈ AUDITTRAK</div>
      <h1>Confirm this job</h1>
      {error && <p className="error">{error}</p>}
      {value && (
        <>
          <section className="card">
            <h2>{value.title}</h2>
            <p>
              {value.business} · Client: {value.counterparty}
            </p>
            <p>{value.service}</p>
            {value.invoice && (
              <p>
                Invoice {value.invoice.invoiceNumber}:{" "}
                {money(
                  value.invoice.amount.amountMinor,
                  value.invoice.amount.currency,
                )}
              </p>
            )}
            {value.agreement && (
              <p>
                Agreed:{" "}
                {money(
                  value.agreement.amount.amountMinor,
                  value.agreement.amount.currency,
                )}{" "}
                · {value.agreement.service}
              </p>
            )}
            {value.payments?.map((x: any, i: number) => (
              <p key={i}>
                {x.direction === "credit" ? "Received" : "Debited"}:{" "}
                {money(x.amount.amountMinor, x.amount.currency)} ·{" "}
                {x.counterparty} · {x.date}
              </p>
            ))}
            <p>
              Delivery: {value.fulfillment?.description ?? "Not recorded"} (
              {value.fulfillment?.status ?? "missing"})
            </p>
            <p>
              Revision {value.revision}. Confirm that this accurately describes
              the work and records you know, or dispute it below.
            </p>
          </section>
          {done || value.status !== "pending" ? (
            <p className="notice">Response recorded. Thank you.</p>
          ) : (
            <Form
              title="Your response"
              submit={async (f) => {
                await api("/attest/" + token, "POST", f);
                setDone(true);
              }}
            >
              <Field label="Your name" name="name" required />
              <label>
                Response
                <select name="status">
                  <option value="confirmed">I confirm this job</option>
                  <option value="disputed">I dispute this record</option>
                </select>
              </label>
              <label>
                Comment (optional)
                <textarea name="comment" />
              </label>
            </Form>
          )}
          <p className="muted">
            Only respond if this link was intended for you. Link possession is
            not independent identity verification.
          </p>
        </>
      )}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
