<template>
  <main class="loading-shell">
    <section class="loading-state" aria-labelledby="loading-heading">
      <h1 id="loading-heading">Diff Review: loading pinned comparison</h1>
      <p role="status">Loading pinned comparison…</p>
    </section>
  </main>
</template>

<style>
:root {
  color: #f0f6fc;
  background: #0d1117;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 14px;
  font-synthesis: none;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  min-height: 100dvh;
  background: #0d1117;
}

:focus-visible {
  outline: 2px solid #58a6ff;
  outline-offset: 2px;
}

.loading-shell {
  display: grid;
  min-height: 100vh;
  min-height: 100dvh;
  place-items: center;
  padding: 32px;
}

.loading-state {
  padding: 24px;
  border: 1px solid #30363d;
  border-radius: 8px;
  background: #161b22;
  text-align: center;
}

h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
}

p {
  margin: 16px 0 0;
  color: #8b949e;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.43;
}
</style>
