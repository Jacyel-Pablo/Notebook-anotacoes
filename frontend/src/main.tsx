import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Index from './paginas/index.tsx'
import Criar_conta from './paginas/criar_conta.tsx'
import Home from './paginas/home.tsx'
import { useState } from 'react'
import type { JSX } from 'react/jsx-dev-runtime'

const backend = import.meta.env.VITE_URL_BACK

interface Protecao_list {
  [key: string]: JSX.Element
}

const protecao_list: Protecao_list = {
  "/home": <Home backend={backend}/>
}

function sair_usuario(): void {
  cookieStore.delete("csrftoken")
  cookieStore.delete("jwt")
  location.href = "/"
}

function Protecao()
{
  const [ pag, setPag ] = useState(<div className='h-[100dvh] w-[100dvw] bg-amber-100'><h1>Carregando...</h1></div>)

  async function protegendo_telas() {
    const jwt = await cookieStore.get("jwt")
    
    if (jwt?.value != undefined) {
      await fetch(`${backend}/tokens/validar_jwt/`, {
        headers: {
          "Authorization": `Bearer ${jwt?.value}`
        }

      }).then(async res => {

        if (!jwt?.value && res.status === 500) {
          alert("Token de usuário inválido")
          sair_usuario()

        } else if (res.status === 403) {
          alert("Limite de requisição atingida tenter novamente mas tarde")
          sair_usuario()
        }

        const validar_jwt_res = await res.json()
        
        if (res.status === 200) {
          switch (validar_jwt_res) {
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
        }
      })

    } else {
      cookieStore.delete("csrf_token")
      cookieStore.delete("email")
      cookieStore.delete("jwt")

      location.href = "/"
    }
  }

  protegendo_telas()

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
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={rotas}/>
  </StrictMode>,
)
