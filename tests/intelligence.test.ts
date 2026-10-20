import assert from 'node:assert/strict'
import test from 'node:test'
import { calculate, chunkDocument, findRelevantChunks } from '../server/tools'

test('calculator returns deterministic arithmetic results', () => {
  assert.equal(calculate('(12 + 8) * 3').output, '60')
  assert.throws(() => calculate('process.exit()'), /arithmetic expressions only/)
})

test('document chunking creates bounded overlapping chunks', () => {
  const chunks = chunkDocument('a'.repeat(2500), 1000, 100)
  assert.equal(chunks.length, 3)
  assert.ok(chunks.every((chunk) => chunk.length <= 1000))
})

test('lexical retrieval returns the most relevant authorized document chunks', () => {
  const results = findRelevantChunks('retention strategy', [
    { id: 'one', name: 'metrics.txt', chunks: ['Activation improved.', 'Retention strategy improved team adoption.'] },
    { id: 'two', name: 'other.txt', chunks: ['A general note about travel.'] },
  ])
  assert.equal(results[0]?.document.id, 'one')
  assert.match(results[0]?.chunk || '', /Retention/)
})
