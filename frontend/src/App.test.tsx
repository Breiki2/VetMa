import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App } from './App'

afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('VetMa workspace', () => {
  it('signs in and shows the veterinarian client workspace', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input)
      if (url.endsWith('/api/me')) return Response.json({error:'unauthenticated'}, {status:401})
      if (url.endsWith('/api/csrf-token')) return Response.json({csrfToken:'csrf-test'})
      if (url.endsWith('/api/login')) return Response.json({id:1,name:'Dra. Ana',email:'ana@example.test',role:'veterinarian'})
      if (url.includes('/api/clients')) return Response.json({items:[],pagination:{total:0}})
      throw new Error(`Unexpected request ${url}`)
    })
    render(<App />)
    fireEvent.change(await screen.findByLabelText('Email'), {target:{value:'ana@example.test'}})
    fireEvent.change(screen.getByLabelText('Contraseña'), {target:{value:'secret'}})
    fireEvent.click(screen.getByRole('button', {name:'Iniciar sesión'}))
    expect(await screen.findByRole('heading', {name:'Clientes'})).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/clients?q='), expect.objectContaining({credentials:'include'})))
  })
})
