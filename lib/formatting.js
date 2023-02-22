import ircFormatting from 'irc-formatting';
import SimpleMarkdown from 'simple-markdown';
import colors from 'irc-colors';

function mdNodeToIRC(node) {
  let { content } = node;
  if (Array.isArray(content)) content = content.map(mdNodeToIRC).join('');
  switch (node.type) {
    case 'em':
      return colors.italic(content);
    case 'strong':
      return colors.bold(content);
    case 'u':
      return colors.underline(content);
    default:
      return content;
  }
}

export function formatFromDiscordToIRC(text) {
  const markdownAST = SimpleMarkdown.defaultInlineParse(text);
  return markdownAST.map(mdNodeToIRC).join('');
}

export function formatFromIRCToDiscord(text) {
  let needColorFormat = false;
  let pdeath = text.indexOf(" was killed by ") + text.indexOf(" was annihilated by ") + text.indexOf(" was vaporized by ");
  pdeath += text.indexOf(" was destroyed by ") + text.indexOf(" was killed and destroyed by ");
  pdeath += text.indexOf(" was torn up by ") + text.indexOf(" was shredded by ");
  pdeath += text.indexOf(" was wasted by ") + text.indexOf(" was crushed by ");
  let pwin = text.indexOf("Morgoth, Lord of Darkness was slain by ")
  let pSuperUnique = text.indexOf("Michael, the Guardian Overlord was slain by ")
                     + text.indexOf("Bahamut, the Platinum King was slain by ")
                     + text.indexOf("The Living Lightning was slain by ")
                     + text.indexOf("Tik'srvzllat was slain by  ")
                     + text.indexOf("The Hellraiser was slain by ")
                     + text.indexOf("Zu-Aon, The Cosmic Border Guard was slain by ");


  const blocks = ircFormatting.parse(text).map(block => ({
    // Consider reverse as italic, some IRC clients use that
    ...block,
    italic: block.italic || block.reverse
  }));

  let mdText = '';

  if (pdeath > -9
     || pwin != -1
     || pSuperUnique > -6
  ) {
    needColorFormat = true;
  }

  if (needColorFormat === true) {
    mdText += '```ansi\n';
  }

  if (pdeath > -5) mdText += '\u{001b}[0;31m';
  if (pwin != -1) mdText += '\u{001b}[0;33m';
  if (pSuperUnique != -1) mdText += '\u{001b}[0;34m';

  for (let i = 0; i <= blocks.length; i += 1) {
    // Default to unstyled blocks when index out of range
    const block = blocks[i] || {};
    const prevBlock = blocks[i - 1] || {};

    // Add start markers when style turns from false to true
    if (!prevBlock.italic && block.italic) mdText += '*';
    if (!prevBlock.bold && block.bold) mdText += '**';
    if (!prevBlock.underline && block.underline) mdText += '__';

    // Add end markers when style turns from true to false
    // (and apply in reverse order to maintain nesting)
    if (prevBlock.underline && !block.underline) mdText += '__';
    if (prevBlock.bold && !block.bold) mdText += '**';
    if (prevBlock.italic && !block.italic) mdText += '*';

    mdText += block.text || '';
  }

  if (needColorFormat === true) {
    mdText += '\n```';
  }

  return mdText;
}
