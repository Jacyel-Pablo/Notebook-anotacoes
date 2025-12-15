import { useState } from "react"

export default function Criar_conta(props: any)
{
    const backend = props.backend

    const [ dados, setDados ] = useState({
        email: "",
        senha: "",
        confirma: ""
    })

    function pegar_dados(e: any)
    {
        setDados({
            ...dados,
            [e.target.id]: e.target.value
        })
    }

    async function enviar_dados()
    {
        if (dados.email.length < 5 || dados.senha.length < 5) {
            alert("Email e senha precisam ter no minimo 5 caracteres")

        } else {
            if (dados.senha === dados.confirma) {
                await fetch(`${backend}/cadastro/criar_conta/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(dados)

                }).then(res => res.json()).then(res => {
                    if (res["valor"].length <= 0) {
                        alert(res["erro"])

                    } else {
                        alert("Usuário criado com sucesso\nenviamos um email para ativar seu usuário\nverifique seu email se não estive aparecendo vai na sua caixa de spam")

                        location.href = "/"
                    }
                })

            } else {
                alert("As senhas são diferentes")
            }
        }
    }

    return (
        <div className="h-[100dvh] w-[100dvw] flex items-center justify-center bg-amber-100">
            <form className="h-[38%] xl:w-[40%] lg:w-100% w-[100%] bg-[url(./assets/login.jpg)] bg-cover bg-no-repeat overflow-hidden">
                <div className="w-[100%] grid grid-cols-3 text-end overflow-hidden lg:mt-7 mt-3 md:mt-32">
                    <p className="mr-5 text-3xl">Email:</p>
                    <input onChange={e => pegar_dados(e)} className="bg-gray-200 h-8 w-60 ml-0 mt-1 border-2 rounded-2xl p-3" id="email" type="email" placeholder="Insira seu email:" />
                </div>

                <div className="w-[100%] grid grid-cols-3 text-end overflow-hidden mt-3">
                    <p className="mr-5 text-3xl">Senha:</p>
                    <input onChange={e => pegar_dados(e)} className="bg-gray-200 h-8 w-60 ml-0 mt-1 border-2 rounded-2xl p-3" id="senha" type="password" placeholder="Insira uma senha:" />
                </div>

                <div className="w-[100%] grid grid-cols-3 text-end overflow-hidden mt-3">
                    <p className="mr-5 text-2xl">Confirme sua enha:</p>
                    <input onChange={e => pegar_dados(e)} className="bg-gray-200 h-8 w-60 ml-0 mt-1 border-2 rounded-2xl p-3" id="confirma" type="password" placeholder="Insira sua senha novamente:" />
                </div>
            
                <input onClick={() => enviar_dados()} className="text-white bg-orange-800 rounded-4xl border-2 border-black h-12 w-32 mt-5 ml-[50%]" type="button" value="Criar" />
            </form>
        </div>
    )
}