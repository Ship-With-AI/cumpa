import { describe, expect, test } from 'vitest';

import { renderMarkdownPreview } from '../../src/web/model/markdown-preview.js';

describe('renderMarkdownPreview', () => {
  test('renders the exact local Markdown buffer and treats hostile content as inert', () => {
    const html = renderMarkdownPreview(
      '# Local attempt\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))\n\n[file](file:///private/secret)\n\n[data](data:text/html;base64,PHNjcmlwdD4=)\n\n[good](https://example.test)',
    );

    expect(html).toContain('<h1>Local attempt</h1>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toMatch(/href=["'](?:javascript:|file:|data:)/iu);
    expect(html).toContain('href="https://example.test"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
  });

  test('uses the empty-state copy without persisting a rendered representation', () => {
    expect(renderMarkdownPreview('')).toBe('<p>No summary yet</p>');
  });
});
