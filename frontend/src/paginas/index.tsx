import { useState } from "react"
import getCookie from "./pegar_cookies"

export default function Index(props:any)
{
    const backend = props.backend
    const csrf_token = getCookie("csrftoken")

    const [ dados, setDados ] = useState({
        email: "",
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
        fetch(`${backend}/login/login/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)

        }).then(res => res.json()).then(res => {
            if (res["valor"].length != 0) {
                fetch(`${backend}/tokens/csrf_token/`, {credentials: "include"}).then(res1 => res1.json()).then(res1 => {
                    if (res1["valor"].length != 0) {

                        fetch(`${backend}/tokens/jwt/`, {
                            headers: {
                                "Content-Type": "application/json",
                                "X-CSRFToken": csrf_token ?? "",
                            },
                            credentials: "include"

                        }).then(jwt => jwt.json()).then(async jwt => {
                            if (jwt["valor"].length > 0) {
                                await cookieStore.set("csrftoken", res1["valor"])
                                await cookieStore.set("jwt", jwt["valor"])
                                await cookieStore.set("email", res["valor"])
                                location.href = "/home"

                            } else {
                                alert(jwt["erro"])
                            }
                        })

                    } else {
                        alert(res1["erro"])
                    }
                })

            } else {
                alert(res["erro"])
            }
        })
    }

    return (
        <div className="h-[100dvh] w-[100dvw] flex items-center justify-center bg-amber-100">
            <form className="h-[38%] xl:w-[40%] w-[100%] bg-[url(./assets/login.jpg)] bg-cover bg-no-repeat overflow-hidden">
                <div className="w-[100%] grid grid-cols-3 text-end overflow-hidden md:mt-28 lg:mt-7 md:mt-32 mt-5">
                    <p className="mr-5 text-3xl">Email:</p>
                    <input onChange={e =>  pegar_dados(e)} className="bg-gray-200 h-8 lg:w-64 w-60 ml-0 mt-1 border-2 rounded-2xl p-3" id="email" type="email" placeholder="Insira um email:" />
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