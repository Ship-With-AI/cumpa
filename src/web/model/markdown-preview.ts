import MarkdownIt from 'markdown-it';

const renderer = new MarkdownIt({
  html: false,
  linkify: false,
  typographer: false,
});

renderer.validateLink = (url) => /^(?:https?:|mailto:)/iu.test(url.trim());
renderer.renderer.rules.link_open = (tokens, index, options, environment, self) => {
  const token = tokens[index];
  token.attrSet('target', '_blank');
  token.attrSet('rel', 'noopener noreferrer');
  return self.renderToken(tokens, index, options);
};

export function renderMarkdownPreview(markdown: string): string {
  return markdown === '' ? '<p>No summary yet</p>' : renderer.render(markdown);
}
