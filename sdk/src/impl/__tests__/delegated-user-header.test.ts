import { FREEBUFF_ACTING_USER_HEADER } from '@codebuff/common/constants/freebuff-models'
import { describe, expect, test } from 'bun:test'

import { getModelForRequest } from '../model-provider'

describe('SDK delegated user headers', () => {
  test('sends userId on model requests', async () => {
    const model = getModelForRequest({
      apiKey: 'service-key',
      model: 'test/model',
      userId: 'end-user',
    })

    expect((model as any).config.headers()).toMatchObject({
      Authorization: 'Bearer service-key',
      [FREEBUFF_ACTING_USER_HEADER]: 'end-user',
    })
  })
})
