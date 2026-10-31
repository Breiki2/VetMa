import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App } from './App'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('VetMa workspace', () => {
  it('signs in and shows the veterinarian client workspace', async () => {
    const fetchMock = mockFetch({ role: 'veterinarian' })

    render(<App />)
    await signIn('veterinarian')

    expect(await screen.findByRole('heading', { name: 'Clientes' })).toBeInTheDocument()
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/clients?q='),
        expect.objectContaining({ credentials: 'include' }),
      )
    })
  })

  it('creates a Client, Patient, and Atención through their workflows', async () => {
    let clientExists = false
    let patientExists = false
    let recordedAttention = false
    const client = { id: 7, name: 'Ana', surname: 'Pérez', phone: '112233', debtTotal: '0.00' }
    const patient = { id: 8, name: 'Mora', species: 'cat', sex: 'female', castrated: true, approximateAge: '4 años' }
    const attention = {
      id: 9,
      dateTime: '2026-10-30T13:00:00.000Z',
      types: ['atencion'],
      reason: 'Control anual',
      observations: 'Sin novedades',
      chargedAmount: '15000.00',
      debtAmount: '0.00',
      vaccineApplications: [],
    }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init = {}) => {
      const url = String(input)
      const method = (init.method || 'GET').toUpperCase()

      if (url.endsWith('/api/me')) return Response.json({ error: 'unauthenticated' }, { status: 401 })
      if (url.endsWith('/api/csrf-token')) return Response.json({ csrfToken: 'csrf-test' })
      if (url.endsWith('/api/login')) return Response.json(sessionUser('veterinarian'))
      if (url.includes('/api/clients?q=')) {
        return Response.json({ items: clientExists ? [{ ...client, debtTotal: '0.00' }] : [], pagination: { total: Number(clientExists), page: 1, limit: 20 } })
      }
      if (url.endsWith('/api/clients') && method === 'POST') {
        clientExists = true
        return Response.json(client, { status: 201 })
      }
      if (url.includes('/api/clients/7?page=') && method === 'GET') {
        return Response.json({
          ...client,
          debtTotal: '0.00',
          patients: patientExists ? [patient] : [],
          patientsPagination: { total: Number(patientExists), page: 1, limit: 20 },
          attentions: [],
        })
      }
      if (url.endsWith('/api/clients/7/patients') && method === 'POST') {
        patientExists = true
        return Response.json(patient, { status: 201 })
      }
      if (url.endsWith('/api/vaccines?species=cat')) return Response.json([])
      if (url.endsWith('/api/patients/8/attentions') && method === 'GET') {
        return Response.json(recordedAttention ? [attention] : [])
      }
      if (url.endsWith('/api/patients/8/attentions') && method === 'POST') {
        recordedAttention = true
        return Response.json(attention, { status: 201 })
      }
      if (url.endsWith('/api/attentions/9') && method === 'PATCH') {
        attention.chargedAmount = '20000.00'
        attention.debtAmount = '0.00'
        return Response.json(attention)
      }
      if (url.endsWith('/api/attentions/9') && method === 'DELETE') {
        recordedAttention = false
        return new Response(null, { status: 204 })
      }

      throw new Error(`Unexpected request ${method} ${url}`)
    })

    render(<App />)
    await signIn('veterinarian')
    fireEvent.click(await screen.findByRole('button', { name: 'Nuevo cliente' }))
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText('Apellido'), { target: { value: 'Pérez' } })
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '112233' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cliente' }))

    expect(await screen.findByRole('heading', { name: 'Ana Pérez' })).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: /Agregar paciente/ })[0])
    fireEvent.change(screen.getByLabelText('Nombre del paciente'), { target: { value: 'Mora' } })
    fireEvent.change(screen.getByLabelText('Edad aproximada'), { target: { value: '4 años' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar paciente' }))

    fireEvent.click(await screen.findByRole('button', { name: /Mora/ }))
    expect(await screen.findByRole('heading', { name: 'Mora' })).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Registrar atención' })[0])
    fireEvent.click(screen.getByLabelText('Atención clínica'))
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Control anual' } })
    fireEvent.change(screen.getByLabelText('Observaciones'), { target: { value: 'Sin novedades' } })
    fireEvent.change(screen.getByLabelText('Monto cobrado'), { target: { value: '15000.00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar atención' }))

    expect(await screen.findByText('Control anual')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/patients/8/attentions'),
      expect.objectContaining({ method: 'POST' }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    fireEvent.change(screen.getByLabelText('Monto cobrado'), { target: { value: '20000.00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/attentions/9'),
        expect.objectContaining({ method: 'PATCH' }),
      )
    })

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/attentions/9'),
        expect.objectContaining({ method: 'DELETE' }),
      )
    })
  })

  it('lets an administrator create an account and navigate between workspace sections', async () => {
    let createdUser = false
    const user = { ...sessionUser('admin', 'Admin Vet'), active: true }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init = {}) => {
      const url = String(input)
      const method = (init.method || 'GET').toUpperCase()

      if (url.endsWith('/api/me')) return Response.json({ error: 'unauthenticated' }, { status: 401 })
      if (url.endsWith('/api/csrf-token')) return Response.json({ csrfToken: 'csrf-test' })
      if (url.endsWith('/api/login')) return Response.json(user)
      if (url.includes('/api/clients?q=')) return Response.json({ items: [], pagination: { total: 0, page: 1, limit: 20 } })
      if (url.endsWith('/api/admin/users') && method === 'GET') return Response.json(createdUser ? [user] : [])
      if (url.endsWith('/api/admin/users') && method === 'POST') {
        createdUser = true
        return Response.json(user, { status: 201 })
      }
      if (url.includes('/api/clients/debts')) return Response.json({ items: [], pagination: { total: 0, page: 1, limit: 20 } })
      if (url.endsWith('/api/vaccines?species=')) return Response.json([])

      throw new Error(`Unexpected request ${method} ${url}`)
    })

    render(<App />)
    await signIn('admin')
    fireEvent.click(screen.getByRole('button', { name: 'Usuarios' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Nuevo usuario' }))
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Dra. Eva' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'eva@example.test' } })
    fireEvent.change(screen.getByLabelText(/Contraseña inicial/), { target: { value: 'Long-Password-987!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear usuario' }))

    expect(await screen.findByText('Admin Vet')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/users'),
      expect.objectContaining({ method: 'POST' }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Deudas' }))
    expect(await screen.findByRole('heading', { name: 'Deudas pendientes' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Vacunas' }))
    expect(await screen.findByRole('heading', { name: 'Vacunas' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Configuración' }))
    expect(await screen.findByRole('heading', { name: 'Configuración' })).toBeInTheDocument()
  })

  it('lets an administrator manage the global vaccine catalog', async () => {
    let vaccineCreated = false
    let vaccineActive = true
    const vaccine = { id: 1, name: 'Antirrábica', species: 'both', active: true }

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init = {}) => {
      const url = String(input)
      const method = (init.method || 'GET').toUpperCase()

      if (url.endsWith('/api/me')) return Response.json({ error: 'unauthenticated' }, { status: 401 })
      if (url.endsWith('/api/csrf-token')) return Response.json({ csrfToken: 'csrf-test' })
      if (url.endsWith('/api/login')) return Response.json(sessionUser('admin', 'Admin Vet'))
      if (url.includes('/api/clients?q=')) return Response.json({ items: [], pagination: { total: 0, page: 1, limit: 20 } })
      if (url.endsWith('/api/vaccines') && method === 'GET') {
        return Response.json(vaccineCreated ? [{ ...vaccine, active: vaccineActive }] : [])
      }
      if (url.endsWith('/api/vaccines') && method === 'POST') {
        vaccineCreated = true
        return Response.json(vaccine, { status: 201 })
      }
      if (url.endsWith('/api/vaccines/1') && method === 'DELETE') {
        vaccineActive = false
        return new Response(null, { status: 204 })
      }

      throw new Error(`Unexpected request ${method} ${url}`)
    })

    render(<App />)
    await signIn('admin')
    fireEvent.click(screen.getByRole('button', { name: 'Vacunas' }))
    expect(await screen.findByRole('heading', { name: 'Vacunas' })).toBeInTheDocument()

    fireEvent.click(await screen.findByRole('button', { name: 'Nueva vacuna' }))
    fireEvent.change(screen.getByLabelText('Nombre de la vacuna'), { target: { value: 'Antirrábica' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear vacuna' }))

    expect(await screen.findByText('Antirrábica')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/vaccines'),
      expect.objectContaining({ method: 'POST' }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Desactivar' }))
    await waitFor(() => {
      expect(screen.getByText('Inactiva')).toBeInTheDocument()
    })
  })

  it('supports multiple vaccines with batch number and displays inline image preview for attachments', async () => {
    const client = { id: 7, name: 'Ana', surname: 'Pérez', phone: '112233', debtTotal: '0.00' }
    const patient = { id: 8, name: 'Mora', species: 'cat', sex: 'female', castrated: true, approximateAge: '4 años' }
    const attention = {
      id: 9,
      dateTime: '2026-10-30T13:00:00.000Z',
      types: ['vacuna', 'ecografia'],
      reason: 'Vacunación y eco',
      observations: 'Todo bien',
      chargedAmount: '20000.00',
      debtAmount: '0.00',
      attachments: [
        { id: 101, name: 'ecografia.jpg', mimeType: 'image/jpeg', size: 204800 },
        { id: 102, name: 'informe.pdf', mimeType: 'application/pdf', size: 51200 },
      ],
      vaccineApplications: [
        { vaccineId: 1, vaccineName: 'Triple Felina', appliedAt: '2026-10-30T13:00:00.000Z', batchNumber: 'TF-999' },
      ],
    }

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input)
      if (url.endsWith('/api/me')) return Response.json({ error: 'unauthenticated' }, { status: 401 })
      if (url.endsWith('/api/csrf-token')) return Response.json({ csrfToken: 'csrf-test' })
      if (url.endsWith('/api/login')) return Response.json(sessionUser('veterinarian'))
      if (url.includes('/api/clients?q=')) {
        return Response.json({ items: [client], pagination: { total: 1, page: 1, limit: 20 } })
      }
      if (url.includes('/api/clients/7?page=')) {
        return Response.json({
          ...client,
          patients: [patient],
          patientsPagination: { total: 1, page: 1, limit: 20 },
          attentions: [],
        })
      }
      if (url.endsWith('/api/vaccines?species=cat')) {
        return Response.json([{ id: 1, name: 'Triple Felina', species: 'cat', active: true }])
      }
      if (url.endsWith('/api/patients/8/attentions')) {
        return Response.json([attention])
      }
      throw new Error(`Unexpected request ${url}`)
    })

    render(<App />)
    await signIn('veterinarian')
    fireEvent.click(await screen.findByText('Ana Pérez'))
    fireEvent.click(await screen.findByRole('button', { name: /Mora/ }))

    expect(await screen.findByText('Triple Felina')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'ecografia.jpg' })).toBeInTheDocument()
    expect(screen.getByText(/informe.pdf/)).toBeInTheDocument()
  })

  it('shows attention fields according to the selected types', async () => {
    const client = { id: 7, name: 'Ana', surname: 'Pérez', phone: '112233', debtTotal: '0.00' }
    const patient = { id: 8, name: 'Mora', species: 'cat', sex: 'female', castrated: true, approximateAge: '4 años' }

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input)
      if (url.endsWith('/api/me')) return Response.json({ error: 'unauthenticated' }, { status: 401 })
      if (url.endsWith('/api/csrf-token')) return Response.json({ csrfToken: 'csrf-test' })
      if (url.endsWith('/api/login')) return Response.json(sessionUser('veterinarian'))
      if (url.includes('/api/clients?q=')) {
        return Response.json({ items: [client], pagination: { total: 1, page: 1, limit: 20 } })
      }
      if (url.includes('/api/clients/7?page=')) {
        return Response.json({
          ...client,
          patients: [patient],
          patientsPagination: { total: 1, page: 1, limit: 20 },
          attentions: [],
        })
      }
      if (url.endsWith('/api/vaccines?species=cat')) {
        return Response.json([{ id: 1, name: 'Triple Felina', species: 'cat', active: true }])
      }
      if (url.endsWith('/api/patients/8/attentions')) return Response.json([])
      throw new Error(`Unexpected request ${url}`)
    })

    render(<App />)
    await signIn('veterinarian')
    fireEvent.click(await screen.findByText('Ana Pérez'))
    fireEvent.click(await screen.findByRole('button', { name: /Mora/ }))
    fireEvent.click((await screen.findAllByRole('button', { name: 'Registrar atención' }))[0])

    expect(screen.queryByLabelText('Motivo')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Observaciones')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Informe de ecografía/)).not.toBeInTheDocument()
    expect(screen.queryByText('Vacunas aplicadas')).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Atención clínica'))
    expect(screen.getByLabelText('Motivo')).toBeInTheDocument()
    expect(screen.getByLabelText('Observaciones')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Informe de ecografía/)).not.toBeInTheDocument()
    expect(screen.queryByText('Vacunas aplicadas')).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Ecografía'))
    expect(screen.getByLabelText(/Informe de ecografía/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Estudios e informes/)).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Vacuna'))
    expect(screen.getByText('Vacunas aplicadas')).toBeInTheDocument()
    expect(screen.getByText('Triple Felina')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Atención clínica'))
    expect(screen.queryByLabelText('Observaciones')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Motivo')).toBeInTheDocument()
  })
})

async function signIn(role: 'admin' | 'veterinarian') {
  fireEvent.change(await screen.findByLabelText('Email'), { target: { value: `${role}@example.test` } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'test-password' } })
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
  await screen.findByRole('heading', { name: 'Clientes' })
}

function sessionUser(role: 'admin' | 'veterinarian', name = 'Dra. Ana') {
  return { id: 1, name, email: `${role}@example.test`, role }
}

function mockFetch({ role }: { role: 'admin' | 'veterinarian' }) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    if (url.endsWith('/api/me')) return Response.json({ error: 'unauthenticated' }, { status: 401 })
    if (url.endsWith('/api/csrf-token')) return Response.json({ csrfToken: 'csrf-test' })
    if (url.endsWith('/api/login')) return Response.json(sessionUser(role))
    if (url.includes('/api/clients')) return Response.json({ items: [], pagination: { total: 0, page: 1, limit: 20 } })
    throw new Error(`Unexpected request ${url}`)
  })
}
