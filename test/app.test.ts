import request from 'supertest'
import app from '../src/index'
import {describe, it, expect, afterAll} from 'vitest'

describe('GET /ping', () => {
  it('should return pong', async () => {
    const res = await request(app).get('/api/test/ping')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ message: 'pong' })
  })
})

afterAll(() => {
  console.log("Tests completed.")
})
