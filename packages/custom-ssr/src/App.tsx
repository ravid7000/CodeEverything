import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Island } from './Island';
import { EventRoute } from './event/EventRoute';
import type { EventPageProps } from './event/types';

type InitialData = {
  home?: { posts: string[] };
  eventPage?: EventPageProps;
};

export function App({ initialData }: { initialData?: InitialData }) {
  return (
    <div style={{ fontFamily: 'system-ui', padding: 24 }}>
      <nav style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <Link to="/">Home (SSR)</Link>
        <Link to="/about">About (SSG)</Link>
        <Link to="/dashboard">Dashboard (CSR)</Link>
        <Link to="/event/evt-1">Event (SSR)</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home data={initialData?.home} />} />
        <Route path="/about" element={<About />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/event/:id"
          element={<EventRoute serverData={initialData?.eventPage} />}
        />
      </Routes>
    </div>
  );
}

function Home({ data }: { data?: { posts: string[] } }) {
  return (
    <section>
      <h1>Home – streamed SSR</h1>
      <p>Server fetched these posts before flushing HTML:</p>
      <ul>{data?.posts?.map(p => <li key={p}>{p}</li>) ?? <li>(no data)</li>}</ul>
      <React.Suspense fallback={<p>Loading slow widget...</p>}>
        <SlowWidget />
      </React.Suspense>
      <Island name="Counter" props={{ start: 0 }} />
    </section>
  );
}

function SlowWidget() {
  // Pretend this is a slow async server component (use a resource pattern in real code).
  return <p style={{ color: 'green' }}>Slow widget rendered (streamed in)</p>;
}

function About() {
  return (
    <section>
      <h1>About – SSG</h1>
      <p>This page is pre-rendered at build time to <code>dist/static/about.html</code>.</p>
    </section>
  );
}

function Dashboard() {
  const [data, setData] = React.useState<string | null>(null);
  React.useEffect(() => {
    const t = setTimeout(() => setData('Loaded on the client only.'), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <section>
      <h1>Dashboard - CSR only</h1>
      {data ? <p>{data}</p> : <p>Loading on client...</p>}
    </section>
  );
}