import {
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  ChevronRight,
  CircleDotDashed,
  CloudUpload,
  FileCheck2,
  Fingerprint,
  Menu,
  ScanFace,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

const fallbackAppUrl = 'https://app.example.com';
const appUrl = normalizeUrl(import.meta.env.VITE_APP_URL, fallbackAppUrl);

function normalizeUrl(value: string | undefined, fallback: string) {
  try {
    return new URL(value ?? fallback).origin;
  } catch {
    return fallback;
  }
}

function productUrl(path: string) {
  const destination = new URL(path, appUrl);
  if (typeof window !== 'undefined') {
    const campaign = new URLSearchParams(window.location.search);
    for (const [key, value] of campaign) {
      if (key === 'ref' || key.startsWith('utm_')) destination.searchParams.set(key, value);
    }
  }
  return destination.toString();
}

function AppLink({
  children,
  className,
  path,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  path: string;
  onClick?: () => void;
}) {
  const href = useMemo(() => productUrl(path), [path]);
  return (
    <a className={className} href={href} onClick={onClick}>
      {children}
    </a>
  );
}

function Mark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-mark" aria-label="FaceMatch">
      <svg aria-hidden="true" viewBox="0 0 42 42" fill="none">
        <path d="M8.5 14.8V9.5H14" stroke="currentColor" strokeWidth="3.1" strokeLinecap="square" />
        <path d="M28 9.5h5.5v5.3" stroke="currentColor" strokeWidth="3.1" strokeLinecap="square" />
        <path
          d="M33.5 27.2v5.3H28"
          stroke="currentColor"
          strokeWidth="3.1"
          strokeLinecap="square"
        />
        <path
          d="M14 32.5H8.5v-5.3"
          stroke="currentColor"
          strokeWidth="3.1"
          strokeLinecap="square"
        />
        <path
          d="M15.3 20.8c1.5-3.8 4-5.7 7.5-5.7 3.2 0 5.4 1.9 6.4 5.7"
          stroke="currentColor"
          strokeWidth="2.35"
          strokeLinecap="round"
        />
        <path
          d="M14.6 25.8c2.2 1.7 4.7 2.5 7.5 2.5 2.5 0 4.8-.8 6.8-2.5"
          stroke="currentColor"
          strokeWidth="2.35"
          strokeLinecap="round"
        />
        <circle cx="17.7" cy="20.4" r="1.15" fill="currentColor" />
        <circle cx="26.2" cy="20.4" r="1.15" fill="currentColor" />
      </svg>
      {!compact && <span>FaceMatch</span>}
    </span>
  );
}

function SectionTag({ children }: { children: ReactNode }) {
  return (
    <p className="section-tag">
      <span aria-hidden="true" />
      {children}
    </p>
  );
}

const featureCards = [
  {
    icon: ScanFace,
    number: '01',
    title: 'One match flow. Two ways in.',
    text: 'Start from a photo, your desktop webcam, or a mobile camera. The result format stays familiar for your team.',
  },
  {
    icon: FileCheck2,
    number: '02',
    title: 'Review before it becomes record.',
    text: 'Work through suggested matches, reassign the uncertain ones, and keep the human decision visible.',
  },
  {
    icon: UsersRound,
    number: '03',
    title: 'Identity operations in one place.',
    text: 'Organize people, images, workspaces, team members, and plan usage without stitching together point tools.',
  },
];

const useCases = [
  [
    'Event teams',
    'Move from a mobile capture to a reviewable result while the moment is still happening.',
    Camera,
  ],
  [
    'Media archives',
    'Bring order to large, consented image libraries and find the right identity faster.',
    CloudUpload,
  ],
  [
    'Visitor workflows',
    'Give authorized staff a clear, operational workspace for identity-led processes.',
    Fingerprint,
  ],
];

const faqs = [
  [
    'Can people use a phone camera?',
    'Yes. The Face Match workspace keeps the existing photo-upload path and adds an optional camera capture path that works with supported desktop and mobile browsers.',
  ],
  [
    'Does FaceMatch replace human review?',
    'No. The workspace is designed to surface ranked matches and support review. Teams remain responsible for their policies, permissions, and final operational decisions.',
  ],
  [
    'Who is FaceMatch for?',
    'It is built for teams that need to manage known identities, process image collections, and run repeatable matching workflows from one web workspace.',
  ],
  [
    'How do we get started?',
    'Create a workspace, add the people and images that belong in your permitted workflow, then use upload or camera capture to begin matching.',
  ],
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <nav className="nav-wrap" aria-label="Primary navigation">
          <a className="brand-link" href="#top">
            <Mark />
          </a>
          <div className="desktop-nav">
            <a href="#product">Product</a>
            <a href="#workflow">Workflow</a>
            <a href="#use-cases">Use cases</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="nav-actions">
            <AppLink className="text-link" path="/login">
              Sign in <ArrowUpRight />
            </AppLink>
            <AppLink className="button button--small" path="/register">
              Start free <ArrowRight />
            </AppLink>
          </div>
          <button
            className="menu-trigger"
            type="button"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </nav>
        <div className="mobile-nav" data-open={menuOpen}>
          <a href="#product" onClick={() => setMenuOpen(false)}>
            Product
          </a>
          <a href="#workflow" onClick={() => setMenuOpen(false)}>
            Workflow
          </a>
          <a href="#use-cases" onClick={() => setMenuOpen(false)}>
            Use cases
          </a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>
            FAQ
          </a>
          <AppLink className="button" path="/register" onClick={() => setMenuOpen(false)}>
            Start free <ArrowRight />
          </AppLink>
        </div>
      </header>

      <main id="main-content">
        <section className="hero" id="top">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-copy" data-reveal>
            <p className="eyebrow">
              <span className="status-dot" />
              Built for consent-led identity operations
            </p>
            <h1>
              Match the moment.
              <br />
              <em>Keep the judgment.</em>
            </h1>
            <p className="hero-lede">
              FaceMatch gives your team a calm, capable place to organize identities, match faces,
              and review results—whether the image comes from a library, webcam, or phone.
            </p>
            <div className="hero-actions">
              <AppLink className="button button--accent" path="/register">
                Create a workspace <ArrowDownRight />
              </AppLink>
              <a className="button button--ghost" href="#workflow">
                See how it works <ChevronRight />
              </a>
            </div>
            <div className="hero-assurances" aria-label="Product highlights">
              <span>
                <Check />
                Upload or camera
              </span>
              <span>
                <Check />
                Ranked results
              </span>
              <span>
                <Check />
                Human review
              </span>
            </div>
          </div>

          <div
            className="signal-stage"
            data-reveal
            data-delay="1"
            aria-label="A visual demonstration of a successful identity match"
          >
            <div className="signal-topline">
              <span>LIVE MATCH FLOW</span>
              <span className="signal-time">00:02.48</span>
            </div>
            <div className="scan-window">
              <div className="scan-line" />
              <div className="frame-corner frame-corner--tl" />
              <div className="frame-corner frame-corner--tr" />
              <div className="frame-corner frame-corner--bl" />
              <div className="frame-corner frame-corner--br" />
              <div className="profile-orbit profile-orbit--one" />
              <div className="profile-orbit profile-orbit--two" />
              <div className="face-signal" aria-hidden="true">
                <svg viewBox="0 0 260 305" fill="none">
                  <path
                    d="M132 35c45 0 75 36 75 87 0 68-37 114-75 114-39 0-76-46-76-114 0-51 30-87 76-87Z"
                    stroke="currentColor"
                    strokeWidth="2.4"
                  />
                  <path
                    d="M85 109c13-17 29-25 47-25 22 0 39 9 52 25M88 143c17 10 31 15 44 15 18 0 32-5 43-15M109 120h.1M154 120h.1M113 188c12 8 24 11 37 0"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M67 262c13-34 35-50 65-50 31 0 53 16 66 50"
                    stroke="currentColor"
                    strokeWidth="2.4"
                  />
                  <circle
                    cx="132"
                    cy="122"
                    r="71"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="4 7"
                    opacity=".62"
                  />
                  <circle
                    cx="132"
                    cy="122"
                    r="91"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="2 9"
                    opacity=".4"
                  />
                </svg>
              </div>
              <span className="signal-label signal-label--top">IDENTITY SIGNAL</span>
              <span className="signal-label signal-label--bottom">CAMERA READY</span>
            </div>
            <div className="result-chip">
              <div className="result-avatar">
                <Mark compact />
              </div>
              <div>
                <span>TOP RESULT</span>
                <strong>92.4% match</strong>
              </div>
              <BadgeCheck aria-label="Verified match" />
            </div>
            <div className="source-chip">
              <Camera />
              <span>Mobile camera</span>
              <i />
            </div>
          </div>
        </section>

        <section className="ticker" aria-label="FaceMatch capabilities">
          <div className="ticker-track">
            <span>DESKTOP + MOBILE</span>
            <i /> <span>PHOTO UPLOAD</span>
            <i /> <span>LIVE CAMERA</span>
            <i /> <span>REVIEW QUEUES</span>
            <i /> <span>TEAM WORKSPACES</span>
            <i />
            <span aria-hidden="true">DESKTOP + MOBILE</span>
            <i aria-hidden="true" /> <span aria-hidden="true">PHOTO UPLOAD</span>
            <i aria-hidden="true" /> <span aria-hidden="true">LIVE CAMERA</span>
            <i aria-hidden="true" />
          </div>
        </section>

        <section className="intro-section section" id="product">
          <div className="section-intro" data-reveal>
            <SectionTag>PRODUCT</SectionTag>
            <h2>
              The useful part of face recognition is what happens <em>after</em> the match.
            </h2>
          </div>
          <div className="intro-copy" data-reveal data-delay="1">
            <p>
              FaceMatch turns a technical capability into a legible team workflow: collect an image,
              see ranked results, review the exception, and keep operating.
            </p>
            <a className="inline-link" href="#workflow">
              Explore the workflow <ArrowRight />
            </a>
          </div>
        </section>

        <section className="features section" aria-label="FaceMatch product features">
          {featureCards.map(({ icon: Icon, number, title, text }) => (
            <article className="feature-card" key={number} data-reveal>
              <div className="feature-heading">
                <span>{number}</span>
                <Icon />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
              <div className="feature-rule" />
            </article>
          ))}
        </section>

        <section className="workflow-section" id="workflow">
          <div className="section workflow-header" data-reveal>
            <div>
              <SectionTag>THE WORKFLOW</SectionTag>
              <h2>Designed for the few seconds that matter.</h2>
            </div>
            <p>Every step is bounded, visible, and ready for the next person in the process.</p>
          </div>
          <div className="workflow-canvas" data-reveal>
            <article className="workflow-card workflow-card--capture">
              <span className="workflow-number">01 / CAPTURE</span>
              <div className="capture-visual">
                <div className="phone-shell">
                  <div className="phone-camera">
                    <ScanFace />
                    <span />
                  </div>
                  <small>Use camera</small>
                </div>
                <div className="capture-pulse">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <h3>Meet the image where it is.</h3>
              <p>
                Choose a photo or open the camera. The workspace supports desktop and mobile capture
                without changing the match flow.
              </p>
            </article>
            <article className="workflow-card workflow-card--match">
              <span className="workflow-number">02 / MATCH</span>
              <div className="match-visual">
                <div className="match-source">
                  <ScanFace />
                </div>
                <div className="match-connector">
                  <span />
                  <ArrowRight />
                </div>
                <div className="match-result">
                  <span>TOP RESULT</span>
                  <strong>92.4</strong>
                  <small>confidence score</small>
                </div>
              </div>
              <h3>See the signal, not a black box.</h3>
              <p>
                Get ranked matches in a consistent result view, whether the source was upload,
                webcam, or mobile capture.
              </p>
            </article>
            <article className="workflow-card workflow-card--review">
              <span className="workflow-number">03 / REVIEW</span>
              <div className="review-visual">
                <div className="review-row">
                  <span className="mini-avatar mini-avatar--a" />
                  <div>
                    <b>Suggested identity</b>
                    <small>Ready for review</small>
                  </div>
                  <Check />
                </div>
                <div className="review-row">
                  <span className="mini-avatar mini-avatar--b" />
                  <div>
                    <b>Needs a decision</b>
                    <small>Assign or skip</small>
                  </div>
                  <CircleDotDashed />
                </div>
              </div>
              <h3>Keep the final call human.</h3>
              <p>
                Review mappings, resolve uncertain results, and leave a cleaner identity record for
                the next workflow.
              </p>
            </article>
          </div>
        </section>

        <section className="operations-section section">
          <div className="operations-panel" data-reveal>
            <div className="ops-copy">
              <SectionTag>ONE OPERATING SURFACE</SectionTag>
              <h2>From the first image to the final review.</h2>
              <p>
                FaceMatch brings the surrounding work into the same workspace, so a match does not
                end up as an isolated event.
              </p>
              <ul>
                <li>
                  <Check />
                  Known identities and face galleries
                </li>
                <li>
                  <Check />
                  Batch uploads with visible progress
                </li>
                <li>
                  <Check />
                  Workspaces, members, and plan controls
                </li>
              </ul>
              <AppLink className="button button--dark" path="/register">
                Open your workspace <ArrowRight />
              </AppLink>
            </div>
            <div className="ops-console" aria-label="Illustrative FaceMatch operations dashboard">
              <div className="console-bar">
                <Mark compact />
                <span>OPERATIONS / TODAY</span>
                <i />
              </div>
              <div className="console-content">
                <div className="console-stats">
                  <div>
                    <small>IDENTITIES</small>
                    <strong>1,284</strong>
                    <span>+18 this week</span>
                  </div>
                  <div>
                    <small>IN REVIEW</small>
                    <strong>24</strong>
                    <span>Queue is active</span>
                  </div>
                </div>
                <div className="console-chart">
                  <div className="chart-title">
                    <span>Match activity</span>
                    <small>last 7 days</small>
                  </div>
                  <div className="bars">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
                <div className="console-queue">
                  <div>
                    <span className="mini-avatar mini-avatar--c" />
                    <p>
                      <b>Workshop set</b>
                      <small>6 images ready to review</small>
                    </p>
                    <ChevronRight />
                  </div>
                  <div>
                    <span className="mini-avatar mini-avatar--d" />
                    <p>
                      <b>New capture</b>
                      <small>1 match completed</small>
                    </p>
                    <ChevronRight />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="use-cases-section" id="use-cases">
          <div className="section use-cases-header" data-reveal>
            <div>
              <SectionTag>FOR REAL OPERATIONS</SectionTag>
              <h2>
                Built to fit into
                <br />
                <em>your workflow.</em>
              </h2>
            </div>
            <p>
              Use FaceMatch where consent, clarity, and a dependable review process are part of
              doing the job well.
            </p>
          </div>
          <div className="use-case-grid section">
            {useCases.map(([title, text, Icon]) => {
              const UseCaseIcon = Icon as typeof Camera;
              return (
                <article key={title as string} className="use-case" data-reveal>
                  <UseCaseIcon />
                  <h3>{title as string}</h3>
                  <p>{text as string}</p>
                  <span>
                    Explore use case <ArrowRight />
                  </span>
                </article>
              );
            })}
          </div>
        </section>

        <section className="principles-section section" data-reveal>
          <div className="principle-symbol">
            <ShieldCheck />
          </div>
          <div>
            <SectionTag>OPERATE RESPONSIBLY</SectionTag>
            <h2>Useful only when it is used with care.</h2>
          </div>
          <p>
            Face recognition can affect people. FaceMatch is designed to support accountable
            teams—not to replace your consent process, local legal obligations, or human judgment.
          </p>
        </section>

        <section className="faq-section section" id="faq">
          <div className="faq-heading" data-reveal>
            <SectionTag>QUESTIONS, ANSWERED</SectionTag>
            <h2>
              Start with a<br />
              <em>clear picture.</em>
            </h2>
          </div>
          <div className="faq-list" data-reveal data-delay="1">
            {faqs.map(([question, answer], index) => (
              <details key={question} open={index === 0}>
                <summary>
                  {question}
                  <span>+</span>
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="closing-section">
          <div className="closing-orbit closing-orbit--one" aria-hidden="true" />
          <div className="closing-orbit closing-orbit--two" aria-hidden="true" />
          <div data-reveal>
            <p className="eyebrow">
              <Sparkles />A clearer place to begin
            </p>
            <h2>Bring your identity workflow into focus.</h2>
            <p>
              Set up a team workspace and turn your next permitted image into an informed next step.
            </p>
            <AppLink className="button button--accent" path="/register">
              Start with FaceMatch <ArrowDownRight />
            </AppLink>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-top">
          <a className="brand-link" href="#top">
            <Mark />
          </a>
          <p>FaceMatch is a web workspace for consent-led identity operations.</p>
          <AppLink className="text-link" path="/login">
            Sign in <ArrowUpRight />
          </AppLink>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} FaceMatch</span>
          <span>Use responsibly. Respect people.</span>
          <a href="#faq">FAQ</a>
        </div>
      </footer>
    </div>
  );
}

function ArrowUpRight() {
  return (
    <span className="arrow-up-right" aria-hidden="true">
      ↗
    </span>
  );
}
