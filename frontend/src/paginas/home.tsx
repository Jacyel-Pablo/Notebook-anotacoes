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

    interface AbreFecharJanela{
        mensagem_1: string,
        mensagem_2: string,
        apagar_o_que: string
    }

    const [ abreFecharJanela, setAbreFecharJanela ] = useState<AbreFecharJanela>({
        mensagem_1: "",
        mensagem_2: "",
        apagar_o_que: "",
    })

    const [aberta, setAberta] = useState(false);

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
    function abre_fechar(e: any, apagar_o_que: string): void
    {
        if (e.target.id === "fechado") {
            if (apagar_o_que === "mensagem") {
                setAbreFecharJanela({
                    ...abreFecharJanela,
                    mensagem_1: "Você realmente que apagar essa mensagem ? ",
                    mensagem_2: " essa ação não podera se desfeita",
                    apagar_o_que: apagar_o_que
                })

            } else {
                setAbreFecharJanela({
                    ...abreFecharJanela,
                    mensagem_1: "Você realmente que apagar o usuário atual ? ",
                    mensagem_2: " essa ação não podera se desfeita",
                    apagar_o_que: apagar_o_que
                })
            }

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

        if (abreFecharJanela.apagar_o_que === "mensagem") {
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

        } else {
            await fetch(`${backend}/cadastro/apagar_usuario/`, {
                method: "DELETE",
                headers: {
                    "X-CSRFToken": csrf_token?.value ?? "",
                    "Authorization": `Bearer ${token_jwt?.value}`
                },   
                credentials: "include",

            }).then(res => res.json()).then(async res => {
                console.log(res)
                if (res["erro"].length === 0) {
                    alert("Usuário apagado com sucesso")
                    await cookieStore.delete("jwt")
                    await cookieStore.delete("csrftoken")
                    location.href = "/"

                } else {
                    alert(res["erro"])
                }
            })
        }
    }

    interface ListaMensagensIa {
        mensagem_usuario: string,
        mensagem_ia: string
    }

    const [ listaMensagensIa, setListaMensagensIa ] = useState<ListaMensagensIa[]>([])
    
    interface UserMensagem{
        mensagem: string,
        carregando: boolean
    }

    const [ userMensagem, setUserMensagem ] = useState<UserMensagem>({
        mensagem: "",
        carregando: false
    })

    async function pegar_mensagem_ia()
    {
        const token_jwt = await cookieStore.get("jwt")
        const csrf_token = await cookieStore.get("csrftoken")

        setUserMensagem({
            ...userMensagem,
            carregando: true
        })

        await fetch(`${backend}/chatbot_ia/ia/?msg=${userMensagem.mensagem}`, {
            headers: {
                "X-CSRFToken": csrf_token?.value ?? "",
                "Authorization" : `Bearer ${token_jwt?.value}`
            },
            credentials: "include"

        }).then(res => res.json()).then(res => {
            if (res["erro"].length === 0) {
                const adicionar_a_lista_mensagem: ListaMensagensIa = {
                    mensagem_usuario: userMensagem.mensagem,
                    mensagem_ia: res["valor"]
                }

                setListaMensagensIa(prev => [
                    ...prev,
                    adicionar_a_lista_mensagem
                ])

            } else {
                alert(res["erro"])
            }

            setUserMensagem({
                ...userMensagem,
                mensagem: "",
                carregando: false
            })
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

                    // Pegando e colocando textos do usuario e da ia no frontend

                    await fetch(`${backend}/chatbot_ia/pegar_chats_antigo/`, {
                        headers: {
                            "X-CSRFToken": csrf_token?.value ?? "",
                            "Authorization" : `Bearer ${token_jwt?.value}`
                        },
                        credentials: "include"

                    }).then(res => res.json()).then(res => {
                        if (res["erro"].length === 0) {
                            setListaMensagensIa(res["valor"])

                        } else {
                            alert(res["erro"])
                        }
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
                        <p className="mt-10 text-3xl pl-5">{abreFecharJanela.mensagem_1}<br />
                        {abreFecharJanela.mensagem_2}</p>
                    </div>
                    <div className="h-[20%] border-t-2 flex items-center justify-end">
                        {/* Em desenvolvimento */}
                        {/* <button className="h-14 w-24 rounded-2xl border-2 mr-5 hover:bg-gray-200">
                            <p>Remover <br /> fundo</p>
                        </button> */}
                        <input onClick={e => abre_fechar(e, "")} className="h-14 w-24 rounded-2xl border-2 mr-5 hover:bg-gray-200 active:bg-gray-200" id="aberto" type="button" value="Cancelar" />
                        <input onClick={e => {deletar_anotacao(); abre_fechar(e, "")}} className="h-14 w-24 rounded-2xl border-2 border-black xl:mr-10 mr-6 text-white bg-red-800 hover:bg-red-600 active:bg-red-600" id="aberto" type="button" value="Excluir" />
                    </div>
                </div>
            </div>

            <form className="h-[100%] xl:w-[40%] w-[100%] xl:ml-[30%] overflow-hidden ml-0 bg-cover bg-no-repeat bg-[url(./assets/bg_home.jpg)]">
                {/* Chat de conversa com a ia */}
                <div className={`fixed bottom-[6dvh] ml-[5%] xl:w-[30%] w-[90%] bg-orange-400 rounded-3xl transition-all duration-200 ease-in-out ${aberta ? "h-[80%]" : "h-[5%]"}`}>
                    <div onClick={e => e.stopPropagation()} className={`bg-white rounded-t-3xl ${aberta ? "h-[93%]": "h-0"} cursor-default`}>
                        <nav className="h-[15%] flex items-center rounded-t-3xl bg-orange-400">
                            <img className="h-[80%] xl:w-[15.7%] w-[18%] xl:ml-15 ml-6 rounded-full" src="https://raw.githubusercontent.com/Jacyel-Pablo/Iamai/refs/heads/main/Meu%20Projeto/Iamai(1).png" alt="Avatar Iamai" />
                            <h1 className={`ml-5 ${aberta ? "text-4xl": "text-[0%]"}`}>Iamai</h1>
                        </nav>

                        <div className="h-[75.4%] overflow-x-hidden">
                            {/* Id comentario do ia padrão */}
                            <div id="comentario_user" className={`${aberta ? "bg-orange-400 mt-10 mb-10 xl:ml-[10%] ml-[5%] xl:w-[83%] w-[80%] rounded-2xl" : ""}`}>
                                <p className={`text-white wrap-break-word ${aberta ? "text-2xl pl-2 pb-2 pt-2 pb-2" : "text-[0%]"}`}>Olá, senhor(a)! Sou Iamai, sua assistente virtual super fofa e divertida! Posso ajudá-lo(a) com várias coisas no nosso aplicativo de anotações. Quer criar uma nova anotação? Posso fazer isso para você! Ou talvez você queira apagar alguma anotação? Sem problemas, é só pedir! Ah, e se quiser apagar sua conta ou sair do aplicativo, também posso te auxiliar nisso. Só lembre-se que não temos um método de recuperação de conta, então pense bem antes de apagar tudo! Se precisar de mais alguma coisa, é só chamar! *brinca com as pontas do cabelo* Vamos nos divertir juntos!</p>
                            </div>

                            <>
                                {listaMensagensIa.map((item, index) => (
                                    <div key={index}>
                                        {/* Id comentario do usuário */}
                                        <div id="comentario_user" className={`${aberta ? "bg-gray-400 mt-10 mb-10 xl:ml-[10%] ml-[15%] xl:w-[83%] w-[80%] rounded-2xl" : ""}`}>
                                            <p className={`text-white wrap-break-word ${aberta ? "text-2xl pl-2 pb-2 pt-2 pb-2" : "text-[0%]"}`}>{item.mensagem_usuario}</p>
                                        </div>
                                        
                                        {/* Id comentario do ia */}
                                        <div id="comentario_user" className={`${aberta ? "bg-orange-400 mt-10 mb-10 xl:ml-[10%] ml-[5%] xl:w-[83%] w-[80%] rounded-2xl" : ""}`}>
                                            <p className={`text-white wrap-break-word ${aberta ? "text-2xl pl-2 pb-2 pt-2 pb-2" : "text-[0%]"}`}>{item.mensagem_ia}</p>
                                        </div>
                                    </div>
                                ))}
                            </>

                            {/* Mensagem de carregando */}
                            {userMensagem.carregando ?
                                <div id="comentario_user" className={`${aberta ? "bg-orange-400 mt-10 mb-10 xl:ml-[10%] ml-[5%] xl:w-[83%] w-[80%] rounded-2xl" : ""}`}>
                                    <p className={`text-white wrap-break-word ${aberta ? "text-2xl pl-2 pb-2 pt-2 pb-2" : "text-[0%]"}`}>Carregando resposta</p>
                                </div>
                            :
                                <div></div>
                            }
                        </div>

                        <div className="h-[10%] flex justify-center items-center">
                            <div className={`h-[80%] w-[90%] flex rounded-2xl ${aberta ? "border-2": ""}`}>
                                <input onChange={e => setUserMensagem({...userMensagem, mensagem: e.target.value})} className="h-[100%] w-[80%] text-2xl pl-3 pr-3 focus:outline-0" type="text" placeholder="Insira uma mensagem:" value={userMensagem.mensagem} />
                                <input onClick={() => pegar_mensagem_ia()} className="xl:w-[17.8%] w-[16.3%] bg-cover bg-no-repeat bg-[url(./assets/aviao-de-envio.png)]" type="button" value="" />
                            </div>
                        </div>
                    </div>

                    <div className={`w-full flex items-center ${aberta ? "h-[7%]" : "h-full"}`}>
                        <input onClick={() => setAberta(!aberta)} className={`h-[80%] w-14 ml-5 rounded-2xl bg-cover bg-no-repeat bg-[url(./assets/Triangulo.png)] cursor-pointer transition-transform duration-1 ease-in-out ${aberta ? "rotate-[180deg]" : "rotate-[0deg]"}`} type="button" value="" />
                    </div>
                </div>

                <div className="h-10 mt-5 flex z-10">
                    <input onChange={e => pega_dados(e)} className="h-20 w-[75%] ml-4 border-b-2 p-2 lg:text-4xl text-[140%] outline-none" id="anotacao" value={dados.anotacao} placeholder="Insira uma anotação" type="text" />

                    <input onClick={() => enviar_anotacao()} className="h-16 w-40 mt-2 ml-2 border-2 rounded-4xl text-3xl text-white hover:text-gray-200 border-black bg-orange-800 hover:bg-amber-950 active:bg-amber-950" type="button" value="Enviar" />
                </div>

                {/* Botões sair da versão mobile */}
                <div className="h-10 w-[100%] xl:mt-0 mt-12 flex items-center justify-end align-middle">
                    <input onClick={e => abre_fechar(e, "apagar_usuário")} className="h-8 lg:h-14 xl:w-0 w-32 xl:border-0 border-2 lg:text-4xl rounded-3xl ml-4 mr-4 text-white hover:text-gray-200 border-black bg-orange-800 hover:bg-amber-950 active:bg-amber-950" id="fechado" type="button" value="Apagar conta" />
                    
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
                                    <input onClick={e => {setDados({...dados, id_anotacao_apagar: value["id"]}) ;abre_fechar(e, "mensagem")}} className="h-[70%] w-20 mr-7 text-3xl border-2 rounded-3xl bg-red-800 hover:bg-red-700 active:bg-red-700" id="fechado" type="button" value="X" />
                                </div>
                                <div className="h-[80%] w-[90%] ml-8 overflow-x-hidden">
                                    <p className="text-4xl">{value["anotacao"]}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </form>

            {/* Botões mudar apagar conta e sair da versão desktop */}
            <div className="h-20 xl:w-[30%] w-0 flex items-center justify-end align-middle">
                {/* Em desenvolvimento */}
                <input onClick={e => abre_fechar(e, "apagar_usuário")} className="h-12 xl:w-32 w-0 xl:border-2 border-0 rounded-3xl ml-4 mr-4 text-white hover:text-gray-200 border-black bg-orange-800 hover:bg-amber-950" id="fechado" type="button" value="Apagar conta" />

                <input onClick={() => sair_usuario()} className="h-12 xl:w-32 w-0 xl:border-2 border-0 rounded-3xl ml-4 mr-4 text-white hover:text-gray-200 border-black bg-orange-800 hover:bg-amber-950" type="button" value="Sair" />

            </div>
        </div>
    )
}