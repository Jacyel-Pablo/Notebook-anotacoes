import { useState } from "react"
import getCookie from "./pegar_cookies"

export default function Index(props:any)
{
    const backend = props.backend
    const csrf_token = getCookie("csrftoken")

    const [ dados, setDados ] = useState({
        nome: "",
        senha: ""
    })

    function pegar_dados(e: any)
    {
        setDados({
            ...dados,
            [e.target.id]: e.target.value
        })
    }

    function enviar_dados()
    {
        // Metódo para validar se email e senha do usuário são validos
        const response = fetch(`${backend}/login/login/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        })

        const csrf_token_res = fetch(`${backend}/tokens/csrf_token/`, {credentials: "include"})

        response.then(async res => {
            if (res.status === 200) {
                csrf_token_res.then(async res1 => {

                    const response_ = await res1.json()

                    if (res1.status === 200) {

                        // Pegando o id do usuario para colocar no jwt
                        let id = await res.json()
                        id = id["valor"] 

                        const jwt_response = fetch(`${backend}/tokens/jwt/?id=${id}`, {
                            headers: {
                                "Content-Type": "application/json",
                                "X-CSRFToken": csrf_token ?? "",
                            },
                            credentials: "include"

                        })

                        jwt_response.then(async jwt => {
                            
                            const json_jwt = await jwt.json() 

                            if (jwt.status === 200) {
                                await cookieStore.set("csrftoken", response_["valor"])
                                await cookieStore.set("jwt", json_jwt["valor"])
                                location.href = "/home"

                            } else {
                                alert(json_jwt["erro"])
                            }
                        })

                    } else {
                        alert(response_["erro"])
                    }
                })

            } else {
                const erro = await res.json()

                alert(erro["erro"])
            }
        })

    }

    return (
        <div className="h-[100dvh] w-[100dvw] flex items-center justify-center bg-orange-100">
            <form className="h-[38%] xl:w-[40%] w-[100%] rounded-4xl bg-[url(./assets/login.jpg)] bg-cover bg-no-repeat overflow-hidden">
                <div className="w-[100%] grid grid-cols-3 text-end overflow-hidden md:mt-28 lg:mt-7 md:mt-32 mt-5">
                    <p className="mr-5 text-3xl">Nome:</p>
                    <input onChange={e =>  pegar_dados(e)} className="bg-gray-200 h-8 lg:w-64 w-60 ml-0 mt-1 border-2 rounded-2xl p-3" id="nome" type="text" placeholder="Insira um nome:" />
                </div>

                <div className="w-[100%] grid grid-cols-3 text-end overflow-hidden mt-3">
                    <p className="mr-5 text-3xl">Senha:</p>
                    <input onChange={e => pegar_dados(e)} className="bg-gray-200 h-8 lg:w-64 w-60 ml-0 mt-1 border-2 rounded-2xl p-3" id="senha" type="password" placeholder="Insira uma senha:" />
                </div>

                <p className="mt-5 ml-44">Não tem uma conta ? <a className="text-blue-500" href="/criar_conta">Crie uma</a></p>
            
                <input onClick={() => enviar_dados()} className="text-white bg-orange-800 rounded-4xl border-2 border-black h-12 w-32 mt-5 ml-[50%] hover:bg-amber-950 active:bg-amber-950" type="button" value="Entrar" />
            </form>
        </div>
    )
}