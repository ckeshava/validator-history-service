import chains from '../../src/connection-manager/chains'
import { destroy, query, setupTables } from '../../src/shared/database'
import { Chain } from '../../src/shared/types'

import validations from './fixtures/all-validations.json'

jest.useFakeTimers()

describe('Creates chains', () => {
  beforeAll(async () => {
    await setupTables()
  })

  afterAll(async () => {
    await destroy()
  })

  beforeEach(async () => {
    await query('crawls').delete('*')
  })

  test('Perfect validation scores', async () => {
    for (const validation of validations) {
      chains.updateLedgers(validation)
    }

    const currentTimestamp = Date.now()

    // Mock date.now
    Date.now = (): number => currentTimestamp + 11000

    const constructed: Chain[] = chains.calculateChainsFromLedgers()

    expect(constructed[0].ledgers).toContain('LEDGER1')
    expect(constructed[0].ledgers).toContain('LEDGER2')
    expect(constructed[0].ledgers).toContain('LEDGER3')

    expect(constructed[0].validators).toContain('VALIDATOR1')
    expect(constructed[0].validators).toContain('VALIDATOR2')
    expect(constructed[0].validators).toContain('VALIDATOR3')

    expect(constructed.length).toBe(1)
    expect(constructed[0].id).toBe('chain.0')
    expect(constructed[0].first).toBe(1)
    expect(constructed[0].current).toBe(3)
    expect(constructed[0].updated).toBeLessThanOrEqual(currentTimestamp)
    expect(constructed[0].incomplete).toBe(true)
  })

  test('Purge chains removes ledgers', async () => {
    await chains.purgeChains()

    const constructed: Chain[] = chains.calculateChainsFromLedgers()

    expect(constructed.length).toBe(1)
    expect(constructed[0].id).toBe('chain.0')
    expect(constructed[0].ledgers).toEqual(new Set())
    expect(constructed[0].incomplete).toBe(false)
    expect(constructed[0].validators).toContain('VALIDATOR1')
    expect(constructed[0].validators).toContain('VALIDATOR2')
    expect(constructed[0].validators).toContain('VALIDATOR3')
  })
})
