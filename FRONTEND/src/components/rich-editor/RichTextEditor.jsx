import { useEffect, useMemo, useState } from 'react'
import { $createParagraphNode, $createTextNode, $getRoot, $getSelection, $isRangeSelection, $isTextNode, FORMAT_TEXT_COMMAND, REDO_COMMAND, UNDO_COMMAND } from 'lexical'
import { $setBlocksType } from '@lexical/selection'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { $createHeadingNode, $createQuoteNode, HeadingNode, QuoteNode } from '@lexical/rich-text'
import { $createListItemNode, $createListNode, $insertList, $isListNode, $removeList, ListNode, ListItemNode } from '@lexical/list'
import { $generateHtmlFromNodes } from '@lexical/html'
import { FiBold, FiCornerUpRight, FiItalic, FiList, FiRotateCcw, FiUnderline } from 'react-icons/fi'
import './RichTextEditor.css'

const INLINE_FORMAT = { STRONG: 'bold', B: 'bold', EM: 'italic', I: 'italic', U: 'underline', S: 'strikethrough', STRIKE: 'strikethrough' }
const EMPTY_ACTIVE = { bold: false, italic: false, underline: false, strike: false }

function appendInline(node, formats) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = $createTextNode(node.textContent)
    if (formats.length) text.setFormat(formats.join(','))
    return [text]
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return []
  const tag = node.nodeName.toLowerCase()
  if (tag === 'br') return [$createTextNode('\n')]
  const next = INLINE_FORMAT[tag] ? [...formats, INLINE_FORMAT[tag]] : formats
  const nodes = []
  node.childNodes.forEach(child => nodes.push(...appendInline(child, next)))
  return nodes
}

function buildList(parent, type) {
  const list = $createListNode(type)
  parent.childNodes.forEach(child => {
    if (child.nodeName !== 'LI') return
    const item = $createListItemNode()
    appendInline(child, []).forEach(node => item.append(node))
    list.append(item)
  })
  return list
}

function seedEditor(editor, html) {
  const source = (html || '').trim()
  if (!source) return
  const document = new DOMParser().parseFromString(source, 'text/html')
  editor.update(() => {
    const root = $getRoot()
    root.clear()
    const hasBlocks = document.body.querySelector('p,h1,h2,h3,blockquote,ul,ol,div')
    if (!hasBlocks) {
      document.body.textContent.split(/\n+/).filter(line => line.trim()).forEach(line => {
        const paragraph = $createParagraphNode()
        paragraph.append($createTextNode(line))
        root.append(paragraph)
      })
      return
    }
    document.body.childNodes.forEach(child => {
      if (child.nodeType !== Node.ELEMENT_NODE) return
      const tag = child.nodeName.toLowerCase()
      let block = null
      if (tag === 'h1' || tag === 'h2' || tag === 'h3') block = $createHeadingNode(tag)
      else if (tag === 'blockquote') block = $createQuoteNode()
      else if (tag === 'ul') block = buildList(child, 'bullet')
      else if (tag === 'ol') block = buildList(child, 'number')
      else block = $createParagraphNode()
      if (!block) return
      if (block.getType() === 'paragraph' || block.getType() === 'heading' || block.getType() === 'quote') {
        appendInline(child, []).forEach(node => block.append(node))
      }
      root.append(block)
    })
  })
}

export default function RichTextEditor({ value, onChange, placeholder = '' }) {
  const [initialHtml] = useState(value || '')
  const config = useMemo(() => ({
    namespace: 'rich-editor',
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
    theme: {
      heading: { h1: 'lex-heading-1', h2: 'lex-heading-2', h3: 'lex-heading-3' },
      quote: 'lex-quote',
    },
    editorState: editor => seedEditor(editor, initialHtml),
    onError: error => console.error(error),
  }), [initialHtml])

  const emitHtml = (editorState, editor) => {
    editorState.read(() => onChange($generateHtmlFromNodes(editor, null)))
  }

  return <div className="rich-editor">
    <LexicalComposer initialConfig={config}>
      <Toolbar />
      <RichTextPlugin
        contentEditable={<ContentEditable className="lex-content" ariaLabel="Chapter content" />}
        placeholder={<div className="lex-placeholder">{placeholder}</div>}
      />
      <OnChangePlugin onChange={emitHtml} />
      <HistoryPlugin />
      <ListPlugin />
    </LexicalComposer>
  </div>
}

function Toolbar() {
  const [editor] = useLexicalComposerContext()
  const [active, setActive] = useState(EMPTY_ACTIVE)

  useEffect(() => editor.registerUpdateListener(() => {
    setActive(editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return EMPTY_ACTIVE
      return {
        bold: selection.hasFormat('bold'),
        italic: selection.hasFormat('italic'),
        underline: selection.hasFormat('underline'),
        strike: selection.hasFormat('strikethrough'),
      }
    }))
  }), [editor])

  const button = (title, icon, onClick, isActive) => <button type="button" className={isActive ? 'active' : ''} title={title} aria-label={title} onMouseDown={event => event.preventDefault()} onClick={onClick}>{icon}</button>

  const format = type => () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, type)
  const block = type => () => editor.update(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return
    if (type === 'p') $setBlocksType(selection, () => $createParagraphNode())
    else if (type === 'quote') $setBlocksType(selection, () => $createQuoteNode())
    else $setBlocksType(selection, () => $createHeadingNode(type))
  })
  const toggleList = type => () => editor.update(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return
    let ancestor = selection.anchor.getNode().getParent()
    while (ancestor && !$isListNode(ancestor)) ancestor = ancestor.getParent()
    if (ancestor) $removeList(selection)
    else $insertList(selection, type)
  })
  const undo = () => editor.dispatchCommand(UNDO_COMMAND, undefined)
  const redo = () => editor.dispatchCommand(REDO_COMMAND, undefined)
  const clearFormat = () => editor.update(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return
    selection.getNodes().forEach(node => { if ($isTextNode(node)) node.setFormat(0) })
  })

  return <div className="rich-toolbar">
    {button('Undo', <FiRotateCcw size={14} />, undo)}
    {button('Redo', <FiCornerUpRight size={14} />, redo)}
    <span className="rich-divider" />
    {button('Bold', <FiBold size={14} />, format('bold'), active.bold)}
    {button('Italic', <FiItalic size={14} />, format('italic'), active.italic)}
    {button('Underline', <FiUnderline size={14} />, format('underline'), active.underline)}
    {button('Strikethrough', <s aria-hidden>ab</s>, format('strikethrough'), active.strike)}
    <span className="rich-divider" />
    {button('Heading 1', <span className="rich-head-btn">H1</span>, block('h1'))}
    {button('Heading 2', <span className="rich-head-btn">H2</span>, block('h2'))}
    {button('Heading 3', <span className="rich-head-btn">H3</span>, block('h3'))}
    {button('Paragraph', <span className="rich-head-btn">¶</span>, block('p'))}
    {button('Quote', <span className="rich-head-btn" aria-hidden>❝</span>, block('quote'))}
    <span className="rich-divider" />
    {button('Bulleted list', <FiList size={14} />, toggleList('bullet'))}
    {button('Numbered list', <span className="rich-head-btn" aria-hidden>1.</span>, toggleList('number'))}
    <span className="rich-divider" />
    {button('Clear formatting', <span className="rich-head-btn" aria-hidden>✕</span>, clearFormat)}
  </div>
}
