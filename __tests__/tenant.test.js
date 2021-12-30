import { Tenant } from '../src'

const baseUrl = 'https://test.url'
const httpClient = {
  get: jest.fn(),
  put: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}
const tokenProvider = {
  getToken: jest.fn().mockImplementation(() => 'token'),
}
const headers = {
  authorization: 'Bearer token',
  'content-type': 'application/json',
}

const tenant = new Tenant(baseUrl, httpClient, tokenProvider)
const id = 'user'
const ids = ['user1', 'user2']
const scope = 'scope'

describe('Tenant client should work', () => {
  it('Static getter work', () => {
    const tenantRole = Tenant.role

    expect(tenantRole).toEqual({
      MODERATOR: 'moderator',
      USER: 'user',
    })
  })

  it('readProfile should work with scope', async () => {
    await tenant.readProfile(id, scope)

    expect(httpClient.get).toBeCalledWith(
      `${baseUrl}/users/${id}?scope=${scope}`,
      { headers }
    )
  })

  it('readProfile should work without scope', async () => {
    await tenant.readProfile(id)

    expect(httpClient.get).toBeCalledWith(`${baseUrl}/users/${id}`, { headers })
  })

  it('listProfile should work', async () => {
    await tenant.listProfile(ids, scope)

    expect(httpClient.get).toBeCalledWith(
      `${baseUrl}/users?ids=${ids}&scope=${scope}`,
      { headers }
    )
  })

  it('readScope should work', async () => {
    await tenant.readScope(scope)

    expect(httpClient.get).toBeCalledWith(`${baseUrl}/webinars/${scope}`, {
      headers,
    })
  })

  it('listMaterial should work', async () => {
    await tenant.listMaterial(scope)

    expect(httpClient.get).toBeCalledWith(
      `${baseUrl}/webinars/${scope}/materials`,
      { headers }
    )
  })

  it('createMaterialUrl should work', async () => {
    const materialsUrl = tenant.createMaterialUrl(id)

    expect(materialsUrl).toBe(`${baseUrl}/materials/${id}`)
  })
})
