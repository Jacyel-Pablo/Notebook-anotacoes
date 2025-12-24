import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Index from './paginas/index.tsx'
import Criar_conta from './paginas/criar_conta.tsx'
import Home from './paginas/home.tsx'
import Ativar_usuario from './paginas/ativar_usuario.tsx'
import { useState } from 'react'
import type { JSX } from 'react/jsx-dev-runtime'

const backend = "https://notebook-anotacoes.onrender.com"
// const backend = "http://127.0.0.1:8000"
// const backend = "http://localhost:8000"

interface Protecao_list {
  [key: string]: JSX.Element
}

const protecao_list: Protecao_list = {
  "/home": <Home backend={backend}/>
}

function Protecao()
{
  const [ pag, setPag ] = useState(<div className='h-[100dvh] w-[100dvw] bg-amber-100'><h1>Carregando...</h1></div>)

  async function teste() {
    const jwt = await cookieStore.get("jwt")
    
    if (jwt?.value != undefined) {
      fetch(`${backend}/tokens/validar_jwt/`, {
        headers: {
          "Authorization": `Bearer ${jwt?.value}`
        }

      }).then(res => res.json()).then(res => {

        switch (res) {
          case true:
            setPag(protecao_list[location.pathname])
            break
            
          case false:
            cookieStore.delete("csrf_token")
            cookieStore.delete("email")
            cookieStore.delete("jwt")

            location.href = "/"
            break
        }

      })

    } else {
      cookieStore.delete("csrf_token")
      cookieStore.delete("email")
      cookieStore.delete("jwt")

      location.href = "/"
    }
  }

  teste()

  return pag
}

const rotas = createBrowserRouter([
  {
    path: "/",
    element: <Index backend={backend} />
  },
  {
    path: "/criar_conta",
    element: <Criar_conta backend={backend} />
  },
  {
    path: "/home",
    element: <Protecao/>
  },
  {
    path: "/Ativar_usuario",
    element: <Ativar_usuario backend={backend} />
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={rotas}/>
  </StrictMode>,
)
