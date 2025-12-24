import { useEffect, useState, useRef } from "react"

export default function Home(props: any)
{
    const backend = props.backend
    // Pegando csrf_token do navegador

    interface Anotacoes_list {
        id: string,
        anotacao: string,
        data: string
    }

    interface Dados {
        anotacao: string,
        anotacoes_list: Anotacoes_list[]

        id_anotacao_apagar: string,
        csrftoken: CookieListItem | null
    }

    const [ dados, setDados ] = useState<Dados>({
        anotacao: "",
        anotacoes_list: [],

        id_anotacao_apagar: "",
        csrftoken: null
    })

    function pega_dados(e: any):void
    {
        setDados({
            ...dados,
            [e.target.id]: e.target.value
        })
    }

    function sair_usuario():void
    {
        cookieStore.delete("csrftoken")
        cookieStore.delete("jwt")
        location.href = "/"
    }

    async function enviar_anotacao()
    {
        const csrf_token = await cookieStore.get("csrftoken")
        const token_jwt = await cookieStore.get("jwt")

        if (dados.anotacao.length >= 10) {
            await fetch(`${backend}/anotacao/enviar_anotacao/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrf_token?.value ?? "",
                    "Authorization": `Bearer ${token_jwt?.value}`
                },
                body: JSON.stringify({
                    anotacao: dados.anotacao,
                })

            }).then(res => res.json()).then(res => {
                if (res["valor"] === true) {
                    const copy_dados: Anotacoes_list[] = dados.anotacoes_list
                    copy_dados.push(res["dados"])

                    setDados({
                        ...dados,
                        anotacao: "",
                        anotacoes_list: copy_dados
                    })

                } else {
                    alert(res["erro"])

                    if (res["erro"] === "Ocorreu um erro o token de login e inválido" || res["erro"] === "usuário inválido") {
                        sair_usuario()
                    }
                }
            })

        } else {
            alert("Sua anotação precisa ter no minimo 10 caracteres")
            setDados({
                ...dados,
                anotacao: "",
            })
        }
    }

    // Elemento da janela que pergunta se realmente vc que apagar a mensagem
    const elemento_abre_fechar: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null)

    // Essa função abre e fechar a janela que pergunta se realmente vc que apagar a mensagem
    function abre_fechar(e: any): void
    {        
        if (e.target.id === "fechado") {
            // Pegar elemento para remover-lo na função deletar_anotacao
            anotacao_element.current = e.target.parentElement?.parentElement

            // abre a tela de confirmação para apagar mensagem
            elemento_abre_fechar.current!.className = "h-[100dvh] w-[100dvw] fixed"
        
        } else {
            // pegar div corpo
            elemento_abre_fechar.current!.className = "h-[0dvh] w-[0dvw] fixed"
        }
    }

    // Aqui vai ficar o elemento da anotacao que vai se "apagada"
    const anotacao_element: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null)

    async function deletar_anotacao()
    {
        const csrf_token = await cookieStore.get("csrftoken")
        const token_jwt = await cookieStore.get("jwt")

        await fetch(`${backend}/anotacao/apagar_anotacao/`, {
            method: "DELETE",
            credentials: "include",
            headers: {
                "X-CSRFToken": csrf_token?.value ?? "",
                "Authorization": `Bearer ${token_jwt?.value}`
            },
            body: JSON.stringify({
                id_anotacao: dados.id_anotacao_apagar,
            })

        }).then(res => res.json()).then(res => {
            if (res["valor"] === true) {
                alert("Mensagem apagadar com sucesso!")

                anotacao_element.current!.className = "h-[0%] overflow-hidden mt-0 ml-0"
                anotacao_element.current = null

                setDados({
                    ...dados,
                    id_anotacao_apagar: ""
                })

            } else {
                alert(res["erro"])

                if (res["erro"] === "usuário inválido") {
                    sair_usuario()
                }

                setDados({
                    ...dados,
                    id_anotacao_apagar: ""
                })
            }
        })
    }

    useEffect(() => {
        async function main()
        {
            const csrf_token = await cookieStore.get("csrftoken")
            const token_jwt = await cookieStore.get("jwt")

            await fetch(`${backend}/anotacao/pegar_anotacao/`, {
                credentials: "include",
                headers: {
                    "X-CSRFToken": csrf_token?.value ?? "",
                    "Authorization": `Bearer ${token_jwt?.value}`
                }

            }).then(res => res.json()).then(async res => {
                if (res["valor"] === true) {
                    setDados({
                        ...dados,
                        anotacoes_list: res["dados"],
                    })

                } else {
                    if (res["erro"] != undefined) {
                        alert(res["erro"])

                        if (res["erro"] === "Ocorreu um erro o token de login e inválido" || res["erro"] === "usuário inválido") {
                            sair_usuario()
                        }
                    }
                }
            })
        }

        main()

    }, [])

    return (
        <div className="h-[100dvh] flex bg-amber-100">

            {/* Tela excluir mensagem */}
            {/* Div corpo */}
            <div ref={elemento_abre_fechar} className="h-[0dvh] w-[0dvw] fixed">
                <div className="h-[60%] w-[100%] rounded-3xl xl:w-[35%] mt-[20dvh] xl:ml-[32.5%] bg-white">
                    <div className="h-[80%] overflow-hidden">
                        <p className="mt-10 text-3xl pl-5">Você realmente que apagar essa mensagem ? <br />
                         essa ação não podera se desfeita</p>
                    </div>
                    <div className="h-[20%] border-t-2 flex items-center justify-end">
                        {/* Em desenvolvimento */}
                        {/* <button className="h-14 w-24 rounded-2xl border-2 mr-5 hover:bg-gray-200">
                            <p>Remover <br /> fundo</p>
                        </button> */}
                        <input onClick={e => abre_fechar(e)} className="h-14 w-24 rounded-2xl border-2 mr-5 hover:bg-gray-200 active:bg-gray-200" id="aberto" type="button" value="Cancelar" />
                        <input onClick={e => {deletar_anotacao(); abre_fechar(e)}} className="h-14 w-24 rounded-2xl border-2 border-black xl:mr-10 mr-6 text-white bg-red-800 hover:bg-red-600 active:bg-red-600" id="aberto" type="button" value="Excluir" />
                    </div>
                </div>
            </div>

            <form className="h-[100%] xl:w-[40%] w-[100%] xl:ml-[30%] overflow-hidden ml-0 bg-cover bg-no-repeat bg-[url(./assets/bg_home.jpg)]">
                <div className="h-10 mt-5 flex z-10">
                    <input onChange={e => pega_dados(e)} className="h-20 w-[75%] ml-4 border-b-2 p-2 lg:text-4xl text-[140%] outline-none" id="anotacao" value={dados.anotacao} placeholder="Insira uma anotação" type="text" />

                    <input onClick={() => enviar_anotacao()} className="h-16 w-40 mt-2 ml-2 border-2 rounded-4xl text-3xl text-white hover:text-gray-200 border-black bg-orange-800 hover:bg-amber-950 active:bg-amber-950" type="button" value="Enviar" />
                </div>

                {/* Botões sair da versão mobile */}
                <div className="h-10 w-[100%] xl:mt-0 mt-12 flex items-center justify-end align-middle">
                    <input onClick={() => sair_usuario()} className="h-8 lg:h-14 xl:w-0 w-32 xl:border-0 border-2 lg:text-4xl rounded-3xl ml-4 mr-4 text-white hover:text-gray-200 border-black bg-orange-800 hover:bg-amber-950 active:bg-amber-950" type="button" value="Sair" />

                </div>

                {/* Corpo aonde vai ficar as mensagens */}
                <div className="h-[74%] lg:h-[85.6%] overflow-y-auto overflow-x-hidden mt-[2%]">
                    {/* Folha de anotações */}
                    {dados.anotacoes_list.map((value, i) => {
                        return (
                            <div key={i} className={`h-80 w-[75%] ml-12 mt-12 overflow-x-auto bg-[url(./assets/Folhas-de-anotacoes.jpg)] bg-cover bg-no-repeat`}>
                                <div className="h-16 flex items-center justify-end">
                                    {/* Pegando a data e colocando ela em dia mes e ano */}
                                    <p className="text-2xl mr-7">{value["data"].split("-")[2] + "/" + value["data"].split("-")[1] + "/" + value["data"].split("-")[0]}</p>
                                    <input onClick={e => {setDados({...dados, id_anotacao_apagar: value["id"]}) ;abre_fechar(e)}} className="h-[70%] w-20 mr-7 text-3xl border-2 rounded-3xl bg-red-800 hover:bg-red-700 active:bg-red-700" id="fechado" type="button" value="X" />
                                </div>
                                <div className="h-[80%] w-[90%] ml-8 overflow-x-hidden">
                                    <p className="text-4xl">{value["anotacao"]}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </form>

            {/* Botões mudar fundo e sair da versão desktop */}
            <div className="h-20 xl:w-[30%] w-0 flex items-center justify-end align-middle">
                {/* Em desenvolvimento */}
                {/* <input className="h-12 xl:w-32 w-0 xl:border-2 border-0 rounded-3xl text-white hover:text-gray-200 border-black bg-orange-800 hover:bg-amber-950" type="button" value="Mudar fundo" /> */}

                <input onClick={() => sair_usuario()} className="h-12 xl:w-32 w-0 xl:border-2 border-0 rounded-3xl ml-4 mr-4 text-white hover:text-gray-200 border-black bg-orange-800 hover:bg-amber-950" type="button" value="Sair" />

            </div>
        </div>
    )
}