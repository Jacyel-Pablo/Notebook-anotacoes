import { useState } from "react"
import Alerta from "./alerta"

export default function Criar_conta(props: any)
{
    const backend = props.backend

    const [ dados, setDados ] = useState({
        nome: "",
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

    interface Erro {
        mensagemErro: string,
        porcentagem: string
    }

    const [ erro, setErro ] = useState<Erro>({
        mensagemErro: "",
        porcentagem: "0"
    })

    function passaErro(mensagemErro: string, porcentagem: string) {
        setErro({
            mensagemErro: mensagemErro,
            porcentagem: porcentagem
        })
    }

    async function enviar_dados()
    {
        if (dados.nome.length < 5 || dados.senha.length < 5) {
            passaErro("Email e senha precisam ter no minimo 5 caracteres", "100")

        } else {
            if (dados.senha === dados.confirma) {
                await fetch(`${backend}/cadastro/criar_conta/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(dados)

                }).then(async res => {

                    if (res.status == 403) {
                        passaErro("Limite de requisição atingida tenter novamente mas tarde", "100")
                    }

                    const res_json = await res.json()

                    if (res.status !== 201) {
                        passaErro(res_json["erro"], "100")

                    } else {
                        passaErro("Usuário criado com sucesso", "100")
                        // alert("Usuário criado com sucesso\nenviamos um email para ativar seu usuário\nverifique seu email se não estive aparecendo vai na sua caixa de spam")

                        location.href = "/"
                    }
                })

            } else {
                passaErro("As senhas são diferentes", "100")
            }
        }
    }

    return (
        <div className="h-[100dvh] w-[100dvw] flex items-center justify-center bg-orange-100">

            <Alerta mensagem={erro.mensagemErro} porcentagem={erro.porcentagem} passaErro={passaErro}></Alerta>

            <form className="h-[38%] xl:w-[40%] lg:w-100% w-[100%] rounded-4xl bg-[url(./assets/login.jpg)] bg-cover bg-no-repeat overflow-hidden">
                <div className="w-[100%] grid grid-cols-3 text-end overflow-hidden lg:mt-7 mt-3 md:mt-32">
                    <p className="mr-5 text-3xl">Nome:</p>
                    <input onChange={e => pegar_dados(e)} className="bg-gray-200 h-8 w-60 ml-0 mt-1 border-2 rounded-2xl p-3" id="nome" type="text" placeholder="Insira seu nome:" />
                </div>

                <div className="w-[100%] grid grid-cols-3 text-end overflow-hidden mt-3">
                    <p className="mr-5 text-3xl">Senha:</p>
                    <input onChange={e => pegar_dados(e)} className="bg-gray-200 h-8 w-60 ml-0 mt-1 border-2 rounded-2xl p-3" id="senha" type="password" placeholder="Insira uma senha:" />
                </div>

                <div className="w-[100%] grid grid-cols-3 text-end overflow-hidden mt-3">
                    <p className="mr-5 text-2xl">Confirme sua enha:</p>
                    <input onChange={e => pegar_dados(e)} className="bg-gray-200 h-8 w-60 ml-0 mt-1 border-2 rounded-2xl p-3" id="confirma" type="password" placeholder="Insira sua senha novamente:" />
                </div>
            
                <input onClick={() => enviar_dados()} className="text-white bg-orange-800 rounded-4xl border-2 border-black h-12 w-32 mt-5 ml-[50%] hover:bg-amber-950 active:bg-amber-950" type="button" value="Criar" />
            </form>
        </div>
    )
}